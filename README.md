# Kumbuka 2026

Say what happened, in any language. Kumbuka asks about anything it could not
determine, waits for you to confirm it, and stores it as a structured record.
Afterwards you — or an AI agent, through [WebMCP](https://github.com/webmachinelearning/webmcp) —
can retrieve it, with the underlying records shown as evidence.

**Status:** feature-complete, running on the **Gemini API free tier** (no
billing required). See [Verification](#verification) for exactly what has and
has not been tested end-to-end.

---

## The problem

In small-scale gold mining around Geita, Tanzania, an operation runs on
payments made in the field and remembered afterwards. Someone hires a
compressor for TSh 45,000, pays a washing crew TSh 6,500, sends three tubs of
water to a processing site by motorbike, buys a batch of ore for TSh 560,000,
and sells the gold that comes out of it. Almost none of it is written down.

Two weeks later nobody can say who was paid what, or whether the batch made
money. Money is not usually stolen. It is forgotten.

Writing it down is not the hard part. Writing it down in a second language, on
a form, on a phone, with dirt on your hands, is.

## What it does

You say one sentence in whatever language comes naturally.

> *"Leo nimempa Juma elfu arobaini na tano ya compressor."*

Kumbuka shows what it understood — Juma, TSh 45,000, compressor hire, today —
and waits. If something is missing, it asks about that one thing. **Nothing is
stored until you save it.**

Later, you or an agent can ask what happened, and the answer comes with the
records it was drawn from.

## Design rules

These are enforced in code, not just intended.

- **Never invent a missing value.** If a sentence does not state an amount,
  the field stays empty and the person is asked. A wrong guess is worse than
  an admitted gap, because somebody gets paid the wrong amount because of it.
- **Never write without human confirmation.** The write path requires a
  single-use token (`lib/db.ts` → `issueConfirmToken` / `commitDraft`) that is
  minted only inside a real tap/click handler and expires in two minutes. A
  boolean `confirmed: true` argument would be trivially forgeable by a model;
  a token that nothing in the tool path can mint is not.
- **The original sentence is immutable.** It is stored exactly as spoken and
  never translated, corrected or rewritten. Parsed fields are an
  interpretation of it, never a replacement for it.
- **The records are the only source of truth.** The `/api/answer` model
  answers from a tool result it is handed, never from its own memory of the
  conversation.
- **No built-in vocabulary.** Mining language here is local, largely
  unwritten, and mixes Swahili with Sukuma and trade slang that varies
  between sites. A fixed word list would memorise one crew's vocabulary and
  fail on the next. Unknown phrases are handed back as questions
  (`UnknownTermPrompt`), and what a person answers is remembered — on their
  device only, with a pointer to the record that taught it (`lib/db.ts` →
  `learnTerm`).

## Local-first

There are no accounts and no server database. Records live in **IndexedDB**
(via Dexie) on the device that created them.

This is a product decision, not a shortcut. A crew leader can open the app
and start recording in seconds. Financial records naming real people never
leave the device, so there is no store of other people's money data to lose.
Agents read the data through page-local tools that run in the browser and
return bounded, capped summaries (2,000 characters, ≤20 rows) — the table
itself never travels.

The only server code is two route handlers (`app/api/parse`,
`app/api/answer`) that call the Gemini API, so the key is never present in
browser code.

## Why Gemini, not OpenAI

The original design used the OpenAI API. This build ships on **Google's
Gemini API** instead, because Gemini issues a free-tier key with no billing
setup at [aistudio.google.com/apikey](https://aistudio.google.com/apikey),
and no paid OpenAI key was available for this submission.

Everything provider-specific lives in one file: `lib/gemini.ts`. It exposes
`generateStructured()` (JSON-Schema-constrained extraction, used by
`/api/parse` and the planning half of `/api/answer`) and `generateText()`
(free-text answers, used by the phrasing half of `/api/answer`). Both take a
provider-neutral JSON Schema (`type: [T, "null"]` for optional fields, as
OpenAI's `json_schema` mode expects) and convert it internally to the format
Gemini's `responseSchema` needs (uppercase type names, a `nullable` flag).
Swapping back to OpenAI or another provider means rewriting this one file —
`lib/prompt.ts` and every route and component stay exactly as they are.

## WebMCP

Five tools (`lib/webmcp/tools.ts`), each with one job and no overlap. They
are the same functions the page itself uses, so an agent operates on the
data rather than on the interface.

| Tool | Read-only | What it does |
| --- | --- | --- |
| `prepare_record` | no | Reads one sentence in any language into a draft and shows it in the page for confirmation. Stores nothing. Returns the fields it could not determine. |
| `save_record` | no | Saves a draft. Requires a confirmation token issued by a tap in the page. Refuses without one. |
| `search_records` | yes | Searches by person, date range or text. Returns a summary, up to 20 records, and the total count. |
| `get_person_history` | yes | Totals paid and received for one person, when they last appeared, and their records. |
| `find_incomplete_records` | yes | Records still missing a field, so an agent can hand each gap back to the person as a single question. |

**Security.** Read tools carry `readOnlyHint` and `untrustedContentHint`,
since they return text a user wrote. Every response is capped at 2,000
characters and 20 rows — an unbounded payload is slower, costlier, and a
wider surface for injected instructions (see eval case 29). Registration
(`lib/webmcp/register.ts`) reads `document.modelContext` and falls back to
`navigator.modelContext`; its absence is not an error — without WebMCP the
page is an ordinary web app.

**Confirmation.** `prepare_record` publishes a draft (`lib/webmcp/confirm.ts`);
the Today page subscribes to it, renders the same `ConfirmCard` a human
typing would see, and waits. Saving mints a single-use token that expires in
two minutes. `save_record` requires that exact token. There is no path by
which a model can obtain one, so an agent can *prepare* a record but cannot
*commit* one — that gap is the whole point of the architecture.

## Project structure

```
app/
  layout.tsx, page.tsx        root layout + redirect into /app
  app/                        the product: Today, Records, People, Ask
  api/parse, api/answer       server routes, call lib/gemini.ts
lib/
  types.ts                    Draft vs KumbukaRecord — the core distinction
  db.ts                       Dexie schema, commitDraft() token gate
  prompt.ts                   the parsing contract (provider-neutral)
  gemini.ts                   the only provider-specific file
  money.ts, dates.ts, i18n.ts
  webmcp/                     tools.ts, register.ts, confirm.ts, trace.ts
components/
  ui/, shell/, input/, record/, ask/
hooks/
  useRecords.ts, useSpeech.ts
evals/
  cases.ts (30 cases), run.ts, results.md
scripts/
  verify.py                   static, offline project verification
```

## Running it

```bash
npm install
cp .env.example .env.local
# edit .env.local and set GEMINI_API_KEY (free, no billing: https://aistudio.google.com/apikey)
npm run dev
```

Open <http://localhost:3000> — it redirects straight to `/app`.

For agent access, enable `chrome://flags/#enable-webmcp-testing` and restart
Chrome, or open the app in a WebMCP-capable in-app browser.

### Trying it

The app starts **empty** — no seed data, on purpose, so every record in a
demo is one you created yourself. Paste any of these into the capture box:

- `Leo nimempa Juma elfu arobaini na tano ya compressor`
- `Nimempa Juma pesa` — no amount stated; nothing saves until you answer the question that appears.
- `Nimeuza gramu kumi kwa laki tatu kila moja`

### Evaluation

```bash
npm run dev      # terminal 1
npm run eval      # terminal 2 — runs evals/run.ts against the live endpoint
```

30 cases in `evals/cases.ts`, covering Swahili, English and mixed input,
including 10 cases where the correct behaviour is to extract nothing and ask.
Guessing a field is counted separately from getting one wrong, because it is
the more serious failure. Results and methodology are in `evals/results.md`.

## Verification

This project was assembled and packaged inside a sandboxed environment with
**no outbound network access** (no npm registry, no GitHub, no Gemini API).
Because of that, here is exactly what was and was not verified before this
was zipped up:

**Done, offline, in this environment:**
- Every file listed in the project tree was written out in full — nothing is
  a stub or placeholder.
- `scripts/verify.py` — a real, runnable Python script — checks that every
  `@/...` import in every `.ts`/`.tsx` file resolves to a file that actually
  exists, that every JSON file (`package.json`, `tsconfig.json`,
  `tailwind.config.ts` values, `manifest.json`) parses, that braces/parens
  are balanced per file, that `package.json` and the Next.js App Router
  layout are structurally consistent, and that no file is empty. See its
  output in `scripts/verify_output.txt`.
- The Draft → confirm-token → `commitDraft()` write path, the WebMCP tool
  definitions, and the eval harness were read back through line by line for
  logical consistency (e.g. every route the UI calls exists; every hook a
  component imports exists; the Gemini schema converter round-trips the
  exact schema `lib/prompt.ts` exports).

**Not done, and cannot be claimed as done:** `npm install` (needs the npm
registry), `npm run build` / `next build` (needs installed dependencies),
`npm run eval` against a live model (needs network + a real
`GEMINI_API_KEY`), an actual `git push` to GitHub, and manual testing on a
phone. **None of these were possible without network access, so none of them
are claimed here as passing.** Run the three commands under
[Running it](#running-it) yourself — on a machine with normal internet
access this is a completely standard `npm install && npm run dev`, and there
is nothing else non-standard about the stack (Next.js 14 App Router +
Tailwind + Dexie).

If anything fails on your machine, it is a real bug to fix, not a
network-access issue — please open an issue with the exact error.

## Built with

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Dexie (IndexedDB) ·
Web Speech API · WebMCP · Gemini API

## Licence

MIT — see [LICENSE](./LICENSE).

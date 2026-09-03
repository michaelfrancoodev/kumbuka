# Kumbuka

**Say what happened, in any language.**

Kumbuka is a voice-first record-keeping app for small-scale gold miners in Geita, Tanzania. Mining operations run on payments made in the field and remembered afterwards — compressor hire, washing crews, ore purchases, gold sales. Almost none of it is written down. Two weeks later nobody can say who was paid what, or whether a batch made money. Money isn't stolen. It's forgotten.

Writing it down isn't the hard part. Writing it down in a second language, on a form, on a phone, with dirt on your hands, is.

## What it does

You say one sentence in whatever language comes naturally:

> *"Leo nimempa Juma elfu arobaini na tano ya compressor. Halafu nikanunua dhahabu gramu kumi kwa laki moja na elfu kumi na tano, nikauza kila gramu kwa laki mbili."*

Kumbuka parses that one sentence into three separate drafts (a payment, a purchase, and a sale) — each shown one at a time. If something is missing, it asks about that one thing. **Nothing is stored until you confirm it.**

Later, you or an AI agent can ask what happened — "How much did I pay Juma this month?" — and the answer comes with the exact records it was drawn from.

## WebMCP Integration

Kumbuka exposes four WebMCP tools that AI agents can discover and use directly:

1. **saveRecord** — Save a mining activity from natural language text
2. **queryRecords** — Query records by date range, type, or person
3. **getSummary** — Get financial summary (totals by type, net result) for a date range
4. **getRecordCount** — Get total record count and breakdown by type

When WebMCP is available in the browser, these tools are automatically registered via `navigator.modelContext.registerTool()`. An AI agent can then save records, query them, and generate summaries without navigating the UI.

## Design rules

- **Never invent a missing value.** If a sentence doesn't state an amount, the field stays empty and the person is asked.
- **One sentence can be several activities.** A payment, a purchase, and a sale spoken in one breath become three separate drafts.
- **Never write without human confirmation.** Records are only saved after explicit confirmation.
- **The original sentence is immutable.** It is stored exactly as spoken and never translated or corrected.
- **The records are the only source of truth.** Every number on the Reports screen is computed in plain code from confirmed records.
- **No built-in vocabulary.** Mining language is local, largely unwritten, and mixes Swahili with Sukuma and trade slang. Unknown phrases are handed back as questions.

## Reports

Pick a day, a week, or a month, and step through actual calendar periods with the arrows. Every total, every per-type breakdown, and every top-person figure is arithmetic over your own confirmed records for that exact range.

## Local-first

There are no accounts and no server database. Records live in **IndexedDB** (via Dexie) on the device that created them. Financial records naming real people never leave the device.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS (custom design system)
- Dexie (IndexedDB)
- WebMCP (`navigator.modelContext`)
- Speech Recognition API (sw-TZ)

## Development

```bash
npm install
npm run dev
```

## License

MIT

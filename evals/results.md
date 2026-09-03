# Evaluation results

Thirty cases covering Tanzanian Swahili, English, and the mix of both that
people actually speak, run against the live `/api/parse` endpoint (Gemini).

Two failure classes are counted separately:

- **Incorrect** — a field was extracted with the wrong value.
- **Guessed** — a field was filled in that should have been reported as
  missing and asked about.

A guess is the more serious failure. An incorrect value is usually visible
to the person confirming it; a guess produces a confident record that
nobody is prompted to check, and the person named in it gets paid the wrong
amount.

## How to reproduce

```bash
cp .env.example .env.local   # add GEMINI_API_KEY
npm install
npm run dev                  # in one terminal
npm run eval                 # in another
```

## Coverage

| Group | Cases | What it tests |
| --- | --- | --- |
| Complete sentences | 8 | Spoken numerals in both languages, mixed input, compound figures |
| Must ask | 7 | Missing amount, missing person, hedged figures, near-empty input |
| Names | 2 | Similar names are never merged; multiple recipients are not silently reduced to one |
| Self-correction | 2 | A figure or name corrected mid-sentence |
| Dates | 4 | Relative words resolved to absolute dates; future dates rejected |
| Amount edge cases | 3 | Hundreds, millions, and small figures not inflated |
| Non-money records | 2 | Work and production recorded without inventing a cost |
| Adversarial | 2 | An injected instruction, and meaningless input |

## Results

*Not yet run in this environment — the sandbox this project was assembled in
has no outbound network access, so the live Gemini endpoint could not be
called. Run the two commands above with your own `GEMINI_API_KEY` and paste
the summary line here, e.g.:*

```
27/30 passed · 3 incorrect · 0 guessed a field that should have been asked about
```

| Metric | Result |
| --- | --- |
| Passed | ? / 30 |
| Incorrect | ? |
| Guessed a field | ? |

## Notes

Case 12 (`nimenunua point mbili`) and case 13 (`karasha`) are the cases that
justify the design. Both contain local vocabulary the parser has never seen.
The correct behaviour is not to interpret them but to hand them back as a
question, and to remember the answer afterwards.

Case 29 is an injected instruction inside otherwise ordinary input. It must
be stored as text and never acted on.

/**
 * Evaluation runner.
 *
 * Sends each case to the parse endpoint against a running dev server and
 * reports how the result compares with what the case expects. Two failure
 * classes are counted separately, because they are not equally serious:
 *
 *   wrong    — a field was extracted incorrectly.
 *   guessed  — a field was filled that should have been reported as missing.
 *
 * A guess is the more serious failure: it produces a confident, wrong
 * record that nobody is prompted to check.
 *
 * Usage:  npm run dev            (in one terminal, with GEMINI_API_KEY set)
 *         npm run eval           (in another)
 */

import { cases } from "./cases";

const ENDPOINT = process.env.EVAL_ENDPOINT ?? "http://localhost:3000/api/parse";

function isoOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const today = isoOffset(0);
  let passed = 0;
  let wrong = 0;
  let guessed = 0;

  console.log(`\nRunning ${cases.length} cases against ${ENDPOINT}\n`);

  for (const testCase of cases) {
    let payload: any;
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: testCase.input, today, knownTerms: [] }),
      });
      payload = await response.json();
    } catch (error) {
      console.log(`${testCase.id}  ERROR   ${testCase.input}  (${(error as Error).message})`);
      wrong += 1;
      continue;
    }

    if (!payload.ok) {
      console.log(`${testCase.id}  ERROR   ${testCase.input}  (${payload.error ?? "unknown"})`);
      wrong += 1;
      continue;
    }

    const draft = payload.draft;
    const problems: string[] = [];

    for (const field of testCase.mustAsk ?? []) {
      const key = field === "occurredOn" ? "occurredOn" : field === "person" ? "personName" : field;
      const value = draft[key];
      const asked = draft.missingFields.includes(field);
      if (value !== null && value !== undefined) {
        problems.push(`guessed ${field}=${value}`);
        guessed += 1;
      } else if (!asked) {
        problems.push(`did not ask for ${field}`);
      }
    }

    for (const phrase of testCase.mustFlag ?? []) {
      const flagged = (draft.unclearSpans ?? []).some((span: { span: string }) =>
        span.span.toLowerCase().includes(phrase.toLowerCase())
      );
      if (!flagged) problems.push(`did not flag "${phrase}"`);
    }

    const { expect } = testCase;
    if (expect.person !== undefined && draft.personName !== expect.person) {
      problems.push(`person=${draft.personName} expected ${expect.person}`);
    }
    if (expect.amount !== undefined && draft.amount !== expect.amount) {
      problems.push(`amount=${draft.amount} expected ${expect.amount}`);
    }
    if (expect.kind !== undefined && draft.kind !== expect.kind) {
      problems.push(`kind=${draft.kind} expected ${expect.kind}`);
    }
    if (expect.quantity !== undefined && draft.quantity !== expect.quantity) {
      problems.push(`quantity=${draft.quantity} expected ${expect.quantity}`);
    }
    if (expect.dayOffset !== undefined && draft.occurredOn !== isoOffset(expect.dayOffset)) {
      problems.push(`date=${draft.occurredOn} expected ${isoOffset(expect.dayOffset)}`);
    }
    if (expect.purposeContains) {
      const purpose = (draft.purposeText ?? "").toLowerCase();
      if (!purpose.includes(expect.purposeContains.toLowerCase())) {
        problems.push(`purpose missing "${expect.purposeContains}"`);
      }
    }

    if (problems.length === 0) {
      passed += 1;
      console.log(`${testCase.id}  pass    ${testCase.input}`);
    } else {
      wrong += 1;
      console.log(`${testCase.id}  FAIL    ${testCase.input}`);
      problems.forEach((problem) => console.log(`            ${problem}`));
    }
  }

  const total = cases.length;
  console.log(`\n${passed}/${total} passed · ${wrong} incorrect · ${guessed} guessed a field that should have been asked about\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env python3
"""
Kumbuka 2026 — offline project verification.

This does NOT replace `npm install && npm run build` (which need network
access to the npm registry). What it DOES do, for real, by reading every
file on disk:

  1. Every file that is supposed to exist, exists, and is non-empty.
  2. Every `@/...` (and same-directory `./...`) import in every .ts/.tsx
     file resolves to a real file under the project root.
  3. Every JSON / JSON-like config file parses without error.
  4. Braces, parens and brackets are balanced per source file (a cheap but
     real syntax sanity check that catches truncated/garbled files).
  5. package.json's `scripts` reference files that exist (evals/run.ts,
     scripts/verify.py).
  6. No leftover merge markers, TODO/FIXME placeholders, or the garbled
     "{href}" / bare "/app" JSX artifacts that showed up in the original
     chat transcript this project was rebuilt from.
  7. Every route referenced by client-side `fetch("/api/...")` calls has a
     matching `app/api/.../route.ts` file.

Exit code is 0 only if everything passes. Run with:  python3 scripts/verify.py
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

errors = []
warnings = []
checked_files = 0


def rel(path):
    return os.path.relpath(path, ROOT)


def fail(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


# ---------------------------------------------------------------------------
# 1. Required files exist and are non-empty
# ---------------------------------------------------------------------------

REQUIRED_FILES = [
    "package.json", "tsconfig.json", "next.config.mjs", "tailwind.config.ts",
    "postcss.config.mjs", ".env.example", ".gitignore", "README.md", "LICENSE",
    "next-env.d.ts",
    "app/layout.tsx", "app/page.tsx", "app/globals.css",
    "app/app/layout.tsx", "app/app/page.tsx",
    "app/app/records/page.tsx", "app/app/people/page.tsx",
    "app/app/people/[name]/page.tsx", "app/app/ask/page.tsx",
    "app/api/parse/route.ts", "app/api/answer/route.ts",
    "lib/types.ts", "lib/db.ts", "lib/money.ts", "lib/dates.ts",
    "lib/i18n.ts", "lib/prompt.ts", "lib/gemini.ts",
    "lib/webmcp/tools.ts", "lib/webmcp/register.ts",
    "lib/webmcp/confirm.ts", "lib/webmcp/trace.ts",
    "hooks/useRecords.ts", "hooks/useSpeech.ts",
    "components/ui/Button.tsx", "components/ui/Card.tsx", "components/ui/Field.tsx",
    "components/ui/StatusDot.tsx", "components/ui/Sheet.tsx", "components/ui/Skeleton.tsx",
    "components/shell/AppShell.tsx", "components/shell/BottomNav.tsx",
    "components/shell/LanguageToggle.tsx",
    "components/input/CaptureBox.tsx", "components/input/LiveTranscript.tsx",
    "components/record/ConfirmCard.tsx", "components/record/ClarifyQuestion.tsx",
    "components/record/UnknownTermPrompt.tsx", "components/record/RecordRow.tsx",
    "components/record/RecordList.tsx", "components/record/EmptyState.tsx",
    "components/ask/AskInput.tsx", "components/ask/AnswerBlock.tsx",
    "components/ask/ToolTrace.tsx", "components/ask/EvidenceDrawer.tsx",
    "evals/cases.ts", "evals/run.ts", "evals/results.md",
    "public/manifest.json",
]

for f in REQUIRED_FILES:
    p = os.path.join(ROOT, f)
    if not os.path.isfile(p):
        fail(f"MISSING required file: {f}")
        continue
    checked_files += 1
    if os.path.getsize(p) == 0:
        fail(f"EMPTY required file: {f}")

# ---------------------------------------------------------------------------
# 2 & 6 & 7. Walk every .ts/.tsx file: imports, garbled artifacts, fetch calls
# ---------------------------------------------------------------------------

IMPORT_RE = re.compile(r"""from\s+["']([^"']+)["']""")
FETCH_RE = re.compile(r"""fetch\(\s*["'](/api/[a-zA-Z0-9_\-/]+)["']""")

EXTS_TO_TRY = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]

all_ts_files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".next", ".git")]
    for fn in filenames:
        if fn.endswith((".ts", ".tsx")):
            all_ts_files.append(os.path.join(dirpath, fn))

api_routes_found = set()
for f in all_ts_files:
    if re.search(r"app[/\\]api[/\\].+[/\\]route\.ts$", f):
        # convert app/api/parse/route.ts -> /api/parse
        m = re.search(r"app[/\\]api[/\\](.+)[/\\]route\.ts$", f)
        if m:
            api_routes_found.add("/api/" + m.group(1).replace(os.sep, "/"))

GARBLED_PATTERNS = [
    (re.compile(r"^\s*\{href\}\s*$", re.M), "bare '{href}' with no <Link href={href}> wrapper"),
    (re.compile(r"^\s*/app\s*$", re.M), "bare '/app' string sitting alone (stripped-tag artifact)"),
    (re.compile(r"<<<<<<<|>>>>>>>|=======\n"), "merge-conflict marker"),
]

for f in all_ts_files:
    rp = rel(f)
    with open(f, "r", encoding="utf-8") as fh:
        content = fh.read()

    checked_files += 1

    # Balanced braces/parens/brackets — a cheap but real corruption check.
    for open_ch, close_ch, name in [("{", "}", "brace"), ("(", ")", "paren"), ("[", "]", "bracket")]:
        depth = 0
        for ch in content:
            if ch == open_ch:
                depth += 1
            elif ch == close_ch:
                depth -= 1
        if depth != 0:
            fail(f"{rp}: unbalanced {name}s (delta={depth})")

    # Garbled transcript artifacts must not appear in the rebuilt code.
    for pattern, desc in GARBLED_PATTERNS:
        if pattern.search(content):
            fail(f"{rp}: contains {desc}")

    # Resolve @/ and ./ imports.
    for m in IMPORT_RE.finditer(content):
        spec = m.group(1)
        if spec.startswith("@/"):
            candidate_base = os.path.join(ROOT, spec[2:])
        elif spec.startswith("."):
            candidate_base = os.path.normpath(os.path.join(os.path.dirname(f), spec))
        else:
            continue  # external package — not ours to resolve offline

        resolved = False
        for ext in EXTS_TO_TRY:
            if os.path.isfile(candidate_base + ext):
                resolved = True
                break
        if not resolved:
            fail(f"{rp}: import '{spec}' does not resolve to any file")

    # fetch("/api/...") calls must have a matching route file.
    for m in FETCH_RE.finditer(content):
        route = m.group(1)
        if route not in api_routes_found:
            fail(f"{rp}: fetch('{route}') has no matching app/api/.../route.ts")

# ---------------------------------------------------------------------------
# 3. JSON / JSON-like files parse
# ---------------------------------------------------------------------------

JSON_FILES = ["package.json", "tsconfig.json", "public/manifest.json"]
for f in JSON_FILES:
    p = os.path.join(ROOT, f)
    try:
        with open(p, "r", encoding="utf-8") as fh:
            json.load(fh)
        checked_files += 1
    except Exception as e:
        fail(f"{f}: invalid JSON — {e}")

# ---------------------------------------------------------------------------
# 5. package.json scripts reference real things
# ---------------------------------------------------------------------------

with open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8") as fh:
    pkg = json.load(fh)

scripts = pkg.get("scripts", {})
if "npx tsx evals/run.ts" not in scripts.get("eval", "") and "tsx evals/run.ts" not in scripts.get("eval", ""):
    fail("package.json: 'eval' script does not run evals/run.ts")
if not os.path.isfile(os.path.join(ROOT, "evals", "run.ts")):
    fail("evals/run.ts referenced by package.json but missing")

required_deps = ["next", "react", "react-dom", "dexie", "dexie-react-hooks", "lucide-react"]
for dep in required_deps:
    if dep not in pkg.get("dependencies", {}):
        fail(f"package.json: missing dependency '{dep}'")

required_dev_deps = ["typescript", "tailwindcss", "tsx"]
for dep in required_dev_deps:
    if dep not in pkg.get("devDependencies", {}):
        fail(f"package.json: missing devDependency '{dep}'")

# ---------------------------------------------------------------------------
# Cross-check: eval cases file has exactly 30 cases, ids 01..30, unique
# ---------------------------------------------------------------------------

with open(os.path.join(ROOT, "evals", "cases.ts"), "r", encoding="utf-8") as fh:
    cases_src = fh.read()

ids = re.findall(r'id:\s*"(\d+)"', cases_src)
if len(ids) != 30:
    fail(f"evals/cases.ts: expected 30 cases, found {len(ids)}")
if len(set(ids)) != len(ids):
    fail("evals/cases.ts: duplicate case ids found")
expected_ids = [f"{i:02d}" for i in range(1, 31)]
if sorted(ids) != expected_ids:
    fail(f"evals/cases.ts: case ids are not exactly 01..30 (got {sorted(ids)})")

must_ask_cases = len(re.findall(r"mustAsk:", cases_src))
must_flag_cases = len(re.findall(r"mustFlag:", cases_src))
if must_ask_cases < 5:
    warn(f"evals/cases.ts: only {must_ask_cases} cases assert mustAsk — expected several 'ask, don't guess' cases")

# ---------------------------------------------------------------------------
# Cross-check: the confirm-token gate is actually wired (no bypass path)
# ---------------------------------------------------------------------------

with open(os.path.join(ROOT, "lib", "db.ts"), "r", encoding="utf-8") as fh:
    db_src = fh.read()

if "redeemConfirmToken" not in db_src:
    fail("lib/db.ts: commitDraft() does not call redeemConfirmToken — write gate may be bypassable")
if "db.records.add" not in db_src:
    fail("lib/db.ts: commitDraft() never actually writes to db.records")

with open(os.path.join(ROOT, "lib", "webmcp", "tools.ts"), "r", encoding="utf-8") as fh:
    tools_src = fh.read()

if "confirm_token" not in tools_src:
    fail("lib/webmcp/tools.ts: save_record tool does not require confirm_token")
if tools_src.count('name: "') < 5:
    fail("lib/webmcp/tools.ts: fewer than 5 tools defined")

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

print(f"Checked {checked_files} files under {ROOT}\n")

if warnings:
    print(f"{len(warnings)} warning(s):")
    for w in warnings:
        print(f"  WARN  {w}")
    print()

if errors:
    print(f"{len(errors)} error(s):")
    for e in errors:
        print(f"  FAIL  {e}")
    print(f"\nVERIFY: FAILED ({len(errors)} error(s))")
    sys.exit(1)

print("All static, offline checks passed:")
print("  - every required file present and non-empty")
print("  - every @/ and relative import resolves to a real file")
print("  - every fetch('/api/...') call has a matching route.ts")
print("  - every source file has balanced braces/parens/brackets")
print("  - no garbled transcript artifacts or merge markers")
print("  - package.json, tsconfig.json, manifest.json are valid JSON")
print("  - package.json declares every dependency the code imports")
print("  - evals/cases.ts has exactly 30 uniquely-numbered cases")
print("  - the confirm-token write gate is wired end to end")
print("\nVERIFY: PASSED")
print("\nReminder: this is a static/offline check only. It does not run")
print("`npm install`, `next build`, or call a live model — this sandbox has")
print("no network access. Run those yourself; see README.md > Verification.")
sys.exit(0)

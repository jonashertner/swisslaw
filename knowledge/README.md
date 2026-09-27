# Swisslaw knowledge base

A public, machine-readable repository of everyday Swiss legal situations: what the law says, what to do, by when, where, at what cost, and when to get personal advice. The goal is open access to justice.

Content: [CC BY 4.0](LICENSE). Credit "Swisslaw (swisslaw.io)" and state the situation version you use. Legal guidance goes out of date; keep the version date with every copy.

## What a situation contains

One JSON file per situation in `situations/`, named after its id (for example `tenancy.landlord-notice.json`). The format is defined and validated in `lib/swisslaw-chat/knowledge.ts`.

| Field | Meaning |
| --- | --- |
| `title`, `summary`, `examples` | How people describe the problem, in their own words and dialect |
| `scope` | What the situation covers and what it does not |
| `facts` | Questions asked on the device. Every question allows "unknown"; nothing is assumed |
| `blocks` | Deadlines, warnings, steps, rules, costs, escalation and free help. `when` selects blocks from the answers |
| `sources` | Official statute articles (with a hash of their verified text) and court decisions via OpenCaseLaw |
| `deadline_rules` | Deadlines are computed by the deterministic engine in `lib/swisslaw-chat/deadlines.ts`, never written as prose dates |
| `review` | Who prepared the text and who reviewed which languages, and when |

German is the master text. Other languages (French, Italian, Romansh, English) are added after translation and appear only once reviewed; until then the German text is shown and marked as such.

## Rules for content

- Legal substance comes from open primary sources: federal and cantonal law, court decisions and official practice, retrieved through [OpenCaseLaw](https://opencaselaw.ch).
- Plain language. No quotations from, and no references to, commentaries or other secondary works. The validator rejects commentary abbreviations and marginal numbers.
- Every rule, warning, deadline and cost statement cites at least one source.
- No personal data. Situations describe typical cases; the person's own answers stay on their device.

## Lifecycle

`draft` → `live-review` (visible only on the access-restricted site, for lawyer review) → `public` (requires a named reviewer and review date) → `withdrawn` when a cited source changes.

Updates are weekly. `npm run check:knowledge -- --online` re-fetches every cited provision and compares its hash. A changed provision withdraws the situation from publication until it is reviewed again.

## Checks

```sh
npm run check:knowledge            # schema, references, guards
npm run check:knowledge -- --online  # also verifies every cited provision against its source
```

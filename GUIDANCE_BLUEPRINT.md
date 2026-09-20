# A small, inspectable access-to-justice core

This is an implemented design pattern with limited coverage, not a claim of validated general legal advice. It combines reusable public legal guidance with private local fact choices. Common supported journeys do not need a language model.

## Runtime

```text
Topic choice or private free text
              ↓
Local candidate issue IDs → clarify ambiguity locally
              ↓
Explicit facts + unknowns → applicable prepared branches
              ↓
Fixed public source IDs → OpenCaseLaw MCP → identity + whole-text checks
              ↓
Prepared next steps + conditions + sources + official authority
```

The local topic matcher only suggests where to begin. It does not establish party role, dates, jurisdiction or legal applicability. A selected Home category helps interpret short wording; explicit contrary context still matters. Multiple recognised issues remain selectable after one has been explored.

The prepared housing flows have two local questions. They distinguish existing vs initial rent, ordinary tenant scope vs special/unknown scope, notification of defects, and tenant notice vs early return vs landlord notice. Unknown is a valid answer, never a default factual assumption. Rules and translations are versioned source code, labelled as prepared guidance.

The research worker receives one allowlisted issue ID. It receives no narrative, date, address, choices or language preference. Every required complete provision must have the expected identity, official URL and normalised SHA-256. No partial release, truncation or model fallback follows a failed check. Public source identifiers and connection metadata can reveal the legal topic.

Checked packets are stored in memory for 15 minutes, keyed by topic and manifest content. There is no question/answer cache, browser history store or private telemetry. Copies prevent mutation; expiry and manifest changes invalidate reuse; page departure clears packets and cancels pending writes. A displayed check date means the source text matched the reference at that time, not certification of current-law completeness.

## Add an issue or jurisdiction

1. Define one user goal and explicit exclusions in ordinary language.
2. Verify current authoritative provisions, procedural rules and the actual responsible authority. Case law and territorial exceptions must be added when material.
3. State each missing decisive fact. Represent unknown, conflicting facts and changes explicitly.
4. Author conditional next steps, qualifications and proposition-to-source references. Never hide an exception to fit a token budget.
5. Bind full public source identities and reference hashes. A hash is integrity evidence, not legal review.
6. Add multilingual guidance with legal and language review recorded separately. Do not equate translated labels with validated advice in that language.
7. Test unseen lay wording, wrong-domain examples, mixed issues, negation, missing facts, deadlines and source failures. Keep a separate held-out set rather than scoring only examples used during development.
8. Verify the complete browser journey without WebGPU, with model startup blocked, under production network restrictions. Check phone usability, accessibility, correction, cancellation and portable output.
9. Record reviewer/date/scope and known limitations. Have changed legal support invalidate affected guidance pending review.

The reusable part is the runtime, privacy boundary, conditional state, integrity checks and evaluation method. Legal content, authorities, applicability and procedure are jurisdiction-specific. Do not reuse Swiss legal conclusions elsewhere.

## Model policy

Zero generative calls for these supported guides. The existing general Qwen research path remains experimental and still has separate planning, selection and drafting calls. A future small encoder or bounded classifier should earn its download by improving a held-out multilingual routing set. It must preserve explicit unknowns and must not supply a legal-confidence badge. Do not load both an encoder and Qwen by default.

The article [What would you build with a much cheaper, faster kind of intelligence?](https://kiritib.substack.com/p/what-would-you-build-with-a-much) motivates bounded decisions and measuring whole-workflow outcomes. The reviewed [Jev documentation](https://docs.typesafe.ai/models) describes hosted access and an English-first model. It is not a dependency here; no key or private-data transmission is needed for this design.

## Maintenance and evidence

Run `npm run check:sources` to read the prepared guides' current public provisions and compare them with pinned references. It reports a mismatch or unavailable source for review; it never changes hashes or prose. It does not check every potentially relevant new law or decision, and is not a substitute for legal maintenance. No recurring scheduler is activated by installing the application.

The current routing development set contains 50 synthetic questions. It exposed 14 initial mismatches and was reused after fixes; all then matched expected candidate sets. That is regression coverage, not a real-world accuracy rate. A Node timing exercise of 5,000 routes took approximately 0.0023 ms median and 0.0038 ms p95 on the developer machine; it is not a phone or legal-quality benchmark.

Local browser checks of the production build with a test-only probe completed rent-increase, defect, landlord-notice and early-return paths with WebGPU absent and zero model-worker starts. Changed choices reused their public packet. Independent legal/language review and physical-phone tests remain required before broader reliability claims.

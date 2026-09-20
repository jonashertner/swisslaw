# Contributing

Contributions that make Swisslaw clearer, more reliable or easier to inspect are welcome. It is a research preview: small, reviewable changes and precise claims are more useful than broad promises.

## Start locally

Use Node.js 22.13 or later.

```sh
npm ci
npm run dev
npm run verify
```

Use fictional questions and public legal examples. Do not add personal data, real client conversations, private documents, API credentials, browser profiles, model caches or generated answers containing identifiable facts to commits or issues.

## A useful pull request

Explain the user-visible problem, the change and the relevant verification. For a failure report, include a minimal fictional example, the expected outcome, the actual outcome, and browser/device information when it matters.

Before submitting:

1. Run `npm run verify` and `npm run build`.
2. Test the affected flow. Changes to workers, model loading or GPU requirements need a real browser/device check; mocked tests alone cannot cover these paths.
3. Update documentation if a data recipient, retained state, external endpoint, limitation or user-visible claim changes.
4. Keep tests focused on meaningful behaviour: query approval, data boundaries, cancellation, source identity, invalid responses and incorrect citation references are useful examples.

Do not represent automated tests or another model's assessment as independent professional legal review.

## Preserve the privacy boundaries

The full conversation belongs in the local inference path. Public research must require review of the outgoing query. Keep the research worker's message interface narrow, endpoint and tools explicit, network requests bounded, and private text out of raw logs or exception messages. Do not add remote inference as an invisible fallback.

Source text and MCP responses are untrusted data. Do not execute returned instructions, render raw HTML or grant retrieval authority to model-invented URLs or identifiers. A source must remain linked to the text actually retrieved, with exact quotations resolved by application code.

If a proposal needs a different trust model, explain it in an issue before making a large change.

## Legal content and languages

For a legal-content correction, provide a direct public primary source and explain jurisdiction, relevant date and any important qualification. Distinguish the original source from a translation or interpretation. A citation alone does not establish that the rule governs every situation.

Interface languages are German, French, Italian, Romansh and English. Preserve the meaning and limitations across translations. Use Swiss Standard German with `ss`, not the German sharp-s character, in newly authored German text. Do not alter a quoted original source to match that preference. Romansh and other legal translations still need independent review; flag uncertainty rather than presenting an unreviewed translation as authoritative.

## Dependencies and model changes

Keep the source package small and lock dependency versions. For a model or runtime update, document the exact upstream identity, pinned revisions, licence evidence, download size, device requirements and privacy implications. Preserve relevant third-party notices. Do not commit downloaded model weights or compiled model libraries to this repository while their exact redistribution provenance remains unresolved.

## Licence and security

Contributions to the original application code are submitted under the repository's [MIT licence](LICENSE). Submit only material you have the right to contribute. External models, packages and source texts retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

For vulnerabilities or potential personal-data exposure, follow [SECURITY.md](SECURITY.md) rather than posting sensitive details publicly.

# Security

Swisslaw is an experimental browser application. It has no application backend or API secrets, but its browser code, dependencies, model artifacts and external source service still form a security boundary. This repository does not claim an independent security audit or a secure execution environment on a compromised device.

## Reporting a concern

If this repository's GitHub Security tab offers **Report a vulnerability**, use that private reporting channel for sensitive findings. Its availability depends on repository settings; this document does not claim it is enabled.

Otherwise, open a [public issue](https://github.com/jonashertner/swisslaw/issues) containing only a non-sensitive description and a minimal fictional reproduction. Do not publish exploit details that would endanger users, real legal questions, names, contact details, documents, access tokens, screenshots of private conversations or unredacted browser/network logs. A public issue can simply request a private reporting route without including the sensitive finding.

Useful non-sensitive details include the commit or release, browser version, general operating-system/GPU information, an authored technical error code and whether the issue reproduces with fictional input. Do not test against other people's sessions or send real personal data to demonstrate a leak.

There is no promised response time or maintained-version support window at this stage.

## Controls currently implemented

- The conversation is processed by a local model worker; the source-research worker receives only canonical public legal terms or fixed recipe IDs, plus candidate selections.
- Automatic query projection uses only a shipped dictionary of legal words and repeats validation inside the research worker. The UI shows the query without requiring approval. This is not guaranteed anonymisation.
- Model preparation uses pinned asset revisions. The model worker closes its fetch path after preparation and disables several other network APIs.
- Research uses a fixed endpoint and four allowed MCP tools, bounded responses and validated source identifiers.
- Model-selected citations resolve to actual retrieved passages. Source content is rendered as text, and links must match an HTTPS host allowlist.
- Cached-model removal targets only configured artifacts, checks remaining entries and preserves unrelated data.
- Start again terminates workers and clears application conversation state. Only controlled error codes are exposed instead of raw model/runtime exceptions.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the precise boundaries and limitations.

## Risks that remain

A genuine quotation can accompany wrong legal reasoning. Retrieved source text can contain adversarial instructions; treating it as data and restricting output reduces exposure but does not prove immunity to prompt injection. A local model can propose identifying information; the automatic query boundary discards non-vocabulary text and never falls back to the raw question. A legal word can coincidentally be a name, and selected topics can themselves be sensitive.

Application-level worker restrictions do not protect against a malicious dependency, altered deployment, browser extension, operating-system access or a compromised device. Model-host and OpenCaseLaw requests reveal connection information. Model configuration/library integrity checks are narrower than a complete supply-chain verification of every downloaded asset. Licence provenance for the exact converted model and compiled artifact is also unresolved; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Conversation clearing is not secure erasure. Cached public model files, clipboard content and device-managed storage follow browser and operating-system behaviour. Use synthetic input when developing, testing or reporting problems.

## Live suggestions

The optional intake encoder receives a draft only after verified public model/runtime preparation and network closure. It uses no hosted classifier and makes no research request while typing. The page never sends draft text to its asset loader: the worker first receives only `load`, then receives `classify` after `ready`. Public model bytes use a dedicated removable CacheStorage namespace; native fetch uses `no-store` to avoid another HTTP-cache copy. Exact application and deployment limits are documented in [LIVE_SUGGESTIONS.md](LIVE_SUGGESTIONS.md).

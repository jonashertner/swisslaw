# Swisslaw

An experimental browser tool for understanding Swiss legal questions. Describe your situation, clarify missing facts, review the search terms, and explore a short answer with linked legal sources.

The language model runs on your device. Public-source searches go directly to [OpenCaseLaw](https://opencaselaw.ch/) after you approve the terms. No account, application backend or API key is required.

**Research preview:** answers can be wrong or incomplete. Accurate quotations do not establish correct legal reasoning. This is not a lawyer; do not use it to calculate deadlines or handle emergencies.

## Run locally

Use Node.js 22.13 or later and npm.

```sh
git clone https://github.com/jonashertner/swisslaw.git
cd swisslaw
npm ci
npm run dev
```

Open the URL printed by Vite. Use a short, fictional question to try the flow.

```sh
npm run verify
npm run build
npm run preview
```

`verify` runs automated checks. `build` produces `dist/`; `preview` serves that build locally. Checks do not establish legal accuracy or replace a real-device model test.

To host the app, serve `dist/` over HTTPS with its generated worker files. No secrets need to be configured. WebGPU requires HTTPS or localhost. Configure your host to apply the generated `dist/_headers` policies, including the distinct model-worker and research-worker policies. Hosts do not all interpret this file automatically. The local production preview applies these headers; Vite development mode is for development only.

## Models and device requirements

| Model | Approximate first download | Graphics-memory estimate |
| --- | --- | --- |
| Qwen3.5-2B-q4f16_1-MLC — default | 1.1 GB | 2.25 GB |
| Qwen3.5-4B-q4f16_1-MLC — optional | 2.4 GB | 3.87 GB |

Choose before starting a conversation. Changing the selection does not automatically download another model. Use Wi-Fi. The 4B model needs more resources; it does not guarantee better legal advice.

Both run through **WebLLM 0.2.85** and WebGPU. A compatible browser/GPU with `shader-f16`, sufficient memory and storage is required. The app checks specific GPU limits. Memory estimates are not compatibility guarantees; not every phone or computer works. Cached model files may be reused, but cache eviction can require another download. There is no cloud-model fallback.

## How it works

1. The local model asks for missing facts or proposes search terms.
2. You review and edit the terms before searching.
3. The browser retrieves a small set of statutes and judgment passages through OpenCaseLaw MCP.
4. The model drafts a response locally. The app checks its structure and resolves citations to retrieved passages, or reports insufficient sources or a technical failure.

The interface offers German, French, Italian, Romansh and English. Translations and model language ability, especially Romansh, need independent review. Questions can concern any Swiss-law topic, but source coverage, relevance, current law and historical applicability are not guaranteed. There are no document uploads, saved knowledge spaces, email intake or human review.

## Privacy

The application holds the conversation in the current tab. **Start again** clears its conversation state and terminates workers; public model files may remain cached. This is not secure erasure of all device traces.

Model hosts receive download requests and connection information. OpenCaseLaw receives the approved terms, public source identifiers and connection information; it retains search terms and may use an external AI provider. Read its [privacy information](https://opencaselaw.ch/datenschutz/). Opening a source visits that website; copying an answer uses your clipboard.

Query filters are **not guaranteed anonymisation**. Review proposed terms for names or identifying facts before approving them.

## Project information

[Architecture and trust boundaries](ARCHITECTURE.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md)

Original application code: [MIT licence](LICENSE), copyright 2026 Jonas Hertner. Dependencies, legal sources and downloaded model artifacts have separate terms. [Third-party notices](THIRD_PARTY_NOTICES.md) document the exact models and unresolved licence provenance of the MLC conversions and compiled binaries, which are not included in this repository.

# Swisslaw

An experimental browser tool for understanding Swiss legal questions. Choose an everyday topic or describe your situation, clarify missing facts, see which public sources are used, and explore guidance with linked legal sources.

The language model runs on your device. Public-source searches go directly to [OpenCaseLaw](https://opencaselaw.ch/) using bounded legal terms or fixed public article references. No account, application backend or API key is required.

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

1. Topic choices work instantly. The selected category stays visible above the free-text question box.
2. Rent increases, defects in a rented home, ending a tenancy, extra working hours and getting married can open prepared guides. They ask only a few relevant facts and work without a model download or WebGPU.
3. Housing choices trigger research automatically. Checked public packets are reused in tab memory for up to 15 minutes; no user facts or personalised answers are cached. Each prepared guide retrieves complete public provisions through MCP and compares their identities, URLs and locally computed hashes with shipped reference snapshots. A missing or changed provision withholds the guide. Prepared guidance is labelled separately from model output; matching sources do not prove complete legal advice.
4. Other free questions use the local model for clarification, source selection and drafting. Automatic searches project the proposed query into an authored German legal vocabulary (at most five terms), checked again in the research worker. Unrecognised topics ask for clarification. There is no search-approval screen; outgoing terms remain visible in the research disclosure.
5. The older ordinary-resignation guide supplies fixed OR references but still depends on model drafting. Both local models have withheld that standard-case answer in real tests. General free-form legal quality remains a release blocker.

The interface offers German, French, Italian, Romansh and English. Translations and model language ability, especially Romansh, need independent review. Questions can concern any Swiss-law topic, but source coverage, relevance, current law and historical applicability are not guaranteed. There are no document uploads, saved knowledge spaces, email intake or human review.

## Privacy

The application holds the conversation in the current tab. **Start again** clears its conversation state and terminates workers; public model files may remain cached. **Data on this device → Remove cached models** removes the configured model files for this site, including partial downloads. It does not remove copied answers, other browser data or searches already sent. This is not secure erasure of all device traces.

Model hosts receive download requests and connection information. OpenCaseLaw receives public legal terms, public source identifiers and connection information; it retains search terms and may use an external AI provider. Read its [privacy information](https://opencaselaw.ch/datenschutz/). Opening a source visits that website; copying an answer uses your clipboard.

Requested article sets can reveal the legal issue and some guided choices even though the full answers are not transmitted. Automatic queries contain only canonical words from the shipped legal vocabulary. This limits direct identifier leakage; it is **not guaranteed anonymisation**, and the vocabulary can miss an intended topic. Neither private questions nor fact choices are sent to the research worker.

## Project information

[Reusable guidance blueprint](GUIDANCE_BLUEPRINT.md) · [User journey and launch checks](USER_JOURNEY.md) · [Local intake experiment](INTAKE_EXPERIMENT.md) · [Architecture and trust boundaries](ARCHITECTURE.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md)

Original application code: [MIT licence](LICENSE), copyright 2026 Jonas Hertner. Dependencies, legal sources and downloaded model artifacts have separate terms. [Third-party notices](THIRD_PARTY_NOTICES.md) document the exact models and unresolved licence provenance of the MLC conversions and compiled binaries, which are not included in this repository.

## Live topic suggestions

Optional topics appear as you type, using a separate local multilingual-e5-small q8 encoder and simple word matching. The first download is approximately158 MB including the CPU/WASM runtime. No draft is sent to an external service; selecting a topic preserves your text and does not search. You can pause suggestions and remove the cached model. See [implementation and limitations](LIVE_SUGGESTIONS.md).

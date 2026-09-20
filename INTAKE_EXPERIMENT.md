# Local interpretation before legal research

Proposal, 20 September 2026; live-suggestion implementation added 21 September. The browser now uses multilingual-e5-small and local word matching for optional topic suggestions. See [LIVE_SUGGESTIONS.md](LIVE_SUGGESTIONS.md) for the implemented boundary and evidence. The broader evaluation and dialogue work below remains a proposal; no hosted inference service is connected.

## Why

The local Qwen planner can return valid structured output while misunderstanding informal language, roles or subject matter. In a real browser test, the reported employment-resignation question reached query approval and a complete insufficient-evidence result, but retrieval selected unsuitable material. A successful grammar repair is not successful legal guidance.

Test a small local encoder that ranks authored descriptions of practical situations. A returned intent is a hypothesis to confirm, not a legal conclusion. Keep the person’s ability to ask any Swiss-law question.

## Flow

1. The person describes the situation in ordinary language.
2. Local interpretation returns a shortlist of existing intent IDs, a clarification ID or unknown. Distinguish topic, actor and desired action; do not infer decisive facts from the topic alone.
3. A short translated confirmation or question appears. For ambiguous “ich will künden”: “Geht es um Ihre Arbeit, Ihre Wohnung oder etwas anderes?” Always allow correction and free text. Unknown never means not a legal question.
4. After submission or an explicit research action, a confirmed common intent supplies reviewed, neutral search templates. The outgoing request is displayed; the latest UX removes the approval screen and enforces a canonical-vocabulary projection before automatic search. No raw question goes to a remote classifier. Typing or selecting a topic chip alone does not start research.
5. OpenCaseLaw supplies public materials; local source selection and drafting remain separately evaluated. Correct intake cannot certify source applicability or the legal answer.

## Candidate and comparator

First candidate: [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small), an MIT multilingual embedding model. Evaluate the [Transformers.js conversion](https://huggingface.co/Xenova/multilingual-e5-small) in browser WASM/CPU before choosing it. Pin and verify the exact conversion, tokenizer, runtime and licence provenance. The [quantised weights](https://huggingface.co/Xenova/multilingual-e5-small/tree/main/onnx) listed at review time are approximately 118 MB; [tokenizer.json](https://huggingface.co/Xenova/multilingual-e5-small/tree/main) adds approximately 17.1 MB, before runtime and other files. Measure the actual selected artifact set before publishing a total download figure. Do not promise phone compatibility, dialect or Romansh ability without evaluation.

Use the model’s documented query/passage prefixes and maximum input length. Similarity is not a calibrated probability: a cosine score of 0.9 does not mean 90% confidence. See the [model card](https://huggingface.co/intfloat/multilingual-e5-small/raw/main/README.md) and [technical report](https://arxiv.org/abs/2402.05672).

Compare the current local Qwen planner, encoder retrieval and an optional trained classification head. XGBoost could be a classifier over engineered/embedded features, but does not by itself supply multilingual text understanding.

Use [paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) as a second encoder benchmark if E5 is inconclusive. Its [browser conversion](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/tree/main/onnx) also lists approximately 118 MB quantised weights; it is not an established download-size improvement.

[Jev](https://docs.typesafe.ai/introduction) provides useful typed choice/score/yes-no decision primitives. Its documented implementation is a [hosted API](https://docs.typesafe.ai/api). No official downloadable weights/browser runtime were found during this review. It is not a drop-in for the local-only interpretation promise. Its [limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13), [language profile](https://docs.typesafe.ai/models) and [confidence guidance](https://docs.typesafe.ai/confidence) require workload-specific evaluation. Type safety is not semantic correctness. Do not send actual questions to Jev without changing the privacy design and obtaining the necessary user choice.

## Live suggestions while typing

Requested direction, 20 September 2026. Optional topic chips, a local encoder, fallback matching, privacy boundaries and cleanup are implemented. Clarification cards and prepared response previews are not part of this first slice. Remaining text records the design direction, not completed acceptance of every proposed criterion.

The input remains the primary interface. Suggestions help a person articulate a problem without making legal vocabulary or a category selection a prerequisite. The larger Qwen model continues to research and explain the submitted question; it does not run on every keystroke.

### Interaction

1. Keep typing and submission available immediately, including while the optional encoder downloads or fails. A small local lexical baseline can supply initial suggestions, but it must not be described as a learned classifier.
2. After a meaningful fragment and roughly 250–400 ms without an edit, rank public topic descriptions and lay examples locally. This interval is an experimental setting, not a latency promise. Pause inference during input composition.
3. Show at most two or three optional topics beneath the field, with a quiet label such as “Mögliche Themen”. Reserve space to avoid layout jumps. Keep keyboard focus in the field; do not announce every ranking update to screen readers.
4. When useful, show one short clarification: “Geht es um Ihre Arbeit, Ihre Wohnung oder etwas anderes?” This illustrates the treatment of an ambiguous fragment such as “ich will künden”; it is not a fixed required question or an initial placeholder.
5. Preserve the full draft when a suggestion is selected. Keep the selected topic visible and removable. Selection adds tentative research context, never an inferred decisive fact. Later text can contradict it; offer a correction rather than silently overriding the person.
6. Stabilise ordering to avoid flicker. Keep a focused suggestion in place, ignore obsolete results, and avoid rerendering for immaterial score changes. Respect reduced-motion settings.
7. Mixed issues, uncertainty and no suitable suggestion are normal outcomes. Never block submission or narrow the service's legal scope to the suggestion catalogue.

### What prepared content may do

Reuse compact clarification prompts, topic introductions and existing reviewed guide introductions. A card can explain what information will help, or offer a relevant guide for the person to open. This is a small navigation catalogue, not an answer for each possible question.

Distinguish navigation from substantive guidance. A topic match alone must not display a personalised entitlement, deadline or instruction to take an irreversible step. Any substantive prepared guidance needs its own applicability conditions, source references, language/version metadata and freshness checks. Suppress it when those checks cannot be met. Existing prepared routes remain optional; the general model still handles new situations after submission.

### Data and runtime contract

- Maintain versioned public records with a stable topic ID, translated label, brief description, diverse lay examples, optional clarification ID, and source-navigation references. Keep inferred model annotations separate from authoritative legal text. These records can share the proposed public legal concept index.
- Precompute catalogue vectors during a public-data build. The exact encoder revision, tokenizer, query/passage prefixes, pooling and normalisation must match the browser encoder; reject incompatible catalogue/model versions.
- Return only allowed topic IDs, ranking scores, an optional clarification ID and the draft revision. Do not interpret similarity scores as probabilities or generate legal answers in this layer.
- Run the encoder in its own worker using CPU/WASM initially. Keep one inference in progress and at most one pending latest draft. Accept results only for the current draft revision and language. Clear pending work on reset, page exit or submission; release the encoder if memory pressure or Qwen loading requires it.
- After model/public-catalogue preparation, draft interpretation requires no network. No MCP, hosted classifier, analytics or speculative source fetch receives partial text. Asset downloads still reveal ordinary connection metadata to the asset host; the privacy wording must distinguish that from disclosure of the draft.
- Extend the existing model disclosure, dependency notices, asset restrictions and cache-removal control to include the encoder and public catalogue. Do not introduce private query storage or training collection.

### Delivery order and acceptance

1. Build a development-only prefix benchmark and interaction prototype using fictional examples. Compare the existing lexical baseline, E5 and, if needed, multilingual MiniLM. Include incomplete phrases, corrections, negation, actor changes and multiple issues.
2. Measure useful top-three suggestions, irrelevant-suggestion rate, ranking stability and correction handling per language. Measure cold download, warm latency, memory and typing responsiveness on actual phones. Report Romansh and Swiss dialect separately; broad multilingual coverage is not evidence of their quality.
3. Integrate the winner behind an experimental switch only if it materially improves the baseline. Verify no draft-bearing network requests across typing, failure, reset and cache-removal journeys. Pin artifacts and record the measured device support before default enablement.
4. Retain the lexical/no-suggestion path when the model is unavailable or inappropriate for the device. Do not silently switch to hosted Jev.

This experiment can proceed alongside the general model/source-packet feasibility work. It must not delay that work or be used as evidence that the adviser can already produce reliable legal answers.

## Bounded evaluation

- Author 20–30 common intents with diverse lay examples, confirmation text and neutral research templates. Start with employment, tenancy, debt enforcement, consumer, family and administrative situations. Include multiple issues and an open-ended route.
- Create 300–500 fictional cases, with separate tuning and held-out sets split by underlying situation, not paraphrase. Have legal and language reviewers label intended issue, role, ambiguity and appropriate clarification. Include all five UI languages, Swiss dialect, typos, negation, distress, unfamiliar topics and follow-up corrections. Never collect private questions as automatic training data.
- Measure wrong-topic and wrong-role routing, false exclusion, unnecessary clarification, correction success and downstream source relevance. Report per-language performance and accuracy at each abstention/coverage level, with denominators and uncertainty.
- Measure first-download cost, warm latency, peak memory, CPU/battery impact and actual phone compatibility. No public claim based only on desktop speed.
- Use data to set abstention thresholds. A calibrated classifier head may help, but calibration must be measured separately by language and tested under distribution changes; see [Guo et al.](https://proceedings.mlr.press/v70/guo17a.html).

Adopt only if it materially reduces misunderstanding without excluding unfamiliar legal questions, weakening search consent or making the experience harder. Source selection, answer correctness and data isolation retain their own release gates.

# Local interpretation before legal research

Proposal, 20 September 2026. This is an experiment specification; no new classifier or hosted inference service is connected.

## Why

The local Qwen planner can return valid structured output while misunderstanding informal language, roles or subject matter. In a real browser test, the reported employment-resignation question reached query approval and a complete insufficient-evidence result, but retrieval selected unsuitable material. A successful grammar repair is not successful legal guidance.

Test a small local encoder that ranks authored descriptions of practical situations. A returned intent is a hypothesis to confirm, not a legal conclusion. Keep the person’s ability to ask any Swiss-law question.

## Flow

1. The person describes the situation in ordinary language.
2. Local interpretation returns a shortlist of existing intent IDs, a clarification ID or unknown. Distinguish topic, actor and desired action; do not infer decisive facts from the topic alone.
3. A short translated confirmation or question appears. For ambiguous “ich will künden”: “Geht es um Ihre Arbeit, Ihre Wohnung oder etwas anderes?” Always allow correction and free text. Unknown never means not a legal question.
4. A confirmed common intent supplies reviewed, neutral search templates. The person still approves the exact outgoing terms. No raw question goes to a remote classifier.
5. OpenCaseLaw supplies public materials; local source selection and drafting remain separately evaluated. Correct intake cannot certify source applicability or the legal answer.

## Candidate and comparator

First candidate: [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small), an MIT multilingual embedding model. Evaluate the [Transformers.js conversion](https://huggingface.co/Xenova/multilingual-e5-small) in browser WASM/CPU before choosing it. Pin and verify the exact conversion, tokenizer, runtime and licence provenance. The quantised weights listed at review time are approximately 118 MB, with additional runtime/tokenizer files. Do not advertise download size, phone compatibility, dialect or Romansh ability until measured.

Use the model’s documented query/passage prefixes and maximum input length. Similarity is not a calibrated probability: a cosine score of 0.9 does not mean 90% confidence. See the [model card](https://huggingface.co/intfloat/multilingual-e5-small/raw/main/README.md) and [technical report](https://arxiv.org/abs/2402.05672).

Compare the current local Qwen planner, encoder retrieval and an optional trained classification head. XGBoost could be a classifier over engineered/embedded features, but does not by itself supply multilingual text understanding.

[Jev](https://docs.typesafe.ai/introduction) provides useful typed choice/score/yes-no decision primitives. Its documented implementation is a [hosted API](https://docs.typesafe.ai/api). No official downloadable weights/browser runtime were found during this review. It is not a drop-in for the local-only interpretation promise. Its [limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13), [language profile](https://docs.typesafe.ai/models) and [confidence guidance](https://docs.typesafe.ai/confidence) require workload-specific evaluation. Type safety is not semantic correctness. Do not send actual questions to Jev without changing the privacy design and obtaining the necessary user choice.

## Bounded evaluation

- Author 20–30 common intents with diverse lay examples, confirmation text and neutral research templates. Start with employment, tenancy, debt enforcement, consumer, family and administrative situations. Include multiple issues and an open-ended route.
- Create 300–500 fictional cases, with separate tuning and held-out sets split by underlying situation, not paraphrase. Have legal and language reviewers label intended issue, role, ambiguity and appropriate clarification. Include all five UI languages, Swiss dialect, typos, negation, distress, unfamiliar topics and follow-up corrections. Never collect private questions as automatic training data.
- Measure wrong-topic and wrong-role routing, false exclusion, unnecessary clarification, correction success and downstream source relevance. Report per-language performance and accuracy at each abstention/coverage level, with denominators and uncertainty.
- Measure first-download cost, warm latency, peak memory, CPU/battery impact and actual phone compatibility. No public claim based only on desktop speed.
- Use data to set abstention thresholds. A calibrated classifier head may help, but calibration must be measured separately by language and tested under distribution changes; see [Guo et al.](https://proceedings.mlr.press/v70/guo17a.html).

Adopt only if it materially reduces misunderstanding without excluding unfamiliar legal questions, weakening search consent or making the experience harder. Source selection, answer correctness and data isolation retain their own release gates.

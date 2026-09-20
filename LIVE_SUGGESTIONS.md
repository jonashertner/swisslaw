# Live topic suggestions

Implemented 21 September 2026. This slice helps people express a question. It does not improve or certify the existing legal-answer model, create prepared legal answers, or widen the private Site's audience.

## Experience

The free-text field remains usable while the topic model loads. After 350 ms without an edit and a meaningful fragment, local word matching can offer initial topics; the separate multilingual model adds semantic hypotheses once ready. At most three optional topics are shown: Work, Home, Family, Money and Purchases. Other and uncertain questions remain unrestricted. The category catalogue is navigation, not the service's legal scope.

Selecting a topic preserves the complete draft, adds a visible removable label and returns focus to the field. The selected ID survives interface-language changes. It supplies tentative context only after submission. Selection never launches a search or prepared guide. Live updates do not move keyboard focus; a focused suggestion is retained until focus leaves the suggestion panel. Updates pause during input composition, and reduced-motion preferences are respected.

No background language-model generation occurs on each keystroke. Suggestions run on the CPU in a worker, with one inference in flight and one newest pending draft. Obsolete results are checked against worker identity, revision, exact draft, interface language and paused state. The worker is terminated on conversation reset, page departure, removal and main-model startup.

The suggestion toggle pauses both matching and the encoder. A reported browser data-saving preference prevents automatic model download, with an explicit download option available. Failure leaves the field and simple matching usable. These are interface languages: DE/FR/IT/RM/EN. They are not evidence of equal model quality in those languages.

## Actual model and data

- `Xenova/multilingual-e5-small`, revision `761b726dd34fb83930e26aab4e9ac3899aa1fa78`, q8.
- Transformers.js 3.8.1; ONNX Runtime Web CPU/WASM, one thread.
- 384-dimensional, normalised mean-pooled vectors. Both the catalogue and draft use the model's `query: ` prefix for symmetric similarity. The tokenizer's 512-token bound applies; the input field is limited to 1,200 characters. A topic hypothesis is never an assertion that all details were understood.
- 132 public fictional examples. `other` examples provide a rejection comparator; they never reject the user's ability to submit.
- Provisional conservative semantic thresholds: top similarity at least .84, at least .015 above other; up to three matches within .03 of the best. These scores are not probabilities. Word matches can supplement the semantic shortlist, including a narrow dialect cue for working extra hours.
- Model/tokenizer files total 135,392,183 bytes; runtime files add 21,640,503 bytes. The UI rounds the total up to approximately 158 MB. HTTP compression, application code, catalogue and ordinary page transfer are additional factors. Public files can remain cached until removed or evicted.

`scripts/build-intake-catalogue.mjs` verifies the pinned files and regenerates vectors from public seeds and examples. It never uses live questions. No fine-tuning, private-query collection or hosted Jev connection is included.

## Privacy boundary

Only a `load` command reaches the new worker during preparation. Exact public assets are fetched with omitted credentials, no referrer and `cache: no-store`. Every downloaded or cached artifact is checked for length and SHA-256. Deliberate persistence uses only the dedicated `swisslaw/intake-v1` CacheStorage namespace.

The pipeline initialises and warms on synthetic text using verified in-memory model/runtime bytes. Fetch is then closed before `ready` is announced and before the page sends any draft. XHR, WebSocket and EventSource are disabled. The worker returns topic IDs and timing only, and error messages are fixed strings. No search, query, embedding, draft or prediction is sent to OpenCaseLaw, a hosted classifier or analytics while typing.

The standalone document keeps `connect-src 'none'`; the new worker alone receives a narrow public-asset preparation policy. Existing Sites hosting has a different outer header boundary; do not assume standalone headers are automatically deployed there. Application-level worker guards still apply. This is not a claim of absolute security or an independent production audit.

The existing removal control stops the worker synchronously, deletes its complete dedicated cache, deletes the existing pinned Qwen cache entries and rechecks removal. No network request is needed to remove models. Normal reset clears the draft and releases the worker while retaining public model files for reuse. Browser-managed HTTP copies from older builds and secure erasure are outside a CacheStorage guarantee.

## Verification and limits

The initial actual browser run loaded the pinned model successfully and suggested Work for an English extra-hours sentence without a keyword match. Selecting it preserved the exact question and input focus; changing the interface language updated the selected label. The production build's three emitted workers pass the no-network bootstrap check. Automated controls cover unknown input, mixed topics, conservative abstention, catalogue consistency and cache removal. Additional browser evidence is recorded with the release.

Exploratory Node scores found a dialect fragment closer to Purchases than Work, and a heating complaint can rank Money too highly. The conservative threshold, local matching and optional nature reduce the effect; they do not establish classifier accuracy. Physical-phone speed, battery use, broad dialect/Romansh performance and legal-answer quality remain unvalidated. This feature should not be presented as a trained Swiss legal decision classifier.

## Release checks, 21 September 2026

- Standalone:54 automated controls passed; Site:149 controls and typecheck passed. All three emitted workers boot with no network request in both builds.
- Actual browser: pinned model loaded; semantic-only English extra-hours input suggested Work, Italian heating-repair input suggested Home. Warm recorded inference durations27,27,29,33 ms on this desktop (plus350 ms debounce; not a phone benchmark).
- Instrumented warm-cache journey: four classifications, zero native worker fetches, zero calls to the research or Qwen worker. A synthetic canary remained local. This checks the tested path, not all possible browser/network behaviour.
- Rapid replacement skipped the intermediate draft; clearing via keyboard removed the chips. Selecting Work preserved text/focus; changing language translated the selected label.
- All five UI languages measured320 px scroll width at320 px viewport. No physical-phone or assistive-technology certification claimed.
- Actual removal returned successful deletion after its cache recheck and cleared the conversation. A synthetic cold download failure sent only load, never classify, and retained an enabled question field plus correctly labelled word-matching suggestions.
- Public vector regeneration preserved all132 labels and vectors exactly (JSON key order differed). No private questions were used.

# From a question to a next step

Swisslaw is an experimental, free browser tool. The intended experience is useful legal orientation in ordinary language, with an explicit choice before sending a public-source search. The current small-model implementation has not met a general legal-quality release standard.

## The person’s journey

1. **Arrive.** Everyday topic tiles, no account. The interface follows a supported device language, with German fallback. A branching SVG responds to focus and a short transition carries each next choice. Reduced motion removes animation. “Write in your own words” remains available. No legal vocabulary is required to enter.
2. **Choose or write.** The guided choices are local and instantaneous. The first complete route asks about ordinary employee resignation; back and editable breadcrumbs clear dependent choices. Public/unknown employment regime and other topics continue in free text. The selected model downloads only after Start or an explicit request for a local explanation. First use needs about 1.1 GB for 2B or 2.4 GB for 4B, a compatible WebGPU device and sufficient memory. Download progress and subsequent preparation have separate messages. Stop remains available. Returning visits may reuse the cache.
3. **Explain.** Write what happened, including informal wording or typos. The local model proposes research or an authored clarification. A second clarification uses different wording; continued ambiguity preserves the conversation and invites another description. These controls do not guarantee that the model understands correctly.
4. **Approve.** Review the proposed terms before Search OpenCaseLaw, or inspect the listed article references before requesting a guided explanation. This approves disclosure, not legal relevance or guaranteed anonymity. The full conversation is not passed to the research worker. A person can add a detail below instead of editing unfamiliar legal words.
5. **Read.** A short response, practical steps, uncertainty and expandable original source passages appear when the model provides a structurally valid answer. Otherwise the interface explains the limitation and may show retrieved sources. Real citations can still accompany an incorrect interpretation.
6. **Continue.** Add a detail or follow-up; a new search again requires approval. Stop cancels active work. Technical generation errors allow retry. An unsuccessful search invites more ordinary-language detail. The conversation has a bounded context; Start again begins a fresh question.
7. **Keep an answer if wanted.** Copy answer includes source links and the guidance caveat. The clipboard is outside Swisslaw’s clearing controls.
8. **Finish.** Start again or Clear this conversation resets tab state and terminates the workers. Page-hide handling also clears the session. This is not forensic erasure of device memory.
9. **Free storage.** Under Data on this device, Remove cached models asks for confirmation, ends the conversation, removes the two configured model revisions from this site’s model caches and checks for remaining entries. It reports absence or failure accurately. Public model files can be downloaded again. Other browser data, copies and previously sent searches are not removed. Another open tab can later download files again.

## Explain privacy without requiring technical knowledge

> Your conversation stays in this tab. You approve search terms or public article references before they are sent to OpenCaseLaw.

Article requests may reveal the topic and some selected facts. The folded explanation identifies website/model-host connection information, approved search terms, selected public source identifiers and OpenCaseLaw’s own retention and possible external-AI processing. The exact model, WebLLM version, model hosts, direct MCP endpoint/protocol and tool names are available in the technical disclosure. Local processing reduces exposure; it does not promise absolute security or anonymity.

## Current verification and launch gaps

The output-limit report was reproduced with a short question: the 2B model repeated search words until its output was cut off. Compact grammars now bound generated strings and structural whitespace, and malformed planning receives one local retry. Tests cover the actual bundled grammar compiler, incomplete output, cancellation and scoped cache removal. These are control tests, not legal validation.

Real browser trials cover the exact reported question and a synthetic set of informal, misspelled and multilingual questions. Prompt revisions improved some intake outcomes, but wrong topics and unnecessary clarifications remain, particularly in dialect. The final prompt’s 2B trial still misrouted a child-contact question toward employment law. This is a release blocker for a broadly reliable legal adviser, not a passing benchmark.

The finished interface was exercised with the reported question: it reached approved search and a complete insufficient-evidence result, with an unsuitable retrieved provision. This did not establish a useful legal answer. Actual cached test-model removal and a second empty-cache attempt both produced the expected UI results. All five languages had no horizontal overflow at a measured 355 CSS-pixel viewport. This is not a physical-phone or screen-reader test.

Before a public launch:

- Establish representative, held-out multilingual legal evaluations reviewed for correct understanding, source applicability, important exceptions, useful action and appropriate uncertainty; include follow-up clarification.
- Validate the complete answer path, not only successful model loading or valid JSON. Track wrong-source and wrong-interpretation failures separately.
- Test physical phones, low memory, interrupted downloads, offline/retrieval failures, multiple tabs and actual cache removal on a disposable profile.
- Review keyboard/screen-reader behaviour and all language translations, especially Romansh.
- Inspect production network behaviour using fictional input, including cancellation and search approval. Review deployment headers and dependency/model integrity boundaries.

## Hosting choice

Quick Tunnels can share a disposable local build for temporary real-device testing. They are public, temporary development endpoints, not the production deployment strategy. A stable HTTPS static origin is a better fit for reliable access and reuse of browser model caches. No tunnel is required for local inference or the direct OpenCaseLaw connection.


## Guided-route verification update

Direct live MCP lookups now retrieve OR335/335c for the confirmed ordinary-resignation scenario, rather than PHV35. The source identity/metadata and retrieval-routing defect has a concrete repair. This does not establish local-model interpretation quality: initial2B trials and the complete ordinary-UI4B run still withheld an answer despite retrieving the relevant complete provisions. A discarded shorter-prompt experiment copied template placeholders and cut its uncertainty sentence; that prompt was not integrated. Do not count it as a successful legal answer. Broader release gates remain in force.

The guided entry was checked in all five interface languages at a measured320CSS-pixel width with no horizontal overflow. Source identity and typed recipe controls pass32 standalone tests. These results are interface/control verification, not legal validation.

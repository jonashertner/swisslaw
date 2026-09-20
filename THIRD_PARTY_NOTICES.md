# Third-party notices and provenance

Swisslaw's original application code is licensed under MIT, copyright 2026 Jonas Hertner. That licence does not relicense dependencies, externally downloaded models, compiled libraries, legal texts or third-party services.

This is a source repository. It does not include model weights, the compiled model library, a legal corpus or private documents. Installing dependencies and running the application fetches separate third-party material. Preserve the licences and applicable notices supplied with those materials when distributing a build.

## Direct application dependencies

| Package | Version used | Declared licence | Upstream |
| --- | --- | --- | --- |
| `@mlc-ai/web-llm` | 0.2.85 | Apache-2.0 | [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) |
| `react` | 19.2.8 | MIT | [facebook/react](https://github.com/facebook/react) |
| `react-dom` | 19.2.8 | MIT | [facebook/react](https://github.com/facebook/react) |
| `lucide-react` | 1.31.0 | ISC | [lucide-icons/lucide](https://github.com/lucide-icons/lucide) |
| `zod` | 4.3.6 | MIT | [colinhacks/zod](https://github.com/colinhacks/zod) |
| `@huggingface/transformers` | 3.8.1 | Apache-2.0 | [huggingface/transformers.js](https://github.com/huggingface/transformers.js) |

Live suggestions use ONNX Runtime Web `1.22.0-dev.20250409-89f8206ba4` (MIT). Its runtime module and WASM are bundled with the application from the locked npm package and checked against the hashes in `lib/swisslaw-chat/intake-model.json`. Preserve ONNX Runtime's supplied notices when distributing builds.

## Local topic model

The browser downloads `Xenova/multilingual-e5-small`, quantised q8 ONNX, from revision `761b726dd34fb83930e26aab4e9ac3899aa1fa78`. All five model/tokenizer artifacts have exact byte sizes and SHA-256 checks in `intake-model.json`. They are downloaded from the pinned public host, not included in this source repository. The conversion points to `intfloat/multilingual-e5-small`; its upstream model card at revision `614241f622f53c4eeff9890bdc4f31cfecc418b3` declares MIT. The conversion card does not supply an additional explicit licence declaration. This records the available provenance, not an independent inventory of every training source or component.

The 132 public fictional topic/example vectors are generated using that exact model. They contain no user conversations or practice material. Reproduce them with `node scripts/build-intake-catalogue.mjs`; model artifacts are verified against the existing manifest before use. Sources: [upstream model](https://huggingface.co/intfloat/multilingual-e5-small/tree/614241f622f53c4eeff9890bdc4f31cfecc418b3), [ONNX conversion](https://huggingface.co/Xenova/multilingual-e5-small/tree/761b726dd34fb83930e26aab4e9ac3899aa1fa78).

Build/test tools include Vite, its React plugin and tsx under MIT, TypeScript under Apache-2.0, and TypeScript definition packages under their respective package licences. The lockfile records the installed graph; the table above is not an exhaustive inventory of transitive dependencies. Refer to each installed package's licence and notice files before redistributing compiled output.

## Configured models

The default is the 2B model; the 4B model is an optional choice before starting a conversation. Both use 4-bit MLC conversions.

| Model identifier | Pinned conversion revision | Conversion repository |
| --- | --- | --- |
| `Qwen3.5-2B-q4f16_1-MLC` | `dd74e9c8a20c4546df85c844103bff87b6dcacad` | [MLC 2B files](https://huggingface.co/mlc-ai/Qwen3.5-2B-q4f16_1-MLC/tree/dd74e9c8a20c4546df85c844103bff87b6dcacad) |
| `Qwen3.5-4B-q4f16_1-MLC` | `44b42469f9e192814bfd90440e3b377d89ba7a13` | [MLC 4B files](https://huggingface.co/mlc-ai/Qwen3.5-4B-q4f16_1-MLC/tree/44b42469f9e192814bfd90440e3b377d89ba7a13) |

Both compiled libraries come from [`mlc-ai/binary-mlc-llm-libs`](https://github.com/mlc-ai/binary-mlc-llm-libs/tree/025bcaf3780fa8254f5e5efd3bfea0a5397248f4), pinned to revision `025bcaf3780fa8254f5e5efd3bfea0a5397248f4`, at these paths:

```text
web-llm-models/v0_2_84/base/Qwen3.5-2B-q4f16_1_cs1k-webgpu.wasm
web-llm-models/v0_2_84/base/Qwen3.5-4B-q4f16_1_cs1k-webgpu.wasm
```

The browser downloads the selected public artifacts on demand. Configuration and library integrity values are in `lib/swisslaw-chat/model-config.ts`. The repository's MIT licence does not apply to those downloads.

Upstream [Qwen/Qwen3.5-2B](https://huggingface.co/Qwen/Qwen3.5-2B) declares [Apache License 2.0](https://huggingface.co/Qwen/Qwen3.5-2B/blob/main/LICENSE), as does [Qwen/Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B/blob/main/LICENSE). WebLLM separately supplies its [Apache-2.0 licence](https://github.com/mlc-ai/web-llm/blob/main/LICENSE).

**Provenance gap, checked 20 September 2026:** neither exact pinned MLC conversion has model-card/licence metadata or an included licence file, and the complete pinned compiled-library repository tree contains no LICENSE or NOTICE file. These observations do not establish the licensing of every component in those artifacts. Upstream Qwen's licence and WebLLM's licence are evidence for those upstream projects, not a verified licence inventory for the exact converted weights and compiled binaries. Do not treat this notice as permission to redistribute those artifacts; obtain the missing provenance before vendoring or mirroring them.

## Legal sources and service

The application retrieves statute articles and numbered judgment passages through [OpenCaseLaw](https://opencaselaw.ch/), using its public MCP endpoint at `https://mcp.opencaselaw.ch/mcp`. It retains source links and available jurisdiction/version metadata in the displayed result. Retrieved material and the service are not covered by Swisslaw's MIT licence; consult the applicable original source and service terms before republishing a corpus or operating a derivative service.

Use of the OpenCaseLaw name here identifies the external source service. It does not imply its endorsement of Swisslaw. Its [privacy information](https://opencaselaw.ch/datenschutz/) applies to searches sent to that service.

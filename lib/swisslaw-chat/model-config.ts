export const MODEL_OPTIONS = [
  {
    id: 'Qwen3.5-2B-q4f16_1-MLC', label: '2B · smaller download',
    repository: 'https://huggingface.co/mlc-ai/Qwen3.5-2B-q4f16_1-MLC/resolve/dd74e9c8a20c4546df85c844103bff87b6dcacad',
    library: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/025bcaf3780fa8254f5e5efd3bfea0a5397248f4/web-llm-models/v0_2_84/base/Qwen3.5-2B-q4f16_1_cs1k-webgpu.wasm',
    configIntegrity: 'sha256-Q1d7bemkxizw/pxe5XvFLrsvxIfGSiG/eNYkMRhrSwE=',
    libraryIntegrity: 'sha256-sPlR1BHk/Vn+Kvdr6TKJBa4wVJ5XChkqhByViyk+zVM=',
  },
  {
    id: 'Qwen3.5-4B-q4f16_1-MLC', label: '4B · larger model',
    repository: 'https://huggingface.co/mlc-ai/Qwen3.5-4B-q4f16_1-MLC/resolve/44b42469f9e192814bfd90440e3b377d89ba7a13',
    library: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/025bcaf3780fa8254f5e5efd3bfea0a5397248f4/web-llm-models/v0_2_84/base/Qwen3.5-4B-q4f16_1_cs1k-webgpu.wasm',
    configIntegrity: 'sha256-uU1Tv95bSW2NliOb9GhOJLU5QgnlrvkSeGbvpFQ5VlE=',
    libraryIntegrity: 'sha256-fo+YldqnEKg5Uu+sTVxvNun4ncaEslAidG2IG9yQRxI=',
  },
] as const;
export type ModelId = typeof MODEL_OPTIONS[number]['id'];
export const MODEL_ID: ModelId = MODEL_OPTIONS[0].id;
export function selectedModel(id: unknown) {
  const model = MODEL_OPTIONS.find(option => option.id === id);
  if (!model) throw new Error('MODEL_STARTUP');
  return model;
}
export const MODEL_CONFIG = { cacheBackend: 'cache' as const, model_list: MODEL_OPTIONS.map(model => ({
  model: model.repository, model_id: model.id, model_lib: model.library,
  integrity: { config: model.configIntegrity, model_lib: model.libraryIntegrity, onFailure: 'error' as const },
  overrides: { context_window_size: 4096, max_history_size: 1 },
})) };

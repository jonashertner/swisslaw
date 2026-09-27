// Loads the knowledge base into the browser build. Vite inlines the JSON at build time.
import { SituationSchema, type Situation } from './knowledge';
import { visibleInChannel, type AreaId, type Channel } from './site';

export const CHANNEL: Channel = import.meta.env.VITE_CHANNEL === 'review' ? 'review' : 'public';

const files = import.meta.glob('../../knowledge/situations/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
// An invalid file is skipped, never shown and never allowed to take the site down.
// `npm run check:knowledge` and the test suite fail loudly on it instead.
export const SITUATIONS: readonly Situation[] = Object.entries(files)
  .flatMap(([path, raw]) => {
    const parsed = SituationSchema.safeParse(raw);
    if (!parsed.success) { console.warn(`Skipping invalid situation ${path}`); return []; }
    return [parsed.data];
  })
  .filter(s => visibleInChannel(s, CHANNEL))
  .sort((a, b) => a.id.localeCompare(b.id));
export const byId = new Map(SITUATIONS.map(s => [s.id, s]));
export function inArea(area: AreaId): Situation[] { return SITUATIONS.filter(s => s.domain === area); }

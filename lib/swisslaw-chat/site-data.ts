// Loads the knowledge base into the browser build.
// Situations are filtered by channel at build time (vite.config.ts), so public builds never contain drafts.
import files from 'virtual:swisslaw-situations';
import { SituationSchema, type Situation } from './knowledge';
import { visibleInChannel, type AreaId, type Channel } from './site';

export const CHANNEL: Channel = import.meta.env.VITE_CHANNEL === 'review' ? 'review' : 'public';

// An invalid file is skipped, never shown and never allowed to take the site down.
// `npm run check:knowledge` and the test suite fail loudly on it instead.
export const SITUATIONS: readonly Situation[] = files
  .flatMap((raw, i) => {
    const parsed = SituationSchema.safeParse(raw);
    if (!parsed.success) { console.warn(`Skipping invalid situation #${i}`); return []; }
    return [parsed.data];
  })
  .filter(s => visibleInChannel(s, CHANNEL))
  .sort((a, b) => a.id.localeCompare(b.id));
export const byId = new Map(SITUATIONS.map(s => [s.id, s]));
export function inArea(area: AreaId): Situation[] { return SITUATIONS.filter(s => s.domain === area); }

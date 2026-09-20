import { PRACTICAL_REFERENCES } from './practical-manifest';
import { practicalTopic, provisionHash, type PracticalTopic } from './practical';
import type { Source } from './policy';

export const PUBLIC_PACKET_TTL_MS = 15 * 60 * 1000;
export type PublicPacket = { sources: Source[]; checkedAt: number };
const identity = (topic: PracticalTopic) => JSON.stringify(PRACTICAL_REFERENCES[topic]);
/** Tab-memory public law only. No question, choices, personal answer or persistent storage. */
export class PublicSourceCache {
  private epoch = 0;
  private entries = new Map<PracticalTopic, PublicPacket & { version: string }>();
  get(topic: PracticalTopic, now = Date.now()): PublicPacket | null {
    const entry = this.entries.get(practicalTopic(topic));
    if (!entry) return null;
    if (now < entry.checkedAt || now - entry.checkedAt >= PUBLIC_PACKET_TTL_MS || entry.version !== identity(topic)) { this.entries.delete(topic); return null; }
    return { sources: structuredClone(entry.sources), checkedAt: entry.checkedAt };
  }
  async put(topic: PracticalTopic, sources: Source[], now = Date.now()): Promise<PublicPacket> {
    const epoch = this.epoch;
    const refs = PRACTICAL_REFERENCES[practicalTopic(topic)];
    if (!Number.isFinite(now) || !Array.isArray(sources) || sources.length !== refs.length) throw new Error('INVALID_SOURCES');
    const clean: Source[] = [];
    for (const [i, ref] of refs.entries()) {
      const s = sources[i];
      if (!s || s.id !== `${ref.sr}:${ref.article}` || s.url !== ref.url || s.kind !== 'law' || s.jurisdiction !== 'CH' || s.language !== 'de' || typeof s.text !== 'string' || s.text.length > 5000 || await provisionHash(s.text) !== ref.sha256) throw new Error('INVALID_SOURCES');
      // Only public manifest labels and checked text survive. Unknown fields,
      // model prose and caller-supplied labels cannot enter a shared packet.
      clean.push({id:s.id,kind:'law',title:ref.label,url:ref.url,text:s.text,jurisdiction:'CH',language:'de',date:typeof s.date === 'string' ? s.date.slice(0,30) : ''});
    }
    if (epoch !== this.epoch) throw new Error('CANCELLED');
    this.entries.set(topic, {sources:clean,checkedAt:now,version:identity(topic)});
    return {sources:structuredClone(clean),checkedAt:now};
  }
  clear() { this.epoch++; this.entries.clear(); }
}
export const publicSourceCache = new PublicSourceCache();

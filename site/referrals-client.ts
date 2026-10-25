// Progressive enhancement only: provider cards are already complete in the HTML.
// No catalogue import, requests, model, URL updates or persistent storage.
const TOPICS = new Set(['general', 'work', 'home', 'family', 'money', 'consumer', 'migration', 'social', 'violence', 'discrimination', 'health']);
const CANTONS = new Set(['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH']);
const KINDS = new Set(['advice', 'directory', 'authority', 'mediation', 'ai']);
const COSTS = new Set(['free', 'conditional', 'paid', 'unknown']);
const GROUPS = ['direct', 'networks', 'specific', 'fallback', 'ai'] as const;
type Group = typeof GROUPS[number];
type Card = {
  node: HTMLElement;
  id: string;
  name: string;
  topics: Set<string>;
  cantons: Set<string>;
  kind: string;
  cost: string;
  freeInitial: boolean;
  specific: boolean;
};
const tokens = (value: string | undefined) => new Set((value ?? '').trim().split(/\s+/).filter(Boolean));

export function initReferrals(): void {
  const root = document.querySelector<HTMLElement>('[data-referrals]');
  if (!root || root.dataset.referralsReady === 'true') return;
  const form = root.querySelector<HTMLFormElement>('[data-referral-filters]');
  const topic = form?.querySelector<HTMLSelectElement>('select[name="topic"]');
  const canton = form?.querySelector<HTMLSelectElement>('select[name="canton"]');
  const freeOnly = form?.querySelector<HTMLInputElement>('input[name="freeOnly"]');
  const count = root.querySelector<HTMLElement>('[data-referral-count]');
  const empty = root.querySelector<HTMLElement>('[data-referral-empty]');
  const more = root.querySelector<HTMLButtonElement>('[data-referral-more]');
  const remaining = more?.querySelector<HTMLElement>('[data-referral-remaining]');
  const groupNodes = Object.fromEntries(GROUPS.map(key => [key, root.querySelector<HTMLElement>(`[data-referral-group="${key}"]`)])) as Record<Group, HTMLElement | null>;
  const lists = Object.fromEntries(GROUPS.map(key => [key, root.querySelector<HTMLUListElement>(`[data-referral-list="${key}"]`)])) as Record<Group, HTMLUListElement | null>;

  // If the markup contract is incomplete, retain the usable, unfiltered HTML.
  if (!form || !topic || !canton || !freeOnly || !count || !empty || !more || !remaining
    || GROUPS.some(key => !groupNodes[key] || !lists[key])
    || !root.dataset.countOne || !root.dataset.countMany) return;

  const nodes = [...root.querySelectorAll<HTMLElement>('li[data-referral]')];
  const cards: Card[] = nodes.map(node => ({
    node,
    id: node.dataset.id ?? '',
    name: node.dataset.name ?? node.querySelector('h3')?.textContent?.trim() ?? '',
    topics: tokens(node.dataset.topics),
    cantons: tokens(node.dataset.cantons),
    kind: node.dataset.kind ?? '',
    cost: node.dataset.cost ?? '',
    freeInitial: node.dataset.freeInitial === 'true',
    specific: node.dataset.specific === 'true',
  }));
  const ids = new Set(cards.map(card => card.id));
  if (ids.size !== cards.length || cards.some(card => !card.id || !card.name
    || !card.topics.size || [...card.topics].some(value => !TOPICS.has(value))
    || !card.cantons.size || [...card.cantons].some(value => value !== 'CH' && !CANTONS.has(value))
    || !KINDS.has(card.kind) || !COSTS.has(card.cost))) return;

  const generalButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-referral-general]')];
  const paidButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-referral-paid]')];
  const resetButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-referral-reset]')];
  const urgent = root.querySelector<HTMLDetailsElement>('details[data-referral-urgent]');
  const collator = new Intl.Collator(document.documentElement.lang || 'de', { sensitivity: 'base', numeric: true });
  let limit = 6;
  let previousFilters = '';
  let previousTopic = '';
  let currentDirect: Card[] = [];

  // Fragments are only an initial navigation hint. Ignore unknown values and all
  // other parameters; filtering never writes a selection into URL or storage.
  const initialTopic = new URLSearchParams(location.hash.replace(/^#/, '')).get('topic');
  topic.value = initialTopic && TOPICS.has(initialTopic) ? initialTopic : 'general';
  canton.value = '';
  freeOnly.checked = false;

  const checkStaleness = () => {
    const now = Date.now();
    for (const card of cards) {
      const marker = card.node.querySelector<HTMLElement>('[data-referral-stale]');
      const reviewed = card.node.dataset.reviewed ?? '';
      if (!marker || !/^\d{4}-\d{2}-\d{2}$/.test(reviewed)) continue;
      const checkedAt = Date.parse(`${reviewed}T00:00:00Z`);
      // Only reveal warnings. Never clear a warning emitted by the build or
      // change the underlying review date based on the visitor's clock.
      if (Number.isFinite(checkedAt) && now - checkedAt > 90 * 86400000) marker.hidden = false;
    }
  };

  const render = () => {
    const selectedTopic = TOPICS.has(topic.value) ? topic.value : 'general';
    const selectedCanton = CANTONS.has(canton.value) ? canton.value : '';
    const onlyFree = freeOnly.checked;
    const filterKey = `${selectedTopic}|${selectedCanton}|${onlyFree}`;
    const changed = filterKey !== previousFilters;
    if (changed) limit = 6;
    previousFilters = filterKey;
    const isLocal = (card: Card) => selectedCanton !== '' && card.cantons.has(selectedCanton);
    const inCanton = (card: Card) => !selectedCanton || card.cantons.has('CH') || card.cantons.has(selectedCanton);
    const isFree = (card: Card) => card.cost === 'free' || card.freeInitial;
    const inTopic = (card: Card) => card.topics.has(selectedTopic);
    const isFallback = (card: Card) => selectedTopic !== 'general' && card.kind !== 'ai' && !card.specific && !inTopic(card) && card.topics.has('general');
    const compare = (a: Card, b: Card) => Number(isLocal(b)) - Number(isLocal(a)) || collator.compare(a.name, b.name) || collator.compare(a.id, b.id);
    const buckets: Record<Group, Card[]> = { direct: [], networks: [], specific: [], fallback: [], ai: [] };

    for (const card of cards) {
      card.node.hidden = true;
      if (!inCanton(card) || (onlyFree && !isFree(card))) continue;
      if (!inTopic(card)) {
        if (isFallback(card)) buckets.fallback.push(card);
        continue;
      }
      // Restricted-audience services stay in the clearly labelled specific
      // group, including any specialised directories in the source data.
      if (card.kind === 'ai') buckets.ai.push(card);
      else if (card.specific) buckets.specific.push(card);
      else if (card.kind === 'directory') buckets.networks.push(card);
      else buckets.direct.push(card);
    }
    for (const key of GROUPS) {
      const bucket = buckets[key].sort(compare);
      const list = lists[key]!;
      for (const [index, card] of bucket.entries()) {
        list.append(card.node);
        card.node.hidden = key === 'direct' && index >= limit;
      }
      groupNodes[key]!.hidden = bucket.length === 0;
      const groupCount=groupNodes[key]!.querySelector<HTMLElement>('[data-referral-group-count]');
      if(groupCount) groupCount.textContent=`· ${bucket.length}`;
    }
    currentDirect = buckets.direct;
    if (changed) {
      const fallback = groupNodes.fallback;
      const specific = groupNodes.specific;
      if (fallback instanceof HTMLDetailsElement) fallback.open = buckets.direct.length === 0;
      if (specific instanceof HTMLDetailsElement) specific.open = buckets.direct.length === 0 && buckets.networks.length === 0;
    }
    // General fallbacks are deliberately not counted as specialist matches.
    const total = buckets.direct.length + buckets.networks.length + buckets.specific.length + buckets.ai.length;
    const countTemplate = total === 1 ? root.dataset.countOne! : root.dataset.countMany!;
    count.textContent = countTemplate.replace(/\{n\}/g, String(total));
    empty.hidden = total !== 0;
    const left = Math.max(0, currentDirect.length - limit);
    more.hidden = left === 0;
    remaining.textContent = String(left);
    for (const button of generalButtons) button.hidden = selectedTopic === 'general';
    const hasPaidAlternative = onlyFree && cards.some(card => inCanton(card) && (inTopic(card) || isFallback(card)) && !isFree(card));
    for (const button of paidButtons) button.hidden = !hasPaidAlternative;
    for (const button of resetButtons) button.hidden = selectedTopic === 'general' && !selectedCanton && !onlyFree;
    if (urgent && selectedTopic !== previousTopic) urgent.open = selectedTopic === 'violence';
    previousTopic = selectedTopic;
  };

  const reset = () => {
    topic.value = 'general';
    canton.value = '';
    freeOnly.checked = false;
    render();
    topic.focus();
  };
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', render);
  form.addEventListener('reset', event => { event.preventDefault(); reset(); });
  for (const button of generalButtons) button.addEventListener('click', event => {
    event.preventDefault();
    topic.value = 'general';
    // Keep the user's canton and cost choice intact.
    render();
    topic.focus();
  });
  for (const button of paidButtons) button.addEventListener('click', event => {
    event.preventDefault();
    freeOnly.checked = false;
    render();
    freeOnly.focus();
  });
  for (const button of resetButtons) button.addEventListener('click', event => { event.preventDefault(); reset(); });
  more.addEventListener('click', event => {
    event.preventDefault();
    const firstNew = currentDirect[limit];
    limit += 6;
    render();
    if (!firstNew) return;
    const anchor = firstNew.node.querySelector<HTMLAnchorElement>('a[href]');
    if (anchor) anchor.focus();
    else { firstNew.node.tabIndex = -1; firstNew.node.focus(); }
  });

  checkStaleness();
  render();
  root.dataset.referralsReady = 'true';
  form.hidden = false;
  count.hidden = false;
  // Recheck long-lived/restored tabs without polling or changing certification.
  addEventListener('pageshow', checkStaleness);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkStaleness(); });
}

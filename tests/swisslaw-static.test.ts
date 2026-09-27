import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
function build(channel: 'public' | 'review'): string {
  const out = mkdtempSync(join(tmpdir(), `swisslaw-${channel}-`));
  execFileSync(join(root, 'node_modules/.bin/tsx'), ['site/build.tsx'], { cwd: root, env: { ...process.env, SITE_OUT: out, VITE_CHANNEL: channel === 'review' ? 'review' : '' }, stdio: 'pipe' });
  return out;
}
const walk = (dir: string): string[] => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const review = build('review');
const pub = build('public');
const html = (out: string) => walk(out).filter(f => f.endsWith('.html'));

test('every page is complete, labelled HTML', () => {
  for (const file of html(review)) {
    const s = readFileSync(file, 'utf8');
    assert.match(s, /^<!doctype html><html lang="(de|fr|it|rm|en)" dir="ltr">/, file);
    assert.equal((s.match(/<h1[ >]/g) ?? []).length, 1, `${file}: exactly one h1`);
    assert.match(s, /<title>[^<]+<\/title>/, file);
    assert.match(s, /<meta name="description" content="[^"]+">/, file);
    assert.match(s, /<link rel="canonical" href="https:\/\/swisslaw\.io\//, file);
    assert.match(s, /<main id="main"/, file);
    for (const m of s.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(m[1]);
  }
});

test('internal links and sitemap entries resolve to files', () => {
  const resolve = (href: string) => { const p = href.split(/[?#]/)[0]; return existsSync(join(review, p.endsWith('/') ? `${p}index.html` : p)); };
  for (const file of html(review)) for (const m of readFileSync(file, 'utf8').matchAll(/href="(\/[^"]*)"/g)) assert.ok(resolve(m[1]), `${file} -> ${m[1]}`);
  for (const m of readFileSync(join(review, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/swisslaw\.io(\/[^<]*)<\/loc>/g)) assert.ok(resolve(m[1]), m[1]);
});

test('review build is never indexable; public build ships no draft text', () => {
  for (const file of html(review)) assert.match(readFileSync(file, 'utf8'), /<meta name="robots" content="noindex,nofollow">/, file);
  assert.match(readFileSync(join(review, 'robots.txt'), 'utf8'), /Disallow: \//);
  const drafts = JSON.parse(readFileSync(join(review, 'data/index.json'), 'utf8')).situations.filter((s: { status: string }) => s.status !== 'public');
  const everything = walk(pub).filter(f => /\.(html|json|js|txt|xml)$/.test(f)).map(f => readFileSync(f, 'utf8')).join('\n');
  for (const d of drafts) assert.ok(!everything.includes(d.summary.de), `draft ${d.id} leaked into the public build`);
  assert.doesNotMatch(readFileSync(join(pub, 'de/index.html'), 'utf8'), /noindex/);
});

test('pages work without JavaScript: content is in the HTML, enhancements start hidden', () => {
  const s = readFileSync(join(review, 'de/tenancy/landlord-notice/index.html'), 'utf8');
  assert.match(s, /Die wichtigste Frist/);
  assert.match(s, /<form class="inputs" id="answers"[^>]*hidden/);
  assert.match(s, /Content-Security-Policy|<style>/);
  assert.ok(!/<script>(?!try\{)/.test(s), 'no inline executable scripts except the root language redirect');
});

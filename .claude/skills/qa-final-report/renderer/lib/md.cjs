// Minimal Markdown readers for the platform's artifact templates: headings, pipe tables, key/value tables.
// No dependencies. Sections are matched by title (regex), never by number, so template renumbering is harmless.

const clean = s => String(s ?? '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\\\|/g, '|').trim();

function headings(text) {
  const out = [], lines = text.split(/\r?\n/);
  let fence = false;
  lines.forEach((l, i) => {
    if (/^```/.test(l)) fence = !fence;
    const m = !fence && /^(#{1,6})\s+(.*?)\s*$/.exec(l);
    if (m) out.push({ level: m[1].length, title: m[2], line: i });
  });
  return { out, lines };
}

// Text of the first section whose title matches re (optionally at a given level), up to the next heading of the same or higher level.
function section(text, re, level) {
  if (!text) return null;
  const { out, lines } = headings(text);
  const i = out.findIndex(h => re.test(h.title) && (!level || h.level === level));
  if (i < 0) return null;
  const h = out[i], next = out.slice(i + 1).find(x => x.level <= h.level);
  return lines.slice(h.line + 1, next ? next.line : lines.length).join('\n');
}

// All sections whose title matches re: [{ title, match, body }]
function sections(text, re, level) {
  if (!text) return [];
  const { out, lines } = headings(text);
  return out.map((h, i) => ({ h, i })).filter(({ h }) => re.test(h.title) && (!level || h.level === level)).map(({ h, i }) => {
    const next = out.slice(i + 1).find(x => x.level <= h.level);
    return { title: h.title, match: re.exec(h.title), body: lines.slice(h.line + 1, next ? next.line : lines.length).join('\n') };
  });
}

const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim());

// Pipe tables in order of appearance: [{ header: [], rows: [[]] }]
function tables(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/), out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\|/.test(lines[i]) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const t = { header: cells(lines[i]).map(clean), rows: [] };
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) t.rows.push(cells(lines[i++]));
      i--;
      out.push(t);
    }
  }
  return out;
}

// Rows as objects keyed by header; values keep their Markdown (use clean() for display text).
const objects = t => (t ? t.rows.map(r => Object.fromEntries(t.header.map((h, i) => [h, r[i] ?? '']))) : []);
const firstTable = (text, pred = () => true) => tables(text).find(pred) || null;
// Two-column Field | Value tables → { Field: Value }
const kv = t => (t ? Object.fromEntries(t.rows.map(r => [clean(r[0]), r[1] ?? ''])) : {});
const findKey = (o, re) => { const k = Object.keys(o || {}).find(x => re.test(x)); return k ? o[k] : undefined; };
// First non-empty paragraph of a block
const para = text => (text || '').split(/\r?\n\s*\r?\n/).map(s => s.trim()).find(s => s && !/^\|/.test(s) && !/^---+$/.test(s)) || '';
const ids = (s, re) => [...new Set(String(s || '').match(re) || [])];

module.exports = { clean, section, sections, tables, objects, firstTable, kv, findKey, para, ids };

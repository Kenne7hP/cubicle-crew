// The Office (US), interpreted with the existing editable pixel-avatar parts.
// Assignment slots are append-only within this browser profile so arrivals do not recast colleagues.
const base = { body: 0, skin: 0, hair: 1, style: 1, top: 2, bottom: 0, glasses: false,
  head: 0, beard: 0, legs: 1, shoes: 0, iris: 0, accent: 0, desk: 0, earrings: false };
const person = (id, name, shirt, av, note) => Object.freeze({ id, name, shirt, av: Object.freeze({ ...base, ...av }), note });
export const OFFICE_CAST = Object.freeze([
  person('michael', 'Michael Scott', '#424b5a', { hair: 0, accent: 0, desk: 6 }, 'Dark suit tones, red tie, Dundie trophy'),
  person('jim', 'Jim Halpert', '#d9e2dc', { hair: 1, style: 2, accent: 1, desk: 1 }, 'Tousled brown hair, pale shirt, blue tie'),
  person('pam', 'Pam Beesly', '#bf91a0', { body: 1, hair: 2, style: 4, top: 0, bottom: 1, legs: 1, desk: 1 }, 'Wavy auburn hair, rose blouse, charcoal skirt'),
  person('dwight', 'Dwight Schrute', '#c9ad54', { hair: 1, glasses: true, accent: 4, legs: 4, desk: 2 }, 'Parted brown hair, glasses, mustard shirt, brown trousers'),
  person('angela', 'Angela Martin', '#c3c6b3', { body: 1, hair: 3, style: 0, top: 0, bottom: 1, legs: 1, desk: 8 }, 'Straight blonde hair, pale blouse, charcoal skirt'),
  person('oscar', 'Oscar Martinez', '#9ca8bf', { skin: 2, hair: 0, style: 0, top: 0, desk: 8 }, 'Short dark hair, blue-grey shirt'),
  person('kevin', 'Kevin Malone', '#c8c2ae', { hair: 1, style: 4, accent: 4, desk: 3 }, 'Close-cropped hair, beige shirt, dark tie'),
  person('stanley', 'Stanley Hudson', '#968b76', { skin: 4, hair: 0, style: 4, beard: 3, accent: 0, desk: 8 }, 'Mustache, dark close-cropped hair, earth-tone shirt'),
  person('phyllis', 'Phyllis Vance', '#aa8ab2', { body: 1, hair: 1, style: 7, glasses: true, top: 0, bottom: 1, legs: 0 }, 'Curly brown hair, glasses, lavender blouse'),
  person('ryan', 'Ryan Howard', '#d7d7ce', { hair: 0, style: 0, accent: 7, desk: 4 }, 'Dark hair, pale shirt, slim dark trousers'),
  person('kelly', 'Kelly Kapoor', '#c06e95', { body: 1, skin: 3, hair: 0, style: 0, top: 1, bottom: 1, legs: 5, earrings: true }, 'Long dark hair, pink top, earrings'),
  person('andy', 'Andy Bernard', '#a8bdc5', { hair: 2, style: 1, accent: 5, legs: 2 }, 'Light brown hair, blue shirt, bright tie, khakis'),
  person('erin', 'Erin Hannon', '#7fa6a5', { body: 1, hair: 4, style: 0, top: 0, bottom: 1, legs: 0 }, 'Long red hair, teal blouse'),
  person('toby', 'Toby Flenderson', '#b7af9a', { hair: 4, style: 4, top: 0, desk: 8 }, 'Short ginger hair, muted beige shirt'),
  person('darryl', 'Darryl Philbin', '#657b8f', { skin: 4, hair: 0, style: 4, top: 0, legs: 0 }, 'Short dark hair, blue work shirt'),
  person('creed', 'Creed Bratton', '#a7b0ad', { hair: 5, style: 4, top: 0, desk: 7 }, 'Grey hair, muted shirt, desk plant'),
]);

/** Pure allocation used by the renderer and regression tests. Existing valid slots win. */
export function assignCast(keys, previous = {}) {
  const out = Object.create(null), used = new Set();
  for (const [key, slot] of Object.entries(previous || {})) {
    if (typeof key === 'string' && Number.isSafeInteger(slot) && slot >= 0 && slot < 100000 && !used.has(slot)) {
      out[key] = slot; used.add(slot);
    }
  }
  for (const key of keys) {
    if (!key || Object.hasOwn(out, key)) continue;
    // An explicitly named future agent (e.g. dwight_review) gets that character when available.
    const words = String(key).toLowerCase().split(/[^a-z]+/);
    const named = OFFICE_CAST.findIndex(p => words.includes(p.id));
    let slot = named >= 0 ? named : 0;
    if (named >= 0) { while (used.has(slot)) slot += OFFICE_CAST.length; }
    else { while (used.has(slot)) slot++; }
    out[key] = slot; used.add(slot);
  }
  return out;
}
export function castProfile(slot) {
  const p = OFFICE_CAST[slot % OFFICE_CAST.length], n = Math.floor(slot / OFFICE_CAST.length) + 1;
  return { ...p, name: p.name + (n > 1 ? ` ${n}` : '') };
}
const KEY = 'po.officeCast';
let assignments = Object.create(null);
try { assignments = assignCast([], JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* isolated/no storage */ }
export function castFor(key) {
  if (!key) return null;
  if (!Object.hasOwn(assignments, key)) {
    assignments = assignCast([key], assignments);
    try { localStorage.setItem(KEY, JSON.stringify(assignments)); } catch { /* in-memory fallback */ }
  }
  return castProfile(assignments[key]);
}

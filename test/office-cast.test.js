import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OFFICE_CAST, assignCast, castProfile } from '../public/office-cast.js';
import { cleanAv } from '../public/catalog.js';

test('The Office cast uses valid editable avatars and distinct primary-character traits', () => {
  assert.equal(new Set(OFFICE_CAST.map(p => p.name)).size, 16);
  for (const p of OFFICE_CAST) {
    assert.ok(cleanAv(p.av), p.name);
    assert.match(p.shirt, /^#[0-9a-f]{6}$/i);
  }
  const dwight = OFFICE_CAST.find(p => p.id === 'dwight');
  assert.equal(dwight.av.glasses, true);
  assert.equal(dwight.shirt, '#c9ad54');
  assert.equal(OFFICE_CAST.find(p => p.id === 'pam').av.body, 1);
  assert.equal(OFFICE_CAST.find(p => p.id === 'stanley').av.beard, 3);
});

test('Cast assignments survive reordered reconnects and new arrivals without recasting', () => {
  const first = assignCast(['p:project-a', 'p:project-b', 'p:project-a#2']);
  const restored = assignCast(['p:project-a#2', 'p:new', 'p:project-b', 'p:project-a'], JSON.parse(JSON.stringify(first)));
  for (const key of Object.keys(first)) assert.equal(restored[key], first[key]);
  assert.equal(castProfile(first['p:project-a']).name, 'Michael Scott');
  assert.equal(new Set(Object.values(restored)).size, 4);
});

test('Named agents select matching cast and overflow names remain distinct', () => {
  const a = assignCast(['t:dwight_review', 't:dwight_verify', 't:pam_ui', ...Array.from({ length: 40 }, (_, i) => `p:fixture-${i}`)]);
  assert.equal(castProfile(a['t:dwight_review']).name, 'Dwight Schrute');
  assert.equal(castProfile(a['t:dwight_verify']).name, 'Dwight Schrute 2');
  assert.equal(castProfile(a['t:pam_ui']).name, 'Pam Beesly');
  assert.equal(new Set(Object.values(a).map(i => castProfile(i).name)).size, Object.keys(a).length);
});

test('Malformed saved cast slots cannot produce invalid avatars or duplicate identities', () => {
  const a = assignCast(['p:bad', 'p:duplicate'], { 'p:valid': 3, 'p:bad': -1, 'p:duplicate': 3, 'p:infinite': Infinity });
  assert.equal(a['p:valid'], 3);
  assert.ok(a['p:bad'] >= 0);
  assert.notEqual(a['p:duplicate'], 3);
  assert.equal(new Set(Object.values(a)).size, Object.keys(a).length);
});

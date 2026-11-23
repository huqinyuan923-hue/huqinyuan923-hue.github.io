import assert from 'node:assert/strict';
import test from 'node:test';
import { MOTE_KINDS, MOTE_WEIGHTS, pickMoteKind, resolveMoteCount } from './stardust';

test('mote weights cover every kind and sum to one', () => {
  const total = MOTE_KINDS.reduce((sum, kind) => sum + MOTE_WEIGHTS[kind], 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights must sum to 1, got ${total}`);
  for (const kind of MOTE_KINDS) assert.ok(MOTE_WEIGHTS[kind] > 0, `${kind} must be reachable`);
});

test('the morning star stays rarer than the dust it sits among', () => {
  const star = MOTE_WEIGHTS.morningstar;
  for (const kind of MOTE_KINDS) {
    if (kind === 'morningstar') continue;
    assert.ok(star < MOTE_WEIGHTS[kind], `morningstar should be rarer than ${kind}`);
  }
});

test('morning stars are common enough to be the signature, not a rarity', () => {
  // Raised from 7%: at that share the gold sparks read as an accident rather than a motif.
  assert.ok(MOTE_WEIGHTS.morningstar >= 0.15, `morningstar share too low: ${MOTE_WEIGHTS.morningstar}`);
  assert.ok(MOTE_WEIGHTS.morningstar < 0.5, 'stardust must still dominate the field');
});

test('pickMoteKind maps the random draw onto the weighted table', () => {
  // Cumulative boundaries: stardust 0–0.5, snowvelvet 0.5–0.8, morningstar 0.8–1.
  assert.equal(
    pickMoteKind(() => 0),
    'stardust',
  );
  assert.equal(
    pickMoteKind(() => 0.49),
    'stardust',
  );
  assert.equal(
    pickMoteKind(() => 0.5),
    'snowvelvet',
  );
  assert.equal(
    pickMoteKind(() => 0.79),
    'snowvelvet',
  );
  assert.equal(
    pickMoteKind(() => 0.8),
    'morningstar',
  );
  assert.equal(
    pickMoteKind(() => 0.999),
    'morningstar',
  );
});

test('pickMoteKind still answers when a draw lands exactly on one', () => {
  assert.equal(
    pickMoteKind(() => 1),
    'morningstar',
  );
});

test('mote count scales with the viewport but stays inside the clamp', () => {
  const phone = resolveMoteCount(390, 844, true);
  const desktop = resolveMoteCount(1440, 900, false);
  const ultrawide = resolveMoteCount(5120, 1440, false);

  assert.ok(phone >= 24 && phone <= 70, `phone motes out of range: ${phone}`);
  assert.ok(desktop >= 44 && desktop <= 130, `desktop motes out of range: ${desktop}`);
  assert.equal(ultrawide, 130, 'a huge viewport must clamp to the desktop ceiling');
  assert.ok(desktop > phone, 'a desktop viewport should carry more motes than a phone');

  // Dense enough to read as a field rather than scattered dots on a typical desktop.
  assert.ok(desktop >= 120, `desktop field too sparse: ${desktop}`);

  // A tiny window must still render a floor, not zero, so the layer never looks broken.
  assert.equal(resolveMoteCount(320, 200, true), 24);
  assert.equal(resolveMoteCount(320, 200, false), 44);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { MOTE_KINDS, MOTE_WEIGHTS, pickMoteKind, resolveMoteCount } from './stardust';

test('mote weights cover every kind and sum to one', () => {
  const total = MOTE_KINDS.reduce((sum, kind) => sum + MOTE_WEIGHTS[kind], 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights must sum to 1, got ${total}`);
  for (const kind of MOTE_KINDS) assert.ok(MOTE_WEIGHTS[kind] > 0, `${kind} must be reachable`);
});

test('the morning star stays the rarest mote', () => {
  const rare = MOTE_WEIGHTS.morningstar;
  for (const kind of MOTE_KINDS) {
    if (kind === 'morningstar') continue;
    assert.ok(rare < MOTE_WEIGHTS[kind], `morningstar should be rarer than ${kind}`);
  }
});

test('pickMoteKind maps the random draw onto the weighted table', () => {
  // Boundaries are cumulative: stardust 0–0.6, snowvelvet 0.6–0.93, morningstar 0.93–1.
  assert.equal(
    pickMoteKind(() => 0),
    'stardust',
  );
  assert.equal(
    pickMoteKind(() => 0.59),
    'stardust',
  );
  assert.equal(
    pickMoteKind(() => 0.6),
    'snowvelvet',
  );
  assert.equal(
    pickMoteKind(() => 0.92),
    'snowvelvet',
  );
  assert.equal(
    pickMoteKind(() => 0.93),
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

  assert.ok(phone >= 8 && phone <= 26, `phone motes out of range: ${phone}`);
  assert.ok(desktop >= 16 && desktop <= 46, `desktop motes out of range: ${desktop}`);
  assert.equal(ultrawide, 46, 'a huge viewport must clamp to the desktop ceiling');
  assert.ok(desktop > phone, 'a desktop viewport should carry more motes than a phone');

  // A tiny window must still render a floor, not zero, so the layer never looks broken.
  assert.equal(resolveMoteCount(320, 200, true), 8);
  assert.equal(resolveMoteCount(320, 200, false), 16);
});

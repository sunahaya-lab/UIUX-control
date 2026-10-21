import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cards, createState, getCard, totalCost, assessPlacement, place, remove, compare, canConfirm } from './model.mjs';

function frozenState(changes = {}) {
  const state = { ...createState(), ...changes };
  Object.freeze(state.squad);
  return Object.freeze(state);
}

test('catalog matches the shared six cards and cannot be mutated', async () => {
  const shared = JSON.parse(await readFile(new URL('../cards.json', import.meta.url), 'utf8'));
  assert.deepEqual(cards, shared);
  assert.equal(cards.length, 6);
  assert.ok(Object.isFrozen(cards));
  assert.ok(cards.every(Object.isFrozen));
  assert.equal(getCard('luca-night'), cards[0]);
  assert.equal(getCard('missing'), null);
});

test('initial states own their squad and start at cost seven with one vacancy', () => {
  const state = createState();
  assert.deepEqual(state, { selected: 'luca-night', active: 2, squad: ['luca-night', 'leon-raven', null] });
  state.squad[0] = null;
  assert.equal(createState().squad[0], 'luca-night');
  assert.equal(totalCost(createState().squad), 7);
  assert.equal(canConfirm(createState()).ok, false);
});

test('fills the final slot exactly at the budget without mutating input', () => {
  const original = frozenState({ selected: 'mira-key' });
  const before = JSON.stringify(original);
  assert.equal(assessPlacement(original).nextCost, 9);
  const result = place(original);
  assert.equal(result.ok, true);
  assert.equal(result.code, 'placed');
  assert.notEqual(result.state, original);
  assert.notEqual(result.state.squad, original.squad);
  assert.deepEqual(result.state.squad, ['luca-night', 'leon-raven', 'mira-key']);
  assert.equal(JSON.stringify(original), before);
  assert.equal(canConfirm(result.state).ok, true);
  assert.match(result.message, /ミラ.*枠3.*9\/9/);
});

test('exact-card duplication is blocked, but a different card of the same character is allowed', () => {
  const original = frozenState();
  const blocked = place(original);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, 'duplicate');
  assert.equal(blocked.state, original);
  const alternate = place(frozenState({ selected: 'luca-express' }));
  assert.equal(alternate.ok, true);
  assert.equal(canConfirm(alternate.state).ok, true);
  assert.deepEqual(alternate.state.squad, ['luca-night', 'leon-raven', 'luca-express']);
});

test('overspending is rejected and replacement deducts the outgoing card cost', () => {
  const original = frozenState({ selected: 'leon-ember' });
  assert.equal(assessPlacement(original).nextCost, 12);
  const blocked = place(original);
  assert.equal(blocked.code, 'over-budget');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.state, original);
  const replacement = place(frozenState({ selected: 'leon-ember', active: 1 }));
  assert.equal(replacement.ok, true);
  assert.equal(totalCost(replacement.state.squad), 8);
  assert.equal(replacement.state.squad[1], 'leon-ember');
});

test('same-slot placement and empty-slot removal are no-ops', () => {
  const existing = frozenState({ active: 0 });
  const placed = place(existing);
  assert.equal(placed.code, 'same-slot');
  assert.equal(placed.ok, false);
  assert.equal(placed.state, existing);
  const empty = frozenState();
  const removed = remove(empty);
  assert.equal(removed.code, 'empty-slot');
  assert.equal(removed.ok, false);
  assert.equal(removed.state, empty);
});

test('removal creates an independent squad and preserves selection and active slot', () => {
  const original = frozenState({ active: 1 });
  const result = remove(original);
  assert.equal(result.ok, true);
  assert.equal(result.code, 'removed');
  assert.notEqual(result.state, original);
  assert.deepEqual(result.state, { selected: 'luca-night', active: 1, squad: ['luca-night', null, null] });
  assert.deepEqual(original.squad, ['luca-night', 'leon-raven', null]);
  assert.equal(totalCost(result.state.squad), 3);
  assert.match(result.message, /レオン.*枠2.*3\/9/);
});

test('comparison reports signed candidate-minus-current deltas, with no invented empty-slot baseline', () => {
  const result = compare(frozenState({ active: 1, selected: 'mira-key' }));
  assert.equal(result.current.id, 'leon-raven');
  assert.equal(result.candidate.id, 'mira-key');
  assert.deepEqual(result.deltas, { hp: -150, attack: -220, speed: 14, cost: -2 });
  assert.equal(compare(createState()).deltas, null);
  assert.equal(compare(createState()).current, null);
});

test('confirmation requires three valid, unique cards within the budget', () => {
  for (const squad of [
    ['luca-night', null, null],
    ['luca-night', 'luca-night', 'mira-key'],
    ['luca-night', 'leon-ember', 'mira-archive'],
    ['luca-night', 'unknown', 'mira-key'],
    ['luca-night', 'mira-key']
  ]) assert.equal(canConfirm({ squad }).ok, false);
  assert.equal(canConfirm({ squad: ['luca-night', 'luca-express', 'mira-key'] }).ok, true);
});

test('malformed state and slot inputs cannot mutate or accidentally extend the squad', () => {
  for (const state of [null, undefined, {}, ...[-1, 3, 0.5, '1', NaN].map(active => ({ ...createState(), active }))]) {
    for (const operation of [place, remove]) {
      const result = operation(state);
      assert.equal(result.ok, false);
      assert.equal(result.state, state);
    }
    assert.equal(assessPlacement(state).ok, false);
    assert.equal(compare(state).deltas, null);
  }
});

test('malformed squads and unknown candidates fail defensively', () => {
  for (const squad of [null, {}, [], new Array(3), ['luca-night', 'leon-raven', undefined], ['unknown', null, null]]) {
    const state = { ...createState(), squad };
    assert.equal(assessPlacement(state).code, 'invalid-squad');
    assert.equal(place(state).state, state);
    assert.equal(remove(state).state, state);
    assert.equal(canConfirm(state).ok, false);
    assert.equal(compare(state).deltas, null);
  }
  for (const selected of [null, undefined, 'unknown', {}, 0]) {
    const state = frozenState({ selected });
    assert.equal(assessPlacement(state).code, 'invalid-card');
    assert.equal(place(state).state, state);
    assert.equal(compare(state).candidate, null);
  }
  assert.ok(Number.isNaN(totalCost(null)));
  assert.ok(Number.isNaN(totalCost(['unknown'])));
  assert.ok(Number.isNaN(totalCost(new Array(3))));
});

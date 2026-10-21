// Shared card catalog: keep values aligned with ../cards.json.
export const cards = Object.freeze([
  {
    "id": "luca-night",
    "name": "ルカ",
    "title": "月航便",
    "element": "月",
    "rarity": "SSR",
    "role": "速攻",
    "cost": 3,
    "hp": 1280,
    "attack": 340,
    "speed": 112,
    "portrait": 0,
    "skill": "月封の一閃",
    "effect": "敵単体に月属性ダメージ。次の味方の速度を上げる。",
    "passive": "月の仲間がいると攻撃 +10%。",
    "story": "眠らない街を渡り、宛名の消えた手紙を届ける配達人。"
  },
  {
    "id": "leon-raven",
    "name": "レオン",
    "title": "煤羽便",
    "element": "火",
    "rarity": "SSR",
    "role": "攻撃",
    "cost": 4,
    "hp": 1600,
    "attack": 430,
    "speed": 86,
    "portrait": 1,
    "skill": "黒翼の速達",
    "effect": "敵全体に火属性ダメージ。自分の防御が一時的に下がる。",
    "passive": "先頭枠で攻撃 +8%。",
    "story": "煙突の間を縫う黒い羽。彼の配達にはいつも夜明けの匂いがする。"
  },
  {
    "id": "mira-key",
    "name": "ミラ",
    "title": "鍵守便",
    "element": "星",
    "rarity": "SR",
    "role": "支援",
    "cost": 2,
    "hp": 1450,
    "attack": 210,
    "speed": 100,
    "portrait": 2,
    "skill": "閉じた夜を開く",
    "effect": "味方全体のHPを回復し、一度だけ弱体を防ぐ。",
    "passive": "異なる属性が3つあると回復 +12%。",
    "story": "届かなかった言葉を収める書庫の番人。鍵の音で人を覚えている。"
  },
  {
    "id": "luca-express",
    "name": "ルカ",
    "title": "白封速達",
    "element": "星",
    "rarity": "SR",
    "role": "速攻",
    "cost": 2,
    "hp": 1100,
    "attack": 290,
    "speed": 124,
    "portrait": 0,
    "skill": "白い軌跡",
    "effect": "敵単体に星属性ダメージ。自分の行動順を早める。",
    "passive": "星の仲間がいると速度 +8。",
    "story": "白い封筒を運ぶ日は、いつもより少しだけ足取りが軽い。"
  },
  {
    "id": "leon-ember",
    "name": "レオン",
    "title": "残火特務",
    "element": "火",
    "rarity": "SSR",
    "role": "攻撃",
    "cost": 5,
    "hp": 1900,
    "attack": 520,
    "speed": 72,
    "portrait": 1,
    "skill": "焼印の号令",
    "effect": "敵全体に大きな火属性ダメージ。使用後は一度休む。",
    "passive": "火の仲間がいると攻撃 +12%。",
    "story": "夜郵局の最後の切り札。燃やせない手紙ほど重くなるという。"
  },
  {
    "id": "mira-archive",
    "name": "ミラ",
    "title": "宵の記録",
    "element": "月",
    "rarity": "SR",
    "role": "守護",
    "cost": 3,
    "hp": 2100,
    "attack": 180,
    "speed": 82,
    "portrait": 2,
    "skill": "静かな保管室",
    "effect": "味方単体をかばい、受けるダメージを軽減する。",
    "passive": "最後尾でHP +10%。",
    "story": "記録は人を縛るだけではない。帰り道を残すためにもある。"
  }
].map(card => Object.freeze(card)));
const LIMIT = 9;
const SLOT_COUNT = 3;
const cardById = new Map(cards.map(card => [card.id, card]));

export function createState() {
  return { selected: 'luca-night', active: 2, squad: ['luca-night', 'leon-raven', null] };
}

export function getCard(id) {
  return cardById.get(id) ?? null;
}

function validSquad(squad) {
  return Array.isArray(squad) && squad.length === SLOT_COUNT &&
    Array.from(squad).every(id => id === null || getCard(id) !== null);
}

function validSlot(active) {
  return Number.isInteger(active) && active >= 0 && active < SLOT_COUNT;
}

function cardName(card) {
  return `${card.name}［${card.title}］`;
}

function duplicateCard(squad) {
  return squad.find((id, index) => id !== null && squad.indexOf(id) !== index);
}

export function totalCost(squad) {
  if (!Array.isArray(squad)) return NaN;
  return Array.from(squad).reduce((sum, id) => {
    if (id === null) return sum;
    const card = getCard(id);
    return card ? sum + card.cost : NaN;
  }, 0);
}

export function assessPlacement(state) {
  const fail = (code, message, nextCost = null) => ({ ok: false, code, message, nextCost });
  if (!validSlot(state?.active)) return fail('invalid-slot', '編成枠を選んでください。');
  if (!validSquad(state?.squad)) return fail('invalid-squad', '編成データを確認してください。');
  const candidate = getCard(state?.selected);
  if (!candidate) return fail('invalid-card', '配達人を選んでください。');
  const slot = state.active + 1;
  const next = state.squad.map((id, index) => index === state.active ? candidate.id : id);
  const nextCost = totalCost(next);
  if (state.squad[state.active] === candidate.id) {
    return fail('same-slot', `${cardName(candidate)}は枠${slot}に編成済みです。`, nextCost);
  }
  const duplicate = duplicateCard(next);
  if (duplicate) {
    return fail('duplicate', `${cardName(getCard(duplicate))}は重複して編成できません。`, nextCost);
  }
  if (nextCost > LIMIT) {
    return fail('over-budget', `コスト${nextCost}/${LIMIT}。あと${nextCost - LIMIT}下げてください。`, nextCost);
  }
  return { ok: true, code: 'ready', message: `${cardName(candidate)}を枠${slot}へ。コスト${nextCost}/${LIMIT}。`, nextCost };
}

export function place(state) {
  const assessment = assessPlacement(state);
  if (!assessment.ok) {
    const { ok, code, message } = assessment;
    return { state, ok, code, message };
  }
  const squad = state.squad.map((id, index) => index === state.active ? state.selected : id);
  return {
    state: { ...state, squad }, ok: true, code: 'placed',
    message: `${cardName(getCard(state.selected))}を枠${state.active + 1}に編成しました。コスト${assessment.nextCost}/${LIMIT}。`
  };
}

export function remove(state) {
  const fail = (code, message) => ({ state, ok: false, code, message });
  if (!validSlot(state?.active)) return fail('invalid-slot', '編成枠を選んでください。');
  if (!validSquad(state?.squad)) return fail('invalid-squad', '編成データを確認してください。');
  const current = getCard(state.squad[state.active]);
  if (!current) return fail('empty-slot', `枠${state.active + 1}は空いています。`);
  const squad = state.squad.map((id, index) => index === state.active ? null : id);
  return {
    state: { ...state, squad }, ok: true, code: 'removed',
    message: `${cardName(current)}を枠${state.active + 1}から外しました。コスト${totalCost(squad)}/${LIMIT}。`
  };
}

export function compare(state) {
  const candidate = getCard(state?.selected);
  const current = validSlot(state?.active) && validSquad(state?.squad)
    ? getCard(state.squad[state.active]) : null;
  const deltas = current && candidate ? Object.fromEntries(
    ['hp', 'attack', 'speed', 'cost'].map(key => [key, candidate[key] - current[key]])
  ) : null;
  return { current, candidate, deltas };
}

export function canConfirm(state) {
  if (!validSquad(state?.squad)) return { ok: false, message: '編成データを確認してください。' };
  const emptyCount = state.squad.filter(id => id === null).length;
  if (emptyCount) return { ok: false, message: `あと${emptyCount}枠に配達人を編成してください。` };
  const duplicate = duplicateCard(state.squad);
  if (duplicate) return { ok: false, message: `${cardName(getCard(duplicate))}が重複しています。` };
  const cost = totalCost(state.squad);
  if (cost > LIMIT) return { ok: false, message: `コスト${cost}/${LIMIT}。あと${cost - LIMIT}下げてください。` };
  return { ok: true, message: `3人の編成が整いました。コスト${cost}/${LIMIT}。` };
}
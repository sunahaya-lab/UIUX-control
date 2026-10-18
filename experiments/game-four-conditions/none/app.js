import { draw } from './scene.js';
const $ = id => document.getElementById(id);
const initial = () => ({ shield: 2, energy: 68, repair: 1, boost: 2 });
let state = initial();
let mode = 'play';
let timer;
draw($('scene'), {y:0,x:850,distance:378});
$('motion').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.toggle('reduced', $('motion').checked);
function feedback(message) { $('feedback').textContent = message; }
function render() {
  $('shield').innerHTML = `${state.shield} <small>/ 3</small>`;
  $('shield-pips').innerHTML = '◆ '.repeat(state.shield) + '<span>' + '◇ '.repeat(3-state.shield) + '</span>';
  $('energy').textContent = state.energy;
  $('energy-bar').style.width = state.energy + '%';
  $('repair-count').textContent = state.repair;
  $('boost-count').textContent = state.boost;
  $('repair').disabled = mode !== 'play' || state.repair === 0 || state.shield === 3;
  $('boost').disabled = mode !== 'play' || state.boost === 0 || state.energy === 100;
  $('jump').disabled = mode !== 'play';
  $('pause').disabled = mode === 'result';
  $('pause').innerHTML = mode === 'pause' ? '再開 <span>▷</span>' : '一時停止 <span>Ⅱ</span>';
  $('status').textContent = {play:'探索中',pause:'一時停止中',result:'探索終了'}[mode];
  $('demo').value = mode;
  $('overlay').hidden = mode === 'play';
  $('result-stats').hidden = mode !== 'result';
  if (mode !== 'play') {
    const failed = mode === 'result';
    $('overlay-tag').textContent = failed ? 'EXPEDITION REPORT' : 'TAKE A BREATH';
    $('overlay-title').textContent = failed ? '今回は、ここまで。' : 'ひと休みしよう。';
    $('overlay-description').textContent = failed ? '失敗理由：岩への衝突でシールドが尽きました（表示サンプル）' : '準備ができたら、月面探索を再開しよう。';
    $('overlay-action').textContent = failed ? 'もう一度挑戦' : '探索を再開';
  }
}
function changeMode(next) {
  mode = next;
  clearTimeout(timer);
  document.querySelector('.stage').classList.remove('jumping');
  render();
  feedback({play:'探索を再開しました。',pause:'一時停止中です。',result:'リザルトの表示サンプルです。実際の衝突は発生していません。'}[mode]);
}
function jump() {
  if (mode !== 'play' || document.querySelector('dialog[open]')) return;
  clearTimeout(timer);
  const stage = document.querySelector('.stage');
  stage.classList.remove('jumping');
  void stage.offsetWidth;
  stage.classList.add('jumping');
  timer = setTimeout(() => stage.classList.remove('jumping'), 650);
  feedback('ジャンプ！ 操作のアニメーションを表示しました。');
}
$('jump').addEventListener('click', jump);
window.addEventListener('keydown', event => {
  if (event.repeat || /INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName) || document.querySelector('dialog[open]')) return;
  if (['Space','ArrowUp','KeyW'].includes(event.code)) { event.preventDefault(); jump(); }
});
$('repair').addEventListener('click', () => { if(mode !== 'play' || !state.repair || state.shield === 3) return; state.repair--; state.shield++; render(); feedback('シールドを1回復しました。シールド 3 / 3'); });
$('boost').addEventListener('click', () => { if(mode !== 'play' || !state.boost || state.energy === 100) return; const before = state.energy; state.boost--; state.energy = Math.min(100,state.energy+20); render(); feedback(`エネルギーを${state.energy-before}%回復しました。現在 ${state.energy}%`); });
$('pause').addEventListener('click', () => changeMode(mode === 'pause' ? 'play' : 'pause'));
$('demo').addEventListener('change', event => changeMode(event.target.value));
$('overlay-action').addEventListener('click', () => { const retry = mode === 'result'; if(retry) state=initial(); changeMode('play'); if(retry) feedback('もう一度挑戦。距離378 m・シールド2・エネルギー68%のサンプル状態に戻しました。'); });
for (const name of ['help','settings']) $(name).addEventListener('click', () => $(name+'-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('volume').addEventListener('input', () => { $('volume-value').textContent = $('volume').value + '%'; });
$('motion').addEventListener('change', () => document.body.classList.toggle('reduced',$('motion').checked));
render();

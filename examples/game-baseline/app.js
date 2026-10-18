import { draw } from './game-ux-render.js';
const $ = id => document.getElementById(id);
const canvas = $('scene');
let screen = 'play', shield = 2, energy = 68, repairs = 1, boosts = 2, animation = 0;
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let volume = 60;
const sample = { y: 0, x: 850, distance: 378 };
draw(canvas, sample);
function feedback(text) { $('feedback').textContent = text; }
function refresh() {
 $('shield').innerHTML = `${'◆ '.repeat(shield)}${'◇ '.repeat(3 - shield)}<small>${shield} / 3</small>`;
 $('energyLabel').textContent = `${energy}%`; $('energyBar').style.width = `${energy}%`;
 $('repairCount').textContent = `×${repairs}`; $('boostCount').textContent = `×${boosts}`;
 $('repair').disabled = screen !== 'play' || !repairs || shield === 3;
 $('boost').disabled = screen !== 'play' || !boosts || energy === 100;
 $('jump').disabled = screen !== 'play'; $('pause').disabled = screen !== 'play';
 document.querySelectorAll('[data-state]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.state === screen)));
 document.querySelector('.signal').innerHTML = `<i></i> ${screen === 'play' ? '探索中' : screen === 'pause' ? '一時停止中' : '探索終了'}`;
}
function setScreen(next) {
 screen = next; cancelAnimationFrame(animation); animation = 0; draw(canvas, sample);
 const overlay = $('overlay'); overlay.hidden = next === 'play';
 if (next === 'pause') overlay.innerHTML = '<div><p class="eyebrow">TAKE A BREATH</p><h2>ちょっと、ひと休み。</h2><p>月は逃げません。<br>準備ができたら、探索を再開しましょう。</p><button class="primary" id="resume">探索を再開</button></div>';
 if (next === 'result') overlay.innerHTML = '<div><p class="eyebrow">EXPLORATION COMPLETE · SAMPLE</p><h2>次は、もっと遠くへ。</h2><p>終了理由：シールドがなくなりました</p><div class="result-values"><div><span>今回の距離</span><strong>378 <small>m</small></strong></div><div><span>セッションベスト</span><strong>1,220 <small>m</small></strong></div></div><p>表示値はデモ用のサンプルです。</p><button class="primary" id="retry">もう一度挑戦</button></div>';
 if ($('resume')) $('resume').onclick = () => { setScreen('play'); feedback('探索を再開しました。'); $('jump').focus(); };
 if ($('retry')) $('retry').onclick = retry;
 refresh();
}
function retry() { shield = 2; energy = 68; repairs = 1; boosts = 2; setScreen('play'); feedback('サンプル状態に戻しました。もう一度操作を試せます。'); $('jump').focus(); }
function jump() {
 if (screen !== 'play' || $('modal').open || animation) return;
 feedback(reducedMotion ? 'ジャンプ！ 動きを減らす設定が有効です。' : 'ジャンプ！ 月面をふわりとひと跳び。');
 if (reducedMotion) return;
 const start = performance.now();
 function frame(time) { const progress = Math.min(1, (time - start) / 750); draw(canvas, { ...sample, y: Math.sin(progress * Math.PI) * 95 }); if (progress < 1) animation = requestAnimationFrame(frame); else { animation = 0; draw(canvas, sample); } }
 animation = requestAnimationFrame(frame);
}
$('jump').onclick = jump;
$('pause').onclick = () => { setScreen('pause'); $('resume').focus(); };
$('repair').onclick = () => { if (screen !== 'play' || !repairs || shield === 3) return; repairs--; shield++; refresh(); feedback('修理完了。シールドが3 / 3に回復しました。'); };
$('boost').onclick = () => { if (screen !== 'play' || !boosts || energy === 100) return; boosts--; energy = Math.min(100, energy + 20); refresh(); feedback(`ブースト使用。エネルギーが${energy}%に回復しました。`); };
document.querySelectorAll('[data-state]').forEach(button => button.onclick = () => { setScreen(button.dataset.state); feedback('画面プレビューを切り替えました。表示値はサンプルです。'); });
document.addEventListener('keydown', event => {
 if ($('modal').open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
 if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) { if (event.code === 'Space' && event.target.closest('button,a')) return; event.preventDefault(); if (!event.repeat) jump(); }
 if (event.code === 'Escape' && screen !== 'result') setScreen(screen === 'play' ? 'pause' : 'play');
});
function openModal(content) { $('modalContent').innerHTML = content; $('modal').showModal(); }
$('help').onclick = () => openModal('<p class="eyebrow">HOW TO PLAY</p><h2>月面探索の手引き</h2><p>ジャンプボタン、または Space・↑・W キーでロボットがジャンプします。</p><p>修理キットはシールドを1回復。ブーストはエネルギーを20%回復します。持ちものは使用するたびに1個減ります。</p><p>Ⅱ ボタンで一時停止、再開ボタンで戻れます。Esc キーでも切り替えられます。</p><p class="modal-note">このUIデモでは、スクロール・衝突判定・音声・実際の進行や記録の保存は行いません。画面下のプレビューで各状態を確認できます。</p>');
$('settings').onclick = () => {
 openModal(`<p class="eyebrow">PREFERENCES</p><h2>設定</h2><label class="setting">音量 <output id="volumeValue">${volume}%</output><input id="volume" type="range" min="0" max="100" value="${volume}" aria-label="音量"></label><p class="modal-note">音量設定の操作デモです。音声は再生しません。</p><label class="setting"><input id="motion" type="checkbox" ${reducedMotion ? 'checked' : ''}>動きを減らす</label><p class="modal-note">ジャンプアニメーションを省略し、文字で操作結果を表示します。設定はこのページを開いている間だけ保持されます。</p>`);
 $('volume').oninput = event => { volume = Number(event.target.value); $('volumeValue').textContent = `${volume}%`; };
 $('motion').onchange = event => { reducedMotion = event.target.checked; document.body.classList.toggle('reduce-motion', reducedMotion); if (reducedMotion) { cancelAnimationFrame(animation); animation = 0; draw(canvas, sample); } };
};
$('closeModal').onclick = () => $('modal').close();
$('modal').addEventListener('click', event => { if (event.target === $('modal')) { const box = $('modal').getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('modal').close(); } });
document.body.classList.toggle('reduce-motion', reducedMotion);
refresh();

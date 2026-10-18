import {draw} from './scene.js';
const $=id=>document.getElementById(id);
draw($('scene'),{y:0,x:850,distance:378});
let state='play',shield=2,energy=68,kits=1,boosts=2,volume=60,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,jumpTimer,noticeTimer;
const game=document.querySelector('.game');
function feedback(message){clearTimeout(noticeTimer);$('feedback').textContent=message;noticeTimer=setTimeout(()=>$('feedback').textContent='',3200)}
function update(){
$('shield').innerHTML=`${'◆ '.repeat(shield)}${'◇ '.repeat(3-shield)} <small>${shield} / 3</small>`;
$('energy').textContent=energy+'%';$('energyMeter').value=energy;$('kitCount').textContent=kits;$('boostCount').textContent=boosts;
$('repair').disabled=state!=='play'||!kits||shield===3;$('boost').disabled=state!=='play'||!boosts||energy===100;$('jump').disabled=state!=='play';
$('repair').title=!kits?'使い切りました':shield===3?'シールドは最大です':'';$('boost').title=!boosts?'使い切りました':energy===100?'エネルギーは最大です':'';
$('pause').disabled=state==='result';$('pause').textContent=state==='pause'?'▶ 再開':'Ⅱ 一時停止';
}
function setState(next){state=next;clearTimeout(jumpTimer);game.classList.remove('jumping');$('demoState').value=next;$('stateOverlay').hidden=next==='play';document.querySelector('.hud').hidden=next==='result';$('feedback').textContent='';
if(next!=='play'){$('stateEyebrow').textContent=next==='pause'?'PAUSED':'RUN ENDED';$('stateTitle').textContent=next==='pause'?'一時停止':'探索終了';$('stateReason').textContent=next==='pause'?'ひと息ついたら、月面へ。':'岩に衝突し、シールドを失いました。';$('resultStats').hidden=next!=='result';$('stateAction').textContent=next==='pause'?'探索を再開':'もう一度';$('stateTitle').focus()}
update()}
function jump(){if(state!=='play'||$('dialog').open||game.classList.contains('jumping'))return;game.classList.add('jumping');feedback('ジャンプ！');jumpTimer=setTimeout(()=>game.classList.remove('jumping'),650)}
$('jump').onclick=jump;
$('repair').onclick=()=>{if(state!=='play'||!kits||shield===3)return;shield++;kits--;update();feedback('シールド +1 · 3 / 3 に回復しました')};
$('boost').onclick=()=>{if(state!=='play'||!boosts||energy===100)return;let before=energy;energy=Math.min(100,energy+20);boosts--;update();feedback(`エネルギー +${energy-before}% · ${energy}% に回復しました`)};
$('pause').onclick=()=>setState(state==='pause'?'play':'pause');$('demoState').onchange=e=>setState(e.target.value);
$('stateAction').onclick=()=>{if(state==='result'){shield=2;energy=68;kits=1;boosts=2}setState('play');$('jump').focus()};
function openDialog(title,html){$('dialogTitle').textContent=title;$('dialogContent').innerHTML=html;$('dialog').showModal()}
$('help').onclick=()=>openDialog('遊び方','<p>月面をジャンプで進み、600 m先のゴールを目指します。鉱石を集めながら、岩を避けましょう。</p><p>ジャンプは画面のボタン、または Space・↑・W。修理キットはシールドを1、ブーストはエネルギーを20%回復します（上限100%）。</p><p>このUIデモではジャンプ演出とアイテム操作を試せます。距離とミッションは固定です。下の「画面を確認」で終了画面も確認できます。</p>');
$('missions').onclick=()=>openDialog('ミッション','<div class="mission"><strong>鉱石を20個集める</strong><small>12 / 20個 · あと8個</small></div><div class="mission"><strong>無傷でチェックポイントに到達</strong><small>チェックポイント 400 m · あと22 m</small></div>');
$('settings').onclick=()=>{openDialog('設定',`<label for="volume">音量 <output id="volumeValue">${volume}</output>%<input id="volume" type="range" min="0" max="100" value="${volume}"></label><p>デモでは音声は再生されません。</p><label><input id="motion" type="checkbox" ${reduced?'checked':''}>動きを減らす</label>`);$('volume').oninput=e=>{volume=Number(e.target.value);$('volumeValue').value=volume};$('motion').onchange=e=>{reduced=e.target.checked;document.body.classList.toggle('reduced',reduced)}};
$('close').onclick=()=>$('dialog').close();
document.addEventListener('keydown',e=>{if(e.repeat||$('dialog').open||e.target.closest('button,input,select,textarea,a'))return;if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();jump()}});
document.body.classList.toggle('reduced',reduced);update();

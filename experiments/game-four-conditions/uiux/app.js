import {draw} from './scene.js';
const $=id=>document.getElementById(id),canvas=$('scene'),base={y:0,x:850,distance:378};
let state='play',shield=2,energy=68,kits=1,boosts=2,animation=0;
$('motion').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
draw(canvas,base);
function feedback(text){$('feedback').textContent=text;}
function stats(){
 $('shield').innerHTML=`${'◆ '.repeat(shield)}${'◇ '.repeat(3-shield)}<small>${shield}/3</small>`;
 $('energy').textContent=energy+'%';$('energy-bar').value=energy;$('kits').textContent=kits;$('boosts').textContent=boosts;
 $('repair').disabled=state!=='play'||!kits||shield===3;$('boost').disabled=state!=='play'||!boosts||energy===100;$('jump').disabled=state!=='play';
 $('repair').title=!kits?'修理キットは使用済み':shield===3?'シールドは最大です':'';
 $('boost').title=!boosts?'ブーストは使用済み':energy===100?'エネルギーは最大です':'';
}
function stop(){cancelAnimationFrame(animation);animation=0;draw(canvas,base);canvas.classList.remove('flash');}
function setState(next){stop();state=next;$('demo').value=next;$('overlay').hidden=next==='play';$('results').hidden=next!=='result';$('pause').textContent=next==='pause'?'再開':'一時停止';$('pause').disabled=next==='result';feedback('');
 if(next==='pause'){$('title').textContent='一時停止';$('reason').textContent='準備ができたら、月面へ。';$('continue').textContent='再開する';}
 if(next==='result'){$('title').textContent='ゲームオーバー';$('reason').textContent='終了理由：岩に衝突（結果画面のサンプル）';$('continue').textContent='もう一度挑戦';}
 stats();if(next!=='play')$('title').focus();
}
$('pause').onclick=()=>setState(state==='pause'?'play':'pause');$('demo').onchange=e=>setState(e.target.value);
$('continue').onclick=()=>{if(state==='result'){shield=2;energy=68;kits=1;boosts=2;}setState('play');$('jump').focus();feedback('プレイ画面に戻りました。');};
$('repair').onclick=()=>{if(state!=='play'||!kits||shield===3)return;shield++;kits--;stats();feedback('シールドを1回復しました。修理キットは残り0個です。');};
$('boost').onclick=()=>{if(state!=='play'||!boosts||energy===100)return;const gain=Math.min(20,100-energy);energy+=gain;boosts--;stats();feedback(`エネルギーを${gain}%回復しました。ブーストは残り${boosts}個です。`);};
function jump(){if(state!=='play'||animation||document.querySelector('dialog[open]'))return;feedback('ジャンプ');if($('motion').checked){canvas.classList.add('flash');setTimeout(()=>canvas.classList.remove('flash'),180);return;}const start=performance.now();function frame(now){const t=Math.min((now-start)/650,1);draw(canvas,{...base,y:Math.sin(t*Math.PI)*100});if(t<1)animation=requestAnimationFrame(frame);else{animation=0;draw(canvas,base);}}animation=requestAnimationFrame(frame);}
$('jump').onclick=jump;
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('button,input,select,dialog,a'))return;if(['Space','ArrowUp','KeyW'].includes(e.code)&&state==='play'){e.preventDefault();jump();}});
for(const name of ['help','settings']){const dialog=$(name+'-dialog');$(name).onclick=()=>{stop();dialog.showModal();};dialog.querySelector('button').onclick=()=>dialog.close();}
$('volume').oninput=e=>$('volume-value').value=e.target.value+'%';$('motion').onchange=stop;stats();

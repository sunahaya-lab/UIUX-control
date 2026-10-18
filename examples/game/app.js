import {draw} from './scene.js';
const $=s=>document.querySelector(s), canvas=$('canvas'), root=$('#game'), dialog=$('#dialog');
let state='play',shield=2,energy=68,repair=1,boost=2,volume=60,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,jumping=false,lastOpener=null;
function renderScene(y=0){draw(canvas,{y,x:850,distance:378});}
function sync(){
 $('#shields').innerHTML=Array.from({length:3},(_,i)=>`<i class="${i<shield?'':'empty'}"></i>`).join('');$('#shields').setAttribute('aria-label',`シールド${shield}/3`);
 $('#energy-value').textContent=energy+'%';$('#energy').value=energy;$('#repair-count').textContent=repair;$('#boost-count').textContent=boost;
 $('#repair').disabled=repair===0||shield===3;$('#boost').disabled=boost===0||energy===100;
}
function setState(next,focus=true){
 state=next;root.dataset.state=state;$('#demo-state').value=state;$('#screen').hidden=state==='play';$('#result-data').hidden=state!=='result';$('#restart').hidden=state!=='pause';
 $('#screen-title').textContent=state==='result'?'ゲームオーバー':'一時停止';$('#screen-reason').textContent=state==='result'?'岩に当たりました。':'';$('#screen-reason').hidden=state!=='result';$('#resume').textContent=state==='result'?'もう一度':'続ける';
 if(focus)(state==='play'?canvas:$('#screen-title')).focus({preventScroll:true});
}
function reset(){shield=2;energy=68;repair=1;boost=2;sync();setState('play');renderScene();}
function jump(){
 if(state!=='play'||jumping||dialog.open)return;
 jumping=true;const start=performance.now(),duration=reduced?180:650;
 function tick(now){if(state!=='play'){jumping=false;renderScene();return;}const t=Math.min(1,(now-start)/duration);renderScene(Math.sin(t*Math.PI)*(reduced?25:110));if(t<1)requestAnimationFrame(tick);else jumping=false;}requestAnimationFrame(tick);
}
$('#jump').onclick=()=>{jump();canvas.focus({preventScroll:true});};canvas.onpointerdown=e=>{if(e.isPrimary&&e.button===0){e.preventDefault();jump();canvas.focus({preventScroll:true});}};
$('#repair').onclick=()=>{if(repair&&shield<3){repair--;shield=Math.min(3,shield+1);sync();}};$('#boost').onclick=()=>{if(boost&&energy<100){boost--;energy=Math.min(100,energy+20);sync();}};
$('#pause').onclick=()=>setState('pause');$('#resume').onclick=()=>state==='result'?reset():setState('play');$('#restart').onclick=reset;$('#demo-state').onchange=e=>setState(e.target.value,false);
$('#mission-toggle').onclick=()=>{const closed=$('#mission-body').hidden;$('#mission-body').hidden=!closed;$('#mission-toggle').textContent=closed?'−':'+';$('#mission-toggle').setAttribute('aria-expanded',String(closed));};
function openDialog(kind,opener){lastOpener=opener;if(state==='play')setState('pause',false);$('#dialog-title').textContent=kind==='settings'?'設定':'遊び方';$('#dialog-body').innerHTML=kind==='settings'?`<label class="setting">音量 <output id="volume-value">${volume}%</output><input type="range" id="volume" aria-label="音量" min="0" max="100" value="${volume}"></label><label class="setting"><input type="checkbox" id="motion" ${reduced?'checked':''}>動きを控えめにする</label><p>音声はこのデモでは再生しません。</p>`:'<dl><dt>ジャンプ</dt><dd>Space・↑・W、画面タップ、またはジャンプボタン</dd><dt>一時停止</dt><dd>Esc、または一時停止ボタン</dd><dt>装備</dt><dd>修復はシールドを1回復、ブーストはエネルギーを20%回復します。使用回数は表示の数までです。</dd></dl><p>移動と衝突は省略したUIデモです。上部の「表示状態」で結果画面も確認できます。</p>';
 if(kind==='settings'){$('#volume').oninput=e=>{volume=+e.target.value;$('#volume-value').textContent=volume+'%';};$('#motion').onchange=e=>{reduced=e.target.checked;};}dialog.showModal();}
$('#settings').onclick=()=>openDialog('settings',$('#settings'));$('#help').onclick=()=>openDialog('help',$('#help'));$('#dialog-close').onclick=()=>dialog.close();$('#dialog-done').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(state!=='play')$('#screen-title').focus({preventScroll:true});else lastOpener?.focus();});
document.addEventListener('keydown',e=>{if(dialog.open||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Escape'&&state==='play'){e.preventDefault();setState('pause');}if(['Space','ArrowUp','KeyW'].includes(e.code)&&state==='play'&&!e.target.closest('button,input,select,a')){e.preventDefault();if(!e.repeat)jump();}});
sync();renderScene();

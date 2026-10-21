const $=id=>document.getElementById(id);
const buttons=[$('old-tab'),$('new-tab')],frames=[$('old-frame'),$('new-frame')];
buttons.forEach((button,i)=>button.addEventListener('click',()=>{
  buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
  frames.forEach((f,j)=>f.hidden=i!==j);
  $('open-current').href=i===0?'applied/':'expressive/';
  $('open-current').textContent=i===0?'前版を単独で開く ↗':'新版を単独で開く ↗';
}));
let run=0,playing=false,cleanups=[];
function stop(text){run++;playing=false;cleanups.splice(0).forEach(fn=>fn());$('play-sequence').textContent='両版を初期化して操作例を再生';$('playback-status').textContent=text;}
function reloadFrame(frame){return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{frame.removeEventListener('load',done);reject(new Error('load timeout'));},12000);
  function done(){clearTimeout(timeout);resolve();}
  frame.addEventListener('load',done,{once:true});frame.src=frame.getAttribute('src');
});}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function press(frame,selector){const element=frame.contentDocument?.querySelector(selector);if(!element)throw new Error('control missing');element.click();}
$('play-sequence').addEventListener('click',async()=>{
  if(playing){stop('再生を停止しました。現在の編成から操作できます。');return;}
  playing=true;const current=++run;$('play-sequence').textContent='再生を停止';$('playback-status').textContent='両版を初期状態へ戻しています…';
  try{
    await Promise.all(frames.map(reloadFrame));if(current!==run)return;
    frames.forEach(f=>{const doc=f.contentDocument;const interrupt=()=>stop('再生を停止しました。現在の編成から操作できます。');doc.addEventListener('pointerdown',interrupt,{once:true});doc.addEventListener('keydown',interrupt,{once:true});cleanups.push(()=>{doc.removeEventListener('pointerdown',interrupt);doc.removeEventListener('keydown',interrupt);});});
    await pause(450);if(current!==run)return;
    $('playback-status').textContent='① 選択：鍵守便・ミラ';frames.forEach(f=>press(f,'[data-card="mira-key"]'));
    await pause(1300);if(current!==run)return;
    $('playback-status').textContent='② 比較：枠2のレオンと能力を比べる';frames.forEach(f=>press(f,'[data-slot="1"]'));press(frames[1],'#compare-tab');
    await pause(1800);if(current!==run)return;
    $('playback-status').textContent='③ 配置：枠2をミラに入れ替える';press(frames[0],'#add');press(frames[1],'#place');
    await pause(1100);if(current!==run)return;
    const totals=[frames[0].contentDocument.querySelector('#cost-total')?.textContent,frames[1].contentDocument.querySelector('#total-cost')?.textContent];
    if(!totals.every(value=>value?.trim()==='5')||!frames.every(f=>f.contentDocument.querySelector('[data-slot="1"]')?.textContent.includes('ミラ')))throw new Error('sequence result mismatch');
    stop('再生完了：両版とも枠2がミラ、合計コスト5/9です。このまま操作できます。');
  }catch{if(current===run)stop('操作例を再生できませんでした。各版を単独で開いて試せます。');}
});

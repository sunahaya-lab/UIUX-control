import {cards,createState,getCard,totalCost,assessPlacement,place,remove,compare,canConfirm} from './model.mjs';

const $=id=>document.getElementById(id);
const portraits=['luca','leon','mira'];
const asset=c=>`assets/${portraits[c.portrait]}.png`;
const name=c=>`${c.title}・${c.name}`;
const number=n=>n.toLocaleString('ja-JP');
const colors={月:'#f1d18c',火:'#f4af8d',星:'#a2dfd3'};
let state=createState(),mode='ability',filter='all',query='',heroToken=0,lastPortrait=-1;
let heroAnim,panelAnim,travelAnim,sealAnim,arrivalTimer;
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
const reduced=()=>$('reduce-motion').checked||systemMotion.matches;
const warm=portraits.map(p=>{const image=new Image();image.src=`assets/${p}.png`;return image;});

function status(text='',error=false){$('action-status').textContent=text;$('action-status').classList.toggle('error',error);}
function stopTravel(){
  travelAnim?.cancel();sealAnim?.cancel();clearTimeout(arrivalTimer);
  $('travel-layer').replaceChildren();$('arrival-seal').style.display='none';
  document.querySelectorAll('.arrived').forEach(e=>e.classList.remove('arrived'));
}
function animatePanel(){
  panelAnim?.cancel();
  const el=mode==='compare'?$('compare-view'):$('ability-view');
  if(!reduced())panelAnim=el.animate([{opacity:.45,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'});
}
function renderRoster(){
  const list=cards.filter(c=>(filter==='all'||c.element===filter)&&name(c).includes(query.trim()));
  $('card-count').textContent=`${list.length}枚`;$('empty').hidden=!!list.length;
  $('card-list').innerHTML=list.map(c=>`<button class="card" data-card="${c.id}" aria-pressed="${state.selected===c.id}" aria-label="${name(c)}、${c.element}、コスト${c.cost}"><img src="${asset(c)}" alt="" loading="eager"><span class="card-cost">${c.cost}</span>${state.squad.includes(c.id)?'<span class="in-squad">編成中</span>':''}<span class="card-title">${c.title}</span><strong>${c.name}</strong></button>`).join('');
}
function renderSlots(){
  $('slots').innerHTML=state.squad.map((id,i)=>{const c=getCard(id);return `<button class="slot" data-slot="${i}" aria-pressed="${state.active===i}" aria-label="枠${i+1}、${c?name(c):'空き'}を配置先にする">${c?`<img src="${asset(c)}" alt=""><span><small>${c.title}</small><strong>${c.name}</strong></span>`:'<span class="vacancy" aria-hidden="true">＋</span><span><small>未配置</small><strong>空き枠</strong></span>'}<span class="slot-no" aria-hidden="true">0${i+1}</span></button>`;}).join('');
  $('total-cost').textContent=totalCost(state.squad);
  $('formation-status').textContent=`${state.squad.filter(Boolean).length} / 3人`;
  $('remove').disabled=!state.squad[state.active];
  $('remove').textContent=`枠${state.active+1}を空に`;
  $('confirm').setAttribute('aria-disabled',String(!canConfirm(state).ok));
}
function renderComparison(){
  const {current,candidate,deltas}=compare(state);
  $('comparison-title').textContent=current?`枠${state.active+1}：${name(current)} → ${name(candidate)}`:`枠${state.active+1}は空き枠`;
  if(!current){$('comparison').innerHTML='<div class="compare-empty"><b>新しい配達人を迎える枠です。</b><p>入れ替えるカードがないため、能力差はありません。</p></div>';}
  else{
    $('comparison').innerHTML=`<table class="comparison-table"><thead><tr><th scope="col">能力</th><th scope="col">現在</th><th scope="col">候補</th><th scope="col">変化</th></tr></thead><tbody>${[['体力','hp'],['攻撃','attack'],['速度','speed'],['コスト','cost']].map(([label,key])=>{const d=deltas[key],better=key==='cost'?d<0:d>0;return `<tr><td>${label}</td><td>${number(current[key])}</td><td>${number(candidate[key])}</td><td class="${d===0?'':better?'delta-up':'delta-down'}">${d>0?'+':''}${number(d)}</td></tr>`;}).join('')}</tbody></table>`;
  }
  const next=[...state.squad];next[state.active]=state.selected;
  $('next-cost').innerHTML=`配置後の合計コスト <strong>${totalCost(next)} / 9</strong>`;
}
function renderDetail(){
  const c=getCard(state.selected);
  document.documentElement.style.setProperty('--accent',colors[c.element]);
  $('hero-title').textContent=c.title;$('hero-name').textContent=c.name;
  $('hero-rarity').textContent=c.rarity==='SSR'?'特級':'上級';$('hero-element').textContent=c.element;$('hero-role').textContent=c.role;
  $('card-cost').textContent=c.cost;
  $('stats').innerHTML=[['体力',c.hp],['攻撃',c.attack],['速度',c.speed]].map(([k,v])=>`<div><dt>${k}</dt><dd>${number(v)}</dd></div>`).join('');
  $('skill-name').textContent=c.skill;$('skill-effect').textContent=c.effect;$('passive').textContent=c.passive;
  if(lastPortrait!==c.portrait){
    lastPortrait=c.portrait;const token=++heroToken;const art=$('hero-art');heroAnim?.cancel();art.style.visibility='hidden';art.alt=`${c.name}の立ち絵`;art.src=asset(c);
    art.decode().then(()=>{if(token!==heroToken)return;art.style.visibility='';if(!reduced())heroAnim=art.animate([{opacity:0,transform:'translateX(24px)'},{opacity:1,transform:'translateX(0)'}],{duration:230,easing:'cubic-bezier(.2,.75,.2,1)'});}).catch(()=>{if(token===heroToken){art.style.visibility='';art.alt=`${c.name}の画像を読み込めません。能力と編成は操作できます。`;}});
  }
  renderComparison();
  $('place-label').textContent=`枠${state.active+1}へ${state.squad[state.active]?'入れ替える':'配置する'}`;
  const check=assessPlacement(state);$('place').setAttribute('aria-disabled',String(!check.ok));
}
function readiness(){const check=assessPlacement(state);status(check.ok?'':check.message);}
function renderAll(){renderRoster();renderSlots();renderDetail();readiness();}
function selectCard(id){
  if(!getCard(id)||id===state.selected)return;
  stopTravel();state={...state,selected:id};
  document.querySelectorAll('[data-card]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.card===id)));
  renderDetail();readiness();animatePanel();
}
function setMode(value){
  if(mode===value)return;mode=value;$('studio').dataset.mode=mode;
  $('ability-tab').setAttribute('aria-pressed',String(mode==='ability'));$('compare-tab').setAttribute('aria-pressed',String(mode==='compare'));
  $('ability-view').hidden=mode!=='ability';$('compare-view').hidden=mode!=='compare';animatePanel();
}
function placementMotion(sourceRect,slotIndex,c){
  stopTravel();const target=document.querySelector(`[data-slot="${slotIndex}"]`);target.classList.add('arrived');
  if(reduced()){arrivalTimer=setTimeout(()=>target.classList.remove('arrived'),650);return;}
  const end=target.getBoundingClientRect();
  let start=sourceRect;
  if(!start||start.top<0||start.bottom>innerHeight)start=$('place').getBoundingClientRect();
  const chip=document.createElement('div');chip.className='travelling-card';chip.innerHTML=`<img src="${asset(c)}" alt="">`;
  chip.style.left=`${start.left+start.width/2-38}px`;chip.style.top=`${start.top+start.height/2-53}px`;$('travel-layer').append(chip);
  const dx=end.left+end.width/2-(start.left+start.width/2),dy=end.top+end.height/2-(start.top+start.height/2);
  travelAnim=chip.animate([{transform:'translate(0,0) rotate(-8deg) scale(1)',opacity:.95},{transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(.35)`,opacity:0}],{duration:360,easing:'cubic-bezier(.2,.65,.2,1)',fill:'forwards'});
  travelAnim.finished.then(()=>chip.remove()).catch(()=>chip.remove());
  const seal=$('arrival-seal');seal.style.left=`${end.right-49}px`;seal.style.top=`${end.top-16}px`;seal.style.display='grid';
  sealAnim=seal.animate([{opacity:0,transform:'rotate(-24deg) scale(1.5)'},{opacity:1,transform:'rotate(-14deg) scale(1)',offset:.36},{opacity:1,transform:'rotate(-14deg) scale(1)',offset:.75},{opacity:0,transform:'rotate(-14deg) scale(1)'}],{duration:650,easing:'ease-out',fill:'forwards'});
  arrivalTimer=setTimeout(()=>{seal.style.display='none';target.classList.remove('arrived');},700);
}
$('card-list').addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(b)selectCard(b.dataset.card);});
$('card-list').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  const buttons=[...$('card-list').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(i<0)return;
  e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,i+(e.key==='ArrowRight'?1:-1)));
  buttons[next].focus({preventScroll:true});buttons[next].scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});selectCard(buttons[next].dataset.card);
});
document.querySelector('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderRoster();});
$('search').addEventListener('input',e=>{query=e.target.value;renderRoster();});
$('clear-search').addEventListener('click',()=>{query='';filter='all';$('search').value='';document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.filter==='all')));renderRoster();$('search').focus();});
$('slots').addEventListener('click',e=>{const b=e.target.closest('[data-slot]');if(!b)return;stopTravel();state={...state,active:Number(b.dataset.slot)};renderSlots();renderDetail();readiness();document.querySelector(`[data-slot="${state.active}"]`).focus({preventScroll:true});if(mode==='compare')animatePanel();});
$('ability-tab').addEventListener('click',()=>setMode('ability'));$('compare-tab').addEventListener('click',()=>setMode('compare'));
$('place').addEventListener('click',()=>{
  const source=document.querySelector(`[data-card="${state.selected}"]`)?.getBoundingClientRect();const c=getCard(state.selected),slot=state.active;const result=place(state);
  if(!result.ok){status(result.message,result.code!=='same-slot');return;}
  state=result.state;renderAll();status(result.message);placementMotion(source,slot,c);
});
$('remove').addEventListener('click',()=>{stopTravel();const result=remove(state);state=result.state;renderAll();status(result.message,!result.ok);document.querySelector(`[data-slot="${state.active}"]`).focus({preventScroll:true});});
const openers=new WeakMap();
function open(dialog){stopTravel();openers.set(dialog,document.activeElement);dialog.showModal();dialog.querySelector('h2').focus({preventScroll:true});}
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target.closest('[data-close]'))d.close();});d.addEventListener('close',()=>openers.get(d)?.focus({preventScroll:true}));});
$('help-open').addEventListener('click',()=>open($('help-dialog')));
$('story-open').addEventListener('click',()=>{const c=getCard(state.selected);$('story-title').textContent=name(c);$('story-text').textContent=c.story;open($('story-dialog'));});
function applyMotion(){document.documentElement.classList.toggle('reduced',reduced());if(reduced()){heroAnim?.cancel();panelAnim?.cancel();stopTravel();}}
$('reduce-motion').addEventListener('change',applyMotion);systemMotion.addEventListener('change',applyMotion);applyMotion();
$('confirm').addEventListener('click',()=>{const result=canConfirm(state);if(!result.ok){status(result.message,true);return;}$('result-lineup').innerHTML=state.squad.map((id,i)=>{const c=getCard(id);return `<div class="result-item"><img src="${asset(c)}" alt=""><div><small>枠${i+1} · ${c.title}</small><strong>${c.name}</strong></div><span>コスト ${c.cost}</span></div>`;}).join('');$('result-cost').textContent=totalCost(state.squad);open($('result-dialog'));});
renderAll();

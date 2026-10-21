'use strict';

const cards = [
  {id:'luca-night',name:'ルカ',title:'月航便',element:'月',rarity:'SSR',role:'速攻',cost:3,hp:1280,attack:340,speed:112,portrait:0,skill:'月封の一閃',effect:'敵単体に月属性ダメージ。次の味方の速度を上げる。',passive:'月の仲間がいると攻撃 +10%。',story:'眠らない街を渡り、宛名の消えた手紙を届ける配達人。'},
  {id:'leon-raven',name:'レオン',title:'煤羽便',element:'火',rarity:'SSR',role:'攻撃',cost:4,hp:1600,attack:430,speed:86,portrait:1,skill:'黒翼の速達',effect:'敵全体に火属性ダメージ。自分の防御が一時的に下がる。',passive:'先頭枠で攻撃 +8%。',story:'煙突の間を縫う黒い羽。彼の配達にはいつも夜明けの匂いがする。'},
  {id:'mira-key',name:'ミラ',title:'鍵守便',element:'星',rarity:'SR',role:'支援',cost:2,hp:1450,attack:210,speed:100,portrait:2,skill:'閉じた夜を開く',effect:'味方全体のHPを回復し、一度だけ弱体を防ぐ。',passive:'異なる属性が3つあると回復 +12%。',story:'届かなかった言葉を収める書庫の番人。鍵の音で人を覚えている。'},
  {id:'luca-express',name:'ルカ',title:'白封速達',element:'星',rarity:'SR',role:'速攻',cost:2,hp:1100,attack:290,speed:124,portrait:0,skill:'白い軌跡',effect:'敵単体に星属性ダメージ。自分の行動順を早める。',passive:'星の仲間がいると速度 +8。',story:'白い封筒を運ぶ日は、いつもより少しだけ足取りが軽い。'},
  {id:'leon-ember',name:'レオン',title:'残火特務',element:'火',rarity:'SSR',role:'攻撃',cost:5,hp:1900,attack:520,speed:72,portrait:1,skill:'焼印の号令',effect:'敵全体に大きな火属性ダメージ。使用後は一度休む。',passive:'火の仲間がいると攻撃 +12%。',story:'夜郵局の最後の切り札。燃やせない手紙ほど重くなるという。'},
  {id:'mira-archive',name:'ミラ',title:'宵の記録',element:'月',rarity:'SR',role:'守護',cost:3,hp:2100,attack:180,speed:82,portrait:2,skill:'静かな保管室',effect:'味方単体をかばい、受けるダメージを軽減する。',passive:'最後尾でHP +10%。',story:'記録は人を縛るだけではない。帰り道を残すためにもある。'}
];
const state = {selected:'luca-night',squad:['luca-night','leon-raven',null],active:2,element:'all',query:''};
const $ = id => document.getElementById(id);
const find = id => cards.find(card => card.id === id);
const total = squad => squad.reduce((sum,id) => sum + (find(id)?.cost || 0),0);
const symbol = {月:'☾',火:'',星:'✧'};
const rarity = card => card.rarity === 'SSR' ? '特級' : '上級';
const portraitStyle = card => `--portrait-x:${card.portrait * 50}%`;
const fullName = card => `${card.title}・${card.name}`;
const number = value => value.toLocaleString('ja-JP');

function message(id,text,error = false){
  $(id).textContent = text;
  $(id).classList.toggle('error',error);
}

function renderCards(){
  const list = cards.filter(card => (state.element === 'all' || card.element === state.element) && `${card.name}${card.title}`.includes(state.query.trim()));
  $('result-count').textContent = `${list.length} 枚`;
  $('empty').hidden = list.length > 0;
  $('card-list').innerHTML = list.map(card => `<button class="card" data-card="${card.id}" aria-pressed="${state.selected === card.id}" aria-label="${fullName(card)}、${card.element}属性、${rarity(card)}、コスト${card.cost}"><div class="portrait card-art" style="${portraitStyle(card)}" aria-hidden="true"></div><div class="card-top" aria-hidden="true"><span>${symbol[card.element]} ${card.element}</span><span>${rarity(card)}</span></div>${state.squad.includes(card.id) ? '<span class="card-status">編成中</span>' : ''}<div class="card-caption"><small>${card.title}</small><div class="card-meta"><strong>${card.name}</strong><span>費 ${card.cost}</span></div></div></button>`).join('');
}

function renderDetail(){
  const card = find(state.selected);
  $('hero-art').style.setProperty('--portrait-x',`${card.portrait * 50}%`);
  $('hero-art').setAttribute('aria-label',`${card.name}の肖像`);
  $('hero-rarity').textContent = `${rarity(card)} · ${card.rarity === 'SSR' ? '三つ星' : '二つ星'}`;
  $('hero-element').textContent = `${symbol[card.element]} ${card.element}`;
  $('hero-role').textContent = card.role;
  $('selected-title').textContent = card.title;
  $('selected-name').textContent = card.name;
  $('local-card').value = card.id;
  $('card-number').textContent = `第 ${String(cards.indexOf(card)+1).padStart(2,'0')} 号`;
  $('stats').innerHTML = [['体力',card.hp],['攻撃',card.attack],['速度',card.speed],['コスト',card.cost]].map(([label,value])=>`<div><dt>${label}</dt><dd>${number(value)}</dd></div>`).join('');
  $('skill-name').textContent = card.skill;
  $('skill-effect').textContent = card.effect;
  $('passive').textContent = card.passive;
  $('story').textContent = card.story;
  renderComparison();
}

function renderComparison(){
  const card = find(state.selected);
  const current = find(state.squad[state.active]);
  $('comparison-title').textContent = `配置先：枠${state.active+1}${current ? ` ${current.name}` : '（空き）'}`;
  if(!current){
    $('comparison-body').innerHTML = '<p>空き枠のため比較対象はいません。</p>';
  }else{
    const changes = [['体力','hp'],['攻撃','attack'],['速度','speed'],['コスト','cost']].map(([label,key])=>{
      const diff = card[key] - current[key];
      const tone = diff === 0 ? '' : ((key === 'cost' ? diff < 0 : diff > 0) ? 'positive' : 'negative');
      return `<div><span>${label}</span><strong class="${tone}">${diff > 0 ? '+' : ''}${number(diff)}</strong></div>`;
    }).join('');
    $('comparison-body').innerHTML = `<p>${fullName(current)} からの変化</p><div class="change-grid">${changes}</div>`;
  }
  const next = [...state.squad];
  next[state.active] = state.selected;
  $('add').textContent = `枠${state.active+1}に${current ? '入れ替え' : '配置'} · コスト ${total(next)}/9`;
}

function renderSquad(){
  $('slots').innerHTML = state.squad.map((id,index)=>{
    const card = find(id);
    return `<button class="slot" data-slot="${index}" aria-pressed="${state.active === index}" aria-label="枠${index+1}、${card ? fullName(card) : '空き'}、配置先に選ぶ"><span class="slot-number" aria-hidden="true">0${index+1}</span>${card ? `<span class="portrait slot-art" style="${portraitStyle(card)}" aria-hidden="true"></span><span class="slot-text"><small>${card.title}</small><strong>${card.name}</strong><span>${card.element} · コスト ${card.cost}</span></span>` : '<span class="vacancy" aria-hidden="true">＋</span><span class="slot-text"><small>未配置</small><strong>空き枠</strong><span>配達人を配置</span></span>'}</button>`;
  }).join('');
  const cost = total(state.squad);
  $('cost-total').textContent = cost;
  $('cost-fill').style.width = `${cost/9*100}%`;
  $('remove').textContent = `枠${state.active+1}を空にする`;
  $('remove').disabled = !state.squad[state.active];
  $('target-slot').innerHTML = state.squad.map((id,index)=>`<option value="${index}" ${index===state.active?'selected':''}>枠${index+1}：${find(id)?.name || '空き'}</option>`).join('');
  const missing = state.squad.filter(id => !id).length;
  message('formation-message', missing ? `あと${missing}人を配置してください。` : '3人の編成を確定できます。');
}

function renderAll(){renderCards();renderDetail();renderSquad();}

$('card-list').addEventListener('click',event=>{
  const button = event.target.closest('[data-card]');
  if(!button) return;
  state.selected = button.dataset.card;
  $('card-list').querySelectorAll('[data-card]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.card === state.selected)));
  renderDetail();
  message('action-message','');
});
$('search').addEventListener('input',event=>{state.query=event.target.value;renderCards();});
$('local-card').innerHTML = cards.map(card=>`<option value="${card.id}">${card.title}・${card.name}</option>`).join('');
$('local-card').addEventListener('change',event=>{
  state.selected=event.target.value;renderCards();renderDetail();message('action-message','');
});
$('target-slot').addEventListener('change',event=>{
  state.active=Number(event.target.value);renderSquad();renderComparison();message('action-message','');
});
$('reduce-motion').addEventListener('change',event=>{
  document.documentElement.classList.toggle('reduce-motion',event.target.checked);
});
document.querySelector('.filters').addEventListener('click',event=>{
  const button = event.target.closest('[data-element]');
  if(!button) return;
  state.element = button.dataset.element;
  document.querySelectorAll('[data-element]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.element === state.element)));
  renderCards();
});
$('reset-filter').addEventListener('click',()=>{
  state.element='all';state.query='';$('search').value='';
  document.querySelectorAll('[data-element]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.element==='all')));
  renderCards();$('search').focus();
});
$('slots').addEventListener('click',event=>{
  const button=event.target.closest('[data-slot]');
  if(!button) return;
  state.active=Number(button.dataset.slot);
  renderSquad();renderComparison();message('action-message','');
  $('slots').querySelector(`[data-slot="${state.active}"]`).focus({preventScroll:true});
});
$('add').addEventListener('click',()=>{
  const duplicate = state.squad.findIndex((id,index)=>id === state.selected && index !== state.active);
  if(duplicate !== -1){message('action-message',`このカードは枠${duplicate+1}に編成中です。別のカードを選んでください。`,true);return;}
  if(state.squad[state.active]===state.selected){message('action-message','この枠には、すでに同じカードが配置されています。');return;}
  const next=[...state.squad];next[state.active]=state.selected;
  if(total(next)>9){message('action-message',`合計コストが${total(next)}になり、上限9を超えます。コストの低いカードを選んでください。`,true);return;}
  state.squad=next;renderAll();
  message('action-message',`枠${state.active+1}に${fullName(find(state.selected))}を配置しました。`);
});
$('remove').addEventListener('click',()=>{
  if(!state.squad[state.active]) return;
  state.squad[state.active]=null;renderAll();
  message('action-message',`枠${state.active+1}を空にしました。`);
  $('slots').querySelector(`[data-slot="${state.active}"]`).focus({preventScroll:true});
});

const modalOpeners = new WeakMap();
function openDialog(dialog){
  modalOpeners.set(dialog,document.activeElement);
  dialog.showModal();
  dialog.querySelector('h2').focus({preventScroll:true});
}
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('click',event=>{if(event.target.closest('[data-close]'))dialog.close();});
  dialog.addEventListener('close',()=>{modalOpeners.get(dialog)?.focus({preventScroll:true});});
});
$('help-open').addEventListener('click',()=>openDialog($('help-dialog')));
$('confirm').addEventListener('click',()=>{
  const missing=state.squad.filter(id=>!id).length;
  if(missing){message('formation-message',`未配置の枠が${missing}つあります。3人を配置してから確定してください。`,true);return;}
  if(total(state.squad)>9){message('formation-message','合計コストを9以内にしてください。',true);return;}
  $('confirmed-lineup').innerHTML=state.squad.map((id,index)=>{
    const card=find(id);
    return `<div class="confirmed-row"><span class="portrait" style="${portraitStyle(card)}" aria-hidden="true"></span><div><small>枠${index+1} · ${card.title}</small><strong>${card.name}</strong></div><span class="lineup-cost">コスト ${card.cost}</span></div>`;
  }).join('');
  $('confirmed-cost').textContent=total(state.squad);
  openDialog($('confirm-dialog'));
});
renderAll();

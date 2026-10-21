'use strict';
const cards = [
  {id:'luca-night',name:'ルカ',title:'月航便',element:'月',rarity:'SSR',role:'速攻',cost:3,hp:1280,attack:340,speed:112,portrait:0,skill:'月封の一閃',effect:'敵単体に月属性ダメージ。次の味方の速度を上げる。',passive:'月の仲間がいると攻撃 +10%。',story:'眠らない街を渡り、宛名の消えた手紙を届ける配達人。'},
  {id:'leon-raven',name:'レオン',title:'煤羽便',element:'火',rarity:'SSR',role:'攻撃',cost:4,hp:1600,attack:430,speed:86,portrait:1,skill:'黒翼の速達',effect:'敵全体に火属性ダメージ。自分の防御が一時的に下がる。',passive:'先頭枠で攻撃 +8%。',story:'煙突の間を縫う黒い羽。彼の配達にはいつも夜明けの匂いがする。'},
  {id:'mira-key',name:'ミラ',title:'鍵守便',element:'星',rarity:'SR',role:'支援',cost:2,hp:1450,attack:210,speed:100,portrait:2,skill:'閉じた夜を開く',effect:'味方全体のHPを回復し、一度だけ弱体を防ぐ。',passive:'異なる属性が3つあると回復 +12%。',story:'届かなかった言葉を収める書庫の番人。鍵の音で人を覚えている。'},
  {id:'luca-express',name:'ルカ',title:'白封速達',element:'星',rarity:'SR',role:'速攻',cost:2,hp:1100,attack:290,speed:124,portrait:0,skill:'白い軌跡',effect:'敵単体に星属性ダメージ。自分の行動順を早める。',passive:'星の仲間がいると速度 +8。',story:'白い封筒を運ぶ日は、いつもより少しだけ足取りが軽い。'},
  {id:'leon-ember',name:'レオン',title:'残火特務',element:'火',rarity:'SSR',role:'攻撃',cost:5,hp:1900,attack:520,speed:72,portrait:1,skill:'焼印の号令',effect:'敵全体に大きな火属性ダメージ。使用後は一度休む。',passive:'火の仲間がいると攻撃 +12%。',story:'夜郵局の最後の切り札。燃やせない手紙ほど重くなるという。'},
  {id:'mira-archive',name:'ミラ',title:'宵の記録',element:'月',rarity:'SR',role:'守護',cost:3,hp:2100,attack:180,speed:82,portrait:2,skill:'静かな保管室',effect:'味方単体をかばい、受けるダメージを軽減する。',passive:'最後尾でHP +10%。',story:'記録は人を縛るだけではない。帰り道を残すためにもある。'}
];
const byId = id => cards.find(card => card.id === id);
const el = id => document.getElementById(id);
let selected = 'luca-night';
let squad = ['luca-night','leon-raven',null];
let activeSlot = 2;
let filter = 'すべて';
let returnFocus = null;
const totalCost = (lineup = squad) => lineup.reduce((sum,id) => sum + (id ? byId(id).cost : 0),0);
function tell(message,error=false){el('status').textContent=message;el('status').classList.toggle('error',error);}
function renderCards(){
  const query=el('search').value.trim();
  const visible=cards.filter(card=>(filter==='すべて'||card.element===filter)&&`${card.name}${card.title}`.includes(query));
  el('result-count').textContent=`${visible.length} / ${cards.length}名`;
  el('cards').innerHTML=visible.length?visible.map(card=>`<button class="courier-card" data-card="${card.id}" aria-pressed="${card.id===selected}" aria-label="${card.name}、${card.title}、${card.element}属性、コスト${card.cost}${squad.includes(card.id)?'、編成中':''}"><span class="card-thumb portrait p${card.portrait}" aria-hidden="true"></span><span class="card-copy"><small>${card.title}</small><strong>${card.name}</strong></span><span class="card-meta">${card.element} · ${card.cost}<small>${squad.includes(card.id)?'編成中':card.role}</small></span></button>`).join(''):'<p class="empty-result">該当する配達員はいません。<br>検索語や属性を変更してください。</p>';
}
function renderDetail(){
  const card=byId(selected);
  for(const key of ['hp','attack','speed','skill','effect','passive','story']) el(key).textContent=card[key];
  el('detail-name').textContent=card.name;
  el('detail-title').textContent=card.title;
  el('art-name').textContent=card.name;
  el('art-title').textContent=card.title;
  el('rarity').textContent=`希少度 · ${card.rarity==='SSR'?'特級':'上級'}`;
  el('element').textContent=card.element;
  el('role').textContent=`役割 · ${card.role}`;
  el('card-cost').textContent=`コスト · ${card.cost}`;
  el('portrait').className=`main-portrait portrait p${card.portrait}`;
  el('portrait').setAttribute('aria-label',`${card.title}の${card.name}`);
  el('compare-slot').textContent=`対象：枠${activeSlot+1}`;
  const current=byId(squad[activeSlot]);
  if(!current){el('comparison').innerHTML='<p class="comparison-empty">空き枠のため、比較する配達員はいません。</p>';}
  else{
    el('comparison').innerHTML=`<p class="comparison-empty">${current.title}・${current.name} からの変化</p><div class="comparison-grid">${[['hp','体力'],['attack','攻撃'],['speed','速度'],['cost','コスト']].map(([key,label])=>{const delta=card[key]-current[key];return `<span>${label}<strong class="${delta>0?'increase':delta<0?'decrease':''}">${delta>0?'+':''}${delta}</strong></span>`;}).join('')}</div>`;
  }
  el('add').textContent=`${card.name}を枠${activeSlot+1}に${current?'入れ替える':'追加する'}`;
}
function renderSlots(){
  el('slots').innerHTML=squad.map((id,index)=>{const card=byId(id);return `<button class="slot" data-slot="${index}" aria-pressed="${index===activeSlot}" aria-label="枠${index+1}、${card?`${card.title}の${card.name}、コスト${card.cost}`:'空き枠'}${index===activeSlot?'、操作対象':''}"><span class="slot-number">${index+1}</span>${card?`<span class="card-thumb portrait p${card.portrait}" aria-hidden="true"></span><span class="slot-text"><small>${card.title}</small><strong>${card.name}</strong></span><span class="slot-cost" aria-hidden="true">${card.cost}</span>`:'<span class="empty-symbol" aria-hidden="true">＋</span><span class="slot-text"><strong>空き枠</strong><small>配達員を追加</small></span>'}</button>`;}).join('');
  el('total').textContent=`${totalCost()} / 9`;
  el('remove').disabled=!squad[activeSlot];
}
function render(){renderCards();renderDetail();renderSlots();}
el('cards').addEventListener('click',event=>{
  const button=event.target.closest('[data-card]');if(!button)return;
  selected=button.dataset.card;renderCards();renderDetail();
  el('cards').querySelector(`[data-card="${selected}"]`).focus({preventScroll:true});
});
document.querySelectorAll('[data-element]').forEach(button=>button.addEventListener('click',()=>{
  filter=button.dataset.element;
  document.querySelectorAll('[data-element]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  renderCards();
}));
el('search').addEventListener('input',renderCards);
el('slots').addEventListener('click',event=>{
  const button=event.target.closest('[data-slot]');if(!button)return;
  activeSlot=Number(button.dataset.slot);renderSlots();renderDetail();
  el('slots').querySelector(`[data-slot="${activeSlot}"]`).focus({preventScroll:true});
  tell(`枠${activeSlot+1}を選択中。${squad[activeSlot]?'配達員を入れ替えるか、枠から外せます。':'配達員を選び、追加してください。'}`);
});
el('add').addEventListener('click',()=>{
  const card=byId(selected);
  if(squad.includes(selected)){tell(`${card.title}・${card.name}はすでに編成中です。同じカードは重複できません。`,true);return;}
  const next=[...squad];next[activeSlot]=selected;
  if(totalCost(next)>9){tell(`編成コストが${totalCost(next)}になります。上限9を超えるため、追加できません。`,true);return;}
  squad=next;render();tell(`枠${activeSlot+1}に${card.title}・${card.name}を編成しました。コスト ${totalCost()} / 9。`);
});
el('remove').addEventListener('click',()=>{
  if(!squad[activeSlot])return;
  const card=byId(squad[activeSlot]);squad[activeSlot]=null;render();
  el('slots').querySelector(`[data-slot="${activeSlot}"]`).focus({preventScroll:true});
  tell(`枠${activeSlot+1}から${card.title}・${card.name}を外しました。`);
});
function openModal(title,content){
  returnFocus=document.activeElement;
  el('modal-title').textContent=title;el('modal-content').innerHTML=content;
  el('modal').showModal();el('close-modal').focus();
}
el('help').addEventListener('click',()=>openModal('配達班の編成方法','<ol><li>名簿から配達員を選ぶと、能力・配達術・特性を確認できます。属性と名前・称号で絞り込めます。</li><li>三つの枠から追加先を選び、詳細の追加・入れ替えボタンを押してください。選んだ枠の配達員を外すこともできます。</li><li>編成コストの合計は9まで。同じカードは二つの枠に入れられません。称号の違うカードは編成できます。</li><li>三つの枠がそろったら「編成を確認」で確認できます。</li></ol><p>キーボードでは、タブキーで移動し、入力キーや空白キーでボタンを操作できます。閉じる操作またはエスケープキーで、この案内を閉じます。</p><p class="modal-note">編成はこの画面を開いている間だけ保持されます。保存・戦闘・音声はありません。</p>'));
el('confirm').addEventListener('click',()=>{
  if(squad.some(id=>!id)){tell('編成の確認には三人必要です。空き枠に配達員を追加してください。',true);return;}
  if(totalCost()>9){tell('編成コストが上限9を超えています。編成を調整してください。',true);return;}
  openModal('今夜の編成を確認',`<p>三人の配達員がそろいました。</p><ol class="confirm-list">${squad.map((id,index)=>{const card=byId(id);return `<li><span>枠${index+1}　${card.title}・${card.name}</span><span>コスト ${card.cost}</span></li>`;}).join('')}</ol><p class="modal-cost">編成コスト ${totalCost()} / 9</p><p class="modal-note">デモの編成確認です。戦闘の開始や保存は行いません。戻って引き続き編集できます。</p>`);
});
el('close-modal').addEventListener('click',()=>el('modal').close());
el('modal-return').addEventListener('click',()=>el('modal').close());
el('modal').addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
render();

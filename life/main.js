import {cards,places,focusLabels} from './content.js?v=1.5';
import {create,resolve,advancePeriod,advanceToDecision,advanceToBirthday,annualIncome,annualExpenses,choiceOptions,randomChoice} from './engine.js?v=1.5.2';
import {slots,slotKey,backupLimit,readLife,packLife,unpackLife} from './life-storage.js?v=1.5.2';
import {localConditions,studyBudget,sharedStages,stageDifference} from './life-context.js?v=1.5';
import {drawScene,drawTitleScene,seasonFor,drawAgeGrid,drawPortrait,familyAt,lifeStage} from './scene.js?v=1.4';
import {archiveLife,completedLives,memoir,sameOrigin,lifeChapters} from './life-archive.js?v=1.5';
import {drawSurvival} from './survival-view.js?v=1.5.2';
import {populationSinceOpen,populationClockSource} from './population-clock.js';
import {monthKey,lifeHistory} from './history.js?v=1.5';
import {isParent,familyBiography} from './family-biography.js?v=1.5.2';
import {censusSource,cities,cityLabel,provinceWeight} from './geography.js';
import {provinceData,provinceSources} from './province-annual.js';
import {firstYear,lastYear,urbanShare} from './population.js';
const dateAt=offset=>monthKey(run.birthYear,offset,run.birthMonth);
let selectedYear=null,dismissedDecision=null;
let journalFilter='all',journalQuery='';
const openSections=new Set();
const yuan=new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:0});
let run=null,playing=false,timer=null,notice='',screen='home';
const app=document.querySelector('#app');
let activeSlot=slots[0],expectedSave=null;
try{
  const remembered=Number(sessionStorage.getItem('life-page.active-slot'));
  if(slots.includes(remembered))activeSlot=remembered;
}catch{}

function selectSlot(slot){
  activeSlot=slot;
  try{sessionStorage.setItem('life-page.active-slot',String(slot));}catch{}
}
function save(){
  if(!run||screen==='archive')return;
  if(run.player.ended)run.archiveId??=crypto.randomUUID();
  try{
    const key=slotKey(activeSlot);
    if(localStorage.getItem(key)!==expectedSave){
      stop();
      notice='这份存档已在另一个页面更新。可先下载本页备份，再返回首页读取最新进度。';
      return;
    }
    const raw=JSON.stringify(run);
    localStorage.setItem(key,raw);
    expectedSave=raw;
  }catch{
    stop();
    notice='浏览器无法写入存档。可以下载本页备份以保留进度。';
    return;
  }
  if(run.player.ended)try{
    archiveLife(localStorage,run);
  }catch{notice='这段人生已存档，但无法加入历史档案。'}
}
function read(slot=activeSlot){
  let raw;
  try{
    raw=localStorage.getItem(slotKey(slot));
    return {raw,life:readLife(raw)};
  }catch{
    return {raw,unreadable:true,life:null};
  }
}
function firstFreeSlot(){
  return slots.find(slot=>read(slot).raw===null);
}
function startNewLife(mode,year,month,seed,identity){
  const current=read();
  if(current.unreadable||current.life&&!current.life.player.ended){
    const free=firstFreeSlot();
    if(free)selectSlot(free);
    else{
      notice='四个位置都已占用。请在存档管理中选择空位、备份后清理一个存档，或选择已结束的人生所在位置。';
      if(screen!=='home'){stop();screen='home';}
      render();
      return;
    }
  }
  expectedSave=read().raw;
  run=create(mode,seed,year,month,identity);
  run.registration=true;selectedYear=null;dismissedDecision=null;
  screen='birth';save();render();
}
function returnHome(){stop();save();screen='home';render()}
function stop(){playing=false;clearInterval(timer);timer=null}
function tick(pace=run?.pace){if(!run||run.player.ended||run.pending.length){stop();render();return}run=advancePeriod(run,pace);selectedYear=null;if(run.auto)auto();if(run.pending.length||run.player.ended)stop();save();render()}
function auto(){while(run.pending.length){let x=run.pending.shift();if(x.kind==='decision'){let c=cards.find(a=>a[1]===x.id);resolve(run.player,c,randomChoice(run.player,c))}}}
function start(){
  if(run.pending.length||run.player.ended)return;
  resumeTimer();
  render();
}
function resumeTimer(){
  stop();playing=true;
  const annualDelay=run.mode==='quick'?2250:7500;
  const stepDelay=run.pace==='month'?Math.max(600,annualDelay/12):annualDelay;
  timer=setInterval(()=>tick(),Math.max(180,stepDelay/run.speed));
}
function startAuto(){
  run.auto=true;
  dismissedDecision=null;
  auto();
  save();
  start();
}
function el(tag,text,cls){let x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x}
function button(label,fn,cls){let b=el('button',label,cls);b.type='button';b.onclick=fn;return b}
function panel(title){let x=el('section',undefined,'card');if(title)x.append(el('h2',title));return x}

function downloadFile(data,name,type){
  const link=el('a');
  link.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));
  link.download=name;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}

function downloadBackup(life){
  downloadFile(packLife(life),'人生一页-'+life.player.name+'.json','application/json;charset=utf-8');
}

function storageDesk(){
  const section=panel('存档管理');
  section.classList.add('storage-desk');
  const list=el('div',undefined,'slot-list');
  for(const slot of slots){
    const {life,raw,unreadable}=read(slot);
    const row=el('div',undefined,'slot-row');
    const title=el('strong','位置 '+slot);
    const detail=el('small',life?life.player.name+' · '+life.player.age+' 岁'+(life.player.ended?' · 已结束':''):
      unreadable?'读取失败':'空位');
    const select=button(undefined,()=>{selectSlot(slot);notice='';render();app.querySelector('.slot-row button[aria-pressed=true]')?.focus();},'muted slot-select');
    select.setAttribute('aria-pressed',String(activeSlot===slot));
    select.append(title,detail);
    row.append(select);
    if(life||typeof raw==='string'){
      row.append(button('备份',()=>life?downloadBackup(life):downloadFile(raw,'人生一页-原始存档-'+slot+'.json','application/json'),'muted'));
      row.append(button('清理',()=>{
        if(!confirm('清理位置 '+slot+'？可先下载备份。'))return;
        try{
          if(localStorage.getItem(slotKey(slot))!==raw)throw new Error();
          localStorage.removeItem(slotKey(slot));
          notice='位置 '+slot+' 已清空。';
        }catch{notice='存档已在其他页面更新，或浏览器拒绝写入。';}
        render();
      },'muted'));
    }
    list.append(row);
  }
  const input=el('input');
  input.type='file';input.accept='.json,application/json';input.hidden=true;
  input.addEventListener('change',async ()=>{
    const file=input.files[0];
    if(!file)return;
    try{
      if(file.size>backupLimit)throw new Error();
      const life=unpackLife(await file.text());
      const free=firstFreeSlot();
      if(!free){notice='导入需要一个空位。现有存档都已保留。';}
      else{
        localStorage.setItem(slotKey(free),JSON.stringify(life));
        selectSlot(free);
        notice='已导入位置 '+free+'，可继续这段人生。';
      }
    }catch{notice='无法导入这份备份。请检查文件格式和存档版本。';}
    if(screen==='home')render();
  });
  section.append(list,button('导入备份',()=>input.click(),'muted'),input);
  return section;
}

function inspector(section){
  const tip=el('div',undefined,'inspect-tip');
  tip.setAttribute('role','status');
  tip.hidden=true;
  section.classList.add('has-inspector');
  section.append(tip);
  const hide=()=>{tip.hidden=true;};
  section.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')hide();});
  section.addEventListener('focusout',event=>{if(!section.contains(event.relatedTarget))hide();});
  section.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  return (title,lines,anchor)=>{
    tip.replaceChildren(el('strong',title),...lines.map(line=>el('p',line)));
    tip.hidden=false;
    const maxLeft=Math.max(8,window.innerWidth-tip.offsetWidth-8);
    tip.style.left=Math.min(maxLeft,Math.max(8,anchor.left+anchor.width/2-tip.offsetWidth/2))+'px';
    const above=anchor.top-tip.offsetHeight-8;
    tip.style.top=(above>=8?above:Math.max(8,Math.min(anchor.bottom+8,window.innerHeight-tip.offsetHeight-8)))+'px';
  };
}

function openRecord(title,tag,trigger,fill){
  const wasPlaying=playing;
  if(wasPlaying)stop();
  const dialog=el('dialog',undefined,'decision-modal record-dialog');
  dialog.setAttribute('aria-label',title);
  const header=el('div',undefined,'decision-header');
  header.append(el('span',tag,'eyebrow'),button('关闭资料卡',()=>dialog.close(),'muted'));
  const body=el('div',undefined,'decision-body');
  body.append(el('h2',title));
  fill(body,dialog);
  dialog.append(header,body);
  dialog.addEventListener('close',()=>{
    dialog.remove();
    if(wasPlaying&&screen==='life'&&!run.player.ended){
      resumeTimer();
    }
    trigger.focus();
  },{once:true});
  app.append(dialog);
  dialog.showModal();
}

function openFamilyRecord(life,member,index,trigger){
  const person=life.player;
  const parent=isParent(member);
  const biography=parent||member.role==='伴侣'?familyBiography(life,member,index):null;
  openRecord(member.name??member.role,'家人资料 · '+member.role,trigger,body=>{
    const facts=el('dl',undefined,'cohort-facts');
    const details=[
      ['与主角关系',member.role],['性别',member.gender??'未记录'],
      ...(biography?[
        ['出生年份',biography.birthYear+' 年'],['出生地',cityLabel(biography.birthCity)],
        ['教育',biography.education],['职业',biography.occupation],['生活爱好',biography.interest],
      ]:[]),
      ['年龄',member.currentAge>110?'档案年龄超过显示范围':member.currentAge+' 岁'],
      ['亲密度',String(member.bond??person.relationships?.family??'未记录')],
      ['家庭状态',member.atHome?'同住':'分开居住'],
      [parent?'进入档案':'加入家庭',parent?'主角出生时':'主角 '+(member.joinedAt??0)+' 岁'],
    ];
    for(const [label,value] of details){
      const line=el('div');
      line.append(el('dt',label),el('dd',value));
      facts.append(line);
    }
    const portrait=drawPortrait({age:member.currentAge,gender:member.gender});
    body.querySelector('h2').before(portrait);
    body.append(facts);
    if(biography){
      body.append(el('h3','从出生开始的人生记录'),el('p','早年背景由游戏生成，家庭节点随本局经历更新。','cohort-footnote'));
      const timeline=el('ol',undefined,'cohort-timeline family-timeline');
      for(const entry of biography.chapters){
        const row=el('li',undefined,'log-entry'+(entry.shared?' log-milestone':''));
        const when=el('span',entry.age+' 岁');
        when.append(el('small',entry.date));
        const narrative=el('div');
        narrative.append(el('strong',entry.title),el('p',entry.text));
        row.append(when,narrative);timeline.append(row);
      }
      body.append(timeline);
    }
  });
}

function familyPanel(life,parentsOnly=false){
  const section=panel(parentsOnly?'出生家庭':'家人与生活');
  section.classList.add('family-panel');
  for(const [index,member] of familyAt(life.player).entries()){
    if(parentsOnly&&!isParent(member))continue;
    const entry=button(undefined,()=>openFamilyRecord(life,member,index,entry),'family-entry record-button');
    entry.setAttribute('aria-haspopup','dialog');
    const detail=member.currentAge>110?'家庭档案':member.currentAge+' 岁 · '+(member.atHome?'同住':'家人');
    entry.append(el('strong',member.name?member.role+' · '+member.name:member.role),el('span',detail+' · 亲密度 '+(member.bond??life.player.relationships?.family??'未记录')));
    section.append(entry);
  }
  return section;
}

function openEventRecord(entry,trigger){
  const card=cards.find(candidate=>candidate[1]===entry.cardId||
    (!entry.cardId&&entry.kind==='decision'&&entry.text.startsWith('「'+candidate[2]+'」')));
  const title=card?.[2]??(entry.kind==='milestone'?'人生节点':'生活片段');
  const tag=card?.[1].startsWith('future-')?'未来推演':'生活记录';
  const month=entry.month??(entry.age===0?0:undefined);
  const city=entry.city??run.months.find(item=>item.month===month)?.city;
  const time=entry.age+' 岁'+(Number.isInteger(month)?' · '+dateAt(month):'');
  openRecord(title,tag,trigger,(body,dialog)=>{
    body.append(el('p',time+(city===undefined?'':' · '+cityLabel(city)),'eyebrow'));
    if(card)body.append(el('p',card[3]));
    body.append(el('p',entry.text));
    const options=card?choiceOptions(card):[];
    const option=options[entry.option]??options.find(([label])=>entry.text.endsWith('你选择了'+label+'。'));
    if(option)body.append(el('p','选择影响 · '+option[1]));
    if(Number.isInteger(entry.index)){
      const bookmarks=Array.isArray(run.bookmarks)?run.bookmarks:(run.bookmarks=[]);
      let changed=false;
      const update=()=>{star.textContent=bookmarks.includes(entry.index)?'取消收藏':'收藏这一刻';};
      const star=button(undefined,()=>{
        const index=bookmarks.indexOf(entry.index);
        if(index>=0)bookmarks.splice(index,1);
        else bookmarks.push(entry.index);
        changed=true;save();update();
      },'muted');
      update();
      body.append(star);
      dialog.addEventListener('close',()=>{
        if(changed)trigger.closest('.card')?.dispatchEvent(new Event('journalchange'));
      },{once:true});
    }
  });
}

function openHistoryRecord(entry,trigger){
  openRecord(entry.title,'时代纪事 · '+entry.date,trigger,body=>{
    body.append(el('p',entry.summary));
    const source=el('a','查看资料来源');
    source.href=entry.url;source.target='_blank';source.rel='noopener noreferrer';
    body.append(source);
  });
}

function journalPanel(life){
  const panelNode=panel('生活记录');
  const controls=el('div',undefined,'row journal-controls');
  const search=el('input');
  search.type='search';search.placeholder='搜索经历';search.setAttribute('aria-label','搜索经历');
  search.value=journalQuery;
  const feed=el('div',undefined,'log life-log');
  feed.tabIndex=0;
  const moments=life.player.log.map((entry,index)=>({...entry,index})).reverse();
  const facts=lifeHistory(life);
  const all=[...moments,...facts].sort((a,b)=>(b.month??b.age*12)-(a.month??a.age*12));
  function update(){
    feed.replaceChildren();
    const query=journalQuery.trim().toLowerCase();
    for(const entry of all){
      const type=entry.url?'history':entry.cardId?.startsWith('future-')?'future':entry.kind??'daily';
      const starred=life.bookmarks?.includes(entry.index);
      if(journalFilter==='starred'?!starred:journalFilter!=='all'&&journalFilter!==type)continue;
      const title=entry.title??entry.text;
      if(query&&![title,String(entry.age),entry.date??''].join(' ').toLowerCase().includes(query))continue;
      const line=button(undefined,()=>entry.url?openHistoryRecord(entry,line):openEventRecord(entry,line),
        'log-entry record-button log-'+(entry.kind??type));
      line.setAttribute('aria-haspopup','dialog');
      const tag=type==='future'?'未来推演 · ':type==='history'?'史实 · ':'';
      line.append(el('span',entry.age+' 岁'),el('p',(starred?'★ ':'')+tag+title));
      feed.append(line);
    }
    if(!feed.children.length)feed.append(el('p','没有符合条件的记录。','cohort-caption'));
  }
  search.addEventListener('input',()=>{journalQuery=search.value;update();});
  panelNode.addEventListener('journalchange',()=>{update();feed.focus({preventScroll:true});});
  controls.append(field('分类',[['all','全部'],['starred','已收藏'],['decision','抉择'],['milestone','人生节点'],['daily','日常'],['history','史实'],['future','未来推演']],journalFilter,value=>{
    journalFilter=value;update();
  }),search);
  panelNode.append(controls,feed);
  update();
  return panelNode;
}
function disclosure(title){
  const details=el('details',undefined,'card life-details');
  details.open=openSections.has(title);
  const heading=el('summary',title);
  heading.onclick=()=>details.open?openSections.delete(title):openSections.add(title);
  details.append(heading);
  return details;
}
function field(label,options,value,change){
  const wrap=el('label',label+' ');
  const select=el('select');
  select.setAttribute('aria-label',label);
  for(const [value,text] of options){
    const option=el('option',text);option.value=value;select.append(option);
  }
  select.value=value;
  select.onchange=()=>change(select.value);
  wrap.append(select);
  return wrap;
}
function updatePopulationClocks(){
  const clocks=app.querySelectorAll('.population-clock');
  if(!clocks.length)return;
  const counts=populationSinceOpen(performance.now()/1000);
  for(const clock of clocks)clock.querySelectorAll('[data-count]').forEach((value,index)=>{
    value.textContent=counts[index].toLocaleString('zh-CN');
  });
}
function populationClock(){
  const clock=el('section',undefined,'population-clock');
  const numbers=el('div',undefined,'population-counts');
  for(const label of ['打开页面后估算出生','同一时间估算离世']){
    const pair=el('div'),value=el('strong','0');
    value.dataset.count='';
    pair.append(value,el('span',label));numbers.append(pair);
  }
  const source=el('a','国家统计局 · 2025 年统计公报');
  source.href=populationClockSource;
  clock.append(el('div','中国大陆 · 自打开页面起','eyebrow'),numbers,
    el('p','按年度平均速度累计估算，非实时登记。'),source);
  return clock;
}
function cohortPanel(life,birth=false){
  const cohort=life.peers;
  const section=panel('在同一秒出生的人们');
  section.classList.add('cohort-panel');
  const living=cohort.filter(peer=>!peer.ended).length;
  section.append(el('p',birth?'四位模拟同龄人将和你一起成长。':living+' / '+cohort.length+' 位同龄人仍在世 · 点击姓名查看人生档案。','cohort-caption'));
  for(const [index,peer] of cohort.entries()){
    const entry=button(undefined,()=>openPeerHistory(life,peer,entry,index),'cohort-entry');
    entry.setAttribute('aria-label','查看'+peer.name+'的人生档案');
    entry.setAttribute('aria-haspopup','dialog');
    const who=el('span',undefined,'cohort-person');
    who.append(el('strong',peer.name),el('small',cityLabel(peer.birthCity)+' · '+
      (birth?'家庭收入第 '+peer.quintile+' 组':peer.city!==peer.birthCity?'现居 '+cityLabel(peer.city):places[peer.birth])));
    const state=peer.ended?'已离世 · '+peer.age+' 岁':birth?places[peer.birth]:
      peer.age+' 岁 · '+(peer.job==='尚未工作'?(peer.education==='尚未入学'?lifeStage(peer.age):peer.education):peer.job);
    entry.append(who,el('span',state,'cohort-state'));section.append(entry);
  }
  return section;
}

function openPeerHistory(life,peer,trigger,index){
  const wasPlaying=playing;
  if(wasPlaying)stop();
  const date=month=>monthKey(life.birthYear,month,life.birthMonth);
  const dialog=el('dialog',undefined,'decision-modal cohort-dialog');
  dialog.setAttribute('aria-label',peer.name+'的人生档案');
  const header=el('div',undefined,'decision-header');
  header.append(el('span','同龄人档案 / PARALLEL LIFE','eyebrow'),
    button('关闭档案',()=>dialog.close(),'muted'));

  const body=el('div',undefined,'decision-body');
  const title=el('div',undefined,'cohort-profile-title');
  const identity=el('div');
  const status=peer.ended?'已离世 · '+peer.age+' 岁':peer.age+' 岁 · '+lifeStage(peer.age);
  identity.append(el('h2',peer.name),el('p',status+' · '+date(peer.month)));
  title.append(drawPortrait(peer),identity);

  const facts=el('dl',undefined,'cohort-facts');
  for(const [label,value] of [
    ['出生地',cityLabel(peer.birthCity)],
    [peer.ended?'最后居住地':'现居地',cityLabel(peer.city)],
    ['出生年月',date(0)],
    ['教育',peer.education],
    ['性别',peer.gender??'未记录'],
    ['工作',peer.occupation?peer.job+' · '+peer.occupation:peer.job],
  ]){
    const field=el('div');
    field.append(el('dt',label),el('dd',value));
    facts.append(field);
  }

  const timeline=el('ol',undefined,'cohort-timeline');
  for(const entry of peer.log){
    const row=el('li',undefined,'log-entry'+(entry.kind?' log-'+entry.kind:''));
    const when=el('span',entry.age+' 岁');
    if(Number.isInteger(entry.month))when.append(el('small',date(entry.month)));
    row.append(when,el('p',entry.text));
    timeline.append(row);
  }
  body.append(title,facts,cohortComparison(life,peer),el('h3','生活记录'),timeline);
  if(!peer.ended)body.append(el('p','档案会随你推进人生而更新。','cohort-footnote'));
  dialog.append(header,body);
  dialog.addEventListener('close',()=>{
    dialog.remove();
    if(wasPlaying){
      render();
      app.querySelectorAll('.cohort-entry')[index]?.focus();
    }else trigger.focus();
  },{once:true});
  app.append(dialog);
  dialog.showModal();
}

function cohortComparison(life,peer,labels=['同龄对照','你 · '+life.player.name,peer.name]){
  const player=life.player;
  const section=el('section',undefined,'cohort-comparison');
  section.append(el('h3',labels[0]));
  const stages=sharedStages(player,peer);
  if(!stages.length){
    section.append(el('p','这两位角色暂无同龄阶段记录。旧档会从续玩时开始积累。'));
    return section;
  }
  const first=stages.find(pair=>stageDifference(pair,player,peer).length);
  const summary=first
    ? '现有记录中，最早在 '+first.age+' 岁出现'+stageDifference(first,player,peer).join('、')+'差异。'
    : '现有的同龄记录尚无升学、职业、迁居或家庭分岔。';
  const table=el('table');
  const header=el('tr');
  for(const label of ['阶段',...labels.slice(1)]){
    const cell=el('th',label);cell.scope='col';header.append(cell);
  }
  const head=el('thead');head.append(header);
  const values=el('tbody');
  table.append(head,values);
  function show(age){
    const pair=stages.find(item=>item.age===Number(age));
    const family=stage=>[stage.partner?'有伴侣':'无伴侣',stage.children+' 位子女'].join(' · ');
    values.replaceChildren();
    for(const [label,left,right] of [
      ['居住地',cityLabel(pair.player.city),cityLabel(pair.peer.city)],
      ['教育',pair.player.education,pair.peer.education],
      ['职业',pair.player.work,pair.peer.work],
      ['家庭',family(pair.player),family(pair.peer)],
    ]){
      const row=el('tr'),name=el('th',label);
      name.scope='row';
      row.append(name,el('td',left),el('td',right));values.append(row);
    }
  }
  const age=String(first?.age??stages.at(-1).age);
  section.append(el('p',summary),field('选择年龄',stages.map(item=>[String(item.age),item.age+' 岁']),age,show),table);
  show(age);
  return section;
}
function mapPreview(){
  const stage=el('div',undefined,'map-stage');
  const preview=el('figure',undefined,'atlas atlas-preview');
  const caption=el('figcaption');
  caption.append(el('span','地形速览 / CHINA ATLAS'),el('strong','山河之间'));
  const image=el('img');
  image.src='./china-preview.webp';
  image.alt='中国地形图，浅色为西部高原和山脉，绿色为东部低地';
  image.width=560;image.height=356;image.decoding='async';
  const status=el('small');
  status.hidden=true;
  status.setAttribute('role','status');
  preview.append(caption,image,status);
  stage.append(preview);
  import('./china-map.js').then(async ({makeChinaMap})=>{
    if(!stage.isConnected)return;
    const map=await makeChinaMap();
    if(stage.isConnected)preview.replaceWith(map);
  }).catch(()=>{
    status.textContent='互动地图暂不可用，当前显示地形预览。';
    status.hidden=false;
  });
  return stage;
}
function homePage(){
  let year=2002,birthMonth=1,mode='quick',gender='';
  const hero=el('section',undefined,'hero pixel-home');
  const intro=el('div',undefined,'hero-intro');
  const title=el('h1','人生');
  title.setAttribute('aria-label','人生一页');
  title.append(el('span','一页'));
  intro.append(el('div','中国人生模拟 / 1.5','eyebrow home-issue'),title,
    el('p','选一个年月，让出生地交给运气。从陌生的街巷出发，在每一次选择里，走出自己的一生。','home-deck'));
  const setup=el('div',undefined,'home-setup');
  setup.append(
    field('出生年份',Array.from({length:lastYear-firstYear+1},(_,i)=>[String(firstYear+i),(firstYear+i)+' 年']),String(year),v=>{year=Number(v);paintYear();paintStreet()}),
    field('出生月份',Array.from({length:12},(_,i)=>[String(i+1),(i+1)+' 月']),String(birthMonth),v=>{birthMonth=Number(v);paintStreet()}),
    field('推进节奏',[['quick','快览'],['standard','标准']],mode,v=>{mode=v}));
  const actions=el('div',undefined,'row home-actions');
  const identity=el('div',undefined,'home-setup birth-identity');
  const nameLabel=el('label','自定义姓名');
  const name=el('input');
  name.type='text';name.maxLength=40;name.placeholder='留空随机生成';name.autocomplete='off';
  nameLabel.append(name);
  identity.append(field('性别',[['','随机'],['女','女'],['男','男']],gender,value=>{gender=value}),nameLabel);
  actions.append(button('随机出生',()=>startNewLife(mode,year,birthMonth,undefined,{gender,name:name.value}),'birth-action'));
  const saved=read().life;
  if(saved)actions.append(button('继续上次人生',()=>{
    const latest=read();
    if(!latest.life){notice='该位置的进度已变化，请重新选择存档。';render();return;}
    run=latest.life;expectedSave=latest.raw;selectedYear=null;dismissedDecision=null;screen=run.registration?'birth':'life';stop();
    if(run.player.ended)save();
    render();
  },'muted'));
  actions.append(button('管理存档',()=>app.querySelector('.storage-desk').scrollIntoView({block:'start'}),'muted'));
  intro.append(setup,identity,actions,el('p','当前存档位 '+activeSlot,'cohort-caption'),populationClock());
  if(notice)intro.append(el('p',notice,'notice'));

  const right=el('div',undefined,'home-right');
  const street=el('figure',undefined,'home-street');
  const streetHeader=el('div',undefined,'street-header');
  const streetDate=el('span');
  streetHeader.append(el('span','01 / 像素街景'),streetDate);
  const streetImage=el('div',undefined,'street-image');
  street.append(streetHeader,streetImage,el('figcaption','街灯刚亮，一户人家沿着街边走回家。'));
  const stats=panel();
  stats.classList.add('home-statistics');
  right.append(street,stats);
  hero.append(intro,right);

  function paintStreet(){
    streetDate.textContent=year+' · '+String(birthMonth).padStart(2,'0')+' / '+seasonFor(birthMonth)[1];
    streetImage.replaceChildren(drawTitleScene(birthMonth,year));
  }
  function paintYear(){
  stats.replaceChildren(el('div','年度人口构成 / '+year,'eyebrow'),el('h2','这一年，从哪里开始？'));
  const urban=urbanShare(year)*100;
  for(const [label,weight] of [['城镇',urban],['乡村',100-urban]]){
    const line=el('div',undefined,'birth-weight');const meter=el('progress');
    meter.max=100;meter.value=weight;meter.setAttribute('aria-label',label);
    line.append(el('span',label),meter,el('strong',weight.toFixed(2)+'%'));stats.append(line);
  }
  const source=el('a','世界银行 WDI · 联合国人口司');
  source.href='https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS?locations=CN';
  stats.append(el('p','出生环境按当年城乡居民占比抽样，同年各月共用一份数据。'),source);
  }
  paintStreet();paintYear();
  const extras=el('section',undefined,'home-extras');
  const atlas=el('div',undefined,'home-atlas');
  atlas.append(el('div','02 / 地理档案','eyebrow'),el('h2','山河之间'),mapPreview());
  const records=el('div',undefined,'home-records');
  records.append(el('div','03 / 档案室','eyebrow'),el('h2','留在这里的人生'));
  if(saved)records.append(cohortPanel(saved,saved.registration));
  const info=panel('关于这段模拟');
  const source=el('a','国家统计局 · 第七次全国人口普查');
  source.href=censusSource;
  info.append(el('p','出生覆盖中国大陆 31 个省级地区。省级权重按 2020 年常住人口计算，省内主要城市样本等概率抽取。角色家庭和抉择为模拟设定，真实事件单独标注。'),source);
  records.append(storageDesk(),archiveShelf(),info);
  extras.append(atlas,records);
  app.append(hero,extras);
}
function render(){
app.replaceChildren();queueMicrotask(updatePopulationClocks);
if(screen==='home'){homePage();return}
const p=run.player;
if(screen==='archive'){app.append(endingPanel(run,true));return}
if(screen==='birth'){
  const birthCity=cities[p.birthCity];
  const c=panel('出生登记');c.classList.add('birth-register');
  const location=el('div',undefined,'birth-location');
  const weight=run.birthGeography==='census2020'
    ? '省级抽取权重 '+(provinceWeight(birthCity.province)*100).toFixed(2)+'% · 省内主要城市样本等概率'
    : '沿用这段人生存档中的出生地';
  location.append(el('div','出生地 / '+dateAt(0),'eyebrow'),el('strong',cityLabel(p.birthCity)),el('small',weight));
  if(localConditions(p).pilot){
    const opportunity=run.birthYear<2000?'本地带教岗位':'平台运营入门机会';
    location.append(el('small','城市试点 · 成年后若仍居住在试点城市，可能遇到'+opportunity+'。工资与开支按游戏参数模拟。'));
  }
  const art=el('figure',undefined,'register-art');
  art.append(drawScene(p,run.birthMonth),el('figcaption',cityLabel(p.birthCity)+' / '+seasonFor(run.birthMonth)[1]));
  const actions=el('div',undefined,'row register-actions');
  actions.append(button('开始这段人生',()=>{run.registration=false;screen='life';save();render()}),button('返回主界面',returnHome,'muted'));
  c.append(location,el('h1',p.name),el('p',`${p.gender??'性别未记录'} · ${places[p.birth]} · ${dateAt(0)} · 家庭收入第 ${p.quintile} 组`),art,actions,familyPanel(run,true),cohortPanel(run,true),populationClock());
  app.append(c);return
}
const top=el('nav',undefined,'life-toolbar');
top.setAttribute('aria-label','人生导航');
const position=el('div',undefined,'life-position');
position.append(el('span',(p.ended?'已归档':'人生进行中')+' · 存档 '+activeSlot,'eyebrow'),el('strong',dateAt(p.month),'toolbar-age'));
const topActions=el('div',undefined,'row');
topActions.append(button('备份进度',()=>downloadBackup(run),'muted'),button('返回主界面',returnHome,'muted return-home'));
top.append(position,topActions);
app.append(top);

const layout=el('div',undefined,'grid life-grid');
const left=el('div',undefined,'life-main');
const right=el('aside',undefined,'life-side');
const identity=el('aside',undefined,'life-identity');
const chapter=panel();
chapter.classList.add('chapter');
const chapterText=el('div',undefined,'chapter-text');
const household=familyAt(p).filter(member=>member.atHome);
chapterText.append(el('h1',p.age+' 岁 '+p.month%12+' 个月'),el('p',cityLabel(p.city)+' · '+lifeStage(p.age)+' · '+(household.length?'与'+household.map(member=>member.role).join('、')+'同住':'独立生活')));
const illustration=el('figure',undefined,'chapter-art');
const calendarMonth=Number(dateAt(p.month).slice(-2));
illustration.append(drawScene(p,calendarMonth),el('figcaption',seasonFor(calendarMonth)[1]+' / '+dateAt(p.month)));
chapter.append(illustration,chapterText);
left.append(chapter);
if(!p.ended){
  const controls=el('div',undefined,'play-controls');
  const stepping=el('div',undefined,'row play-primary');
  const progressState=run.pending.length?'等待选择':playing?(run.auto?'托管推进中':'正在推进'):'已暂停';
  const playButton=button(playing?'暂停':'开始',()=>playing?(stop(),render()):start());
  const nextButton=button(run.pace==='year'?'过一年':'过一个月',()=>{stop();tick()},'muted');
  const jumpButton=button('跳到下一抉择',()=>{
    stop();
    run=advanceToDecision(run);selectedYear=null;
    if(run.auto)auto();
    save();render();
  },'muted');
  playButton.disabled=nextButton.disabled=jumpButton.disabled=run.pending.length>0;
  const autoButton=button(run.auto?'退出托管':'一键托管',()=>{
    if(run.auto){run.auto=false;stop();save();render();}
    else startAuto();
  },'auto-toggle');
  autoButton.setAttribute('aria-pressed',String(run.auto));
  stepping.append(playButton,autoButton,nextButton,jumpButton,field('步长',[['month','按月递进'],['year','按年递进']],run.pace,v=>{
    run.pace=v;save();if(playing)start();else render();
  }),el('span',progressState,'play-state'));
  const settings=disclosure('更多推进设置');
  const settingsRow=el('div',undefined,'row');
  const birthday=button('快进到下个生日',()=>{
    stop();run=advanceToBirthday(run);selectedYear=null;
    if(run.auto)auto();
    save();render();
  },'muted');
  birthday.disabled=run.pending.length>0;
  settingsRow.append(
    field('速度',[['1','1×'],['2','2×'],['4','4×'],['8','8×'],['12','12×'],['16','16×']],String(run.speed),v=>{
      run.speed=Number(v);save();if(playing)start();
    }),birthday);
  settings.append(settingsRow);
  controls.append(stepping,settings);
  left.append(controls,focusPanel());
}
const decision=run.pending[0];
if(decision&&!p.ended)left.append(decisionCard(decision));
if(p.ended)left.append(endingPanel(run));
left.append(journalPanel(run),provincePanel());
const profile=panel('身份记录');
profile.classList.add('profile-card');
const idBody=el('div',undefined,'id-body');
const idName=el('div',undefined,'id-name');
idName.append(drawPortrait(p),el('strong',p.name));
idBody.append(idName);
const details=el('dl',undefined,'profile-lines');
for(const [label,value] of [
  ['出生地',cityLabel(p.birthCity)],
  ['性别',p.gender??'未记录'],
  ['现居地',cityLabel(p.city)],
  ['家庭收入','第 '+p.quintile+' 组'],
  ['教育',p.education],
  ['工作',p.job],
  ...(p.occupation?[['职业',p.occupation]]:[]),
  ...(p.careerTrack?[['职业路线',p.careerTrack]]:[]),
]){
  const line=el('div');
  line.append(el('dt',label),el('dd',value));
  details.append(line);
}
idBody.append(details);
profile.append(idBody);
const state=panel('状态');
state.classList.add('life-state');
const stats=el('div',undefined,'stats');
for(const [key,label] of [['health','健康'],['mood','心情'],['skill','技能'],['ties','关系']]){
  const stat=el('div',undefined,'stat stat-'+key);
  const meter=el('progress');
  meter.max=100;meter.value=p.stats[key];meter.setAttribute('aria-label',label);
  stat.append(el('span',label),meter,el('strong',String(p.stats[key])));
  stats.append(stat);
}
const money=el('div',undefined,'life-money');
for(const [label,value] of [['现金余额',yuan.format(p.cash)],['年收入',p.age<18?'—':yuan.format(annualIncome(p,run.focus))],['年开支',p.age<18?'—':yuan.format(annualExpenses(p))]]){
  const cell=el('div'),amount=el('strong',value);
  if(label==='年收入')amount.dataset.currentIncome='';
  cell.append(el('span',label),amount);money.append(cell);
}
state.append(stats,money);
if(localConditions(p).pilot){
  state.append(el('p','城市试点 · 工资与开支使用当地游戏参数。','cohort-caption'));
}
const journey=panel('一路积累的经历');
journey.append(el('p','探索兴趣 '+p.interests.curiosity+' · 交往经历 '+p.interests.sociability),
  el('p','家人亲密度 '+p.relationships.family+' · 友情 '+p.relationships.friend),
  el('small','早年的选择会影响后续遇到的机会。'));
identity.append(profile,state);
identity.append(journey);
if(p.age>=18){
  const budget=panel('月度账单');
  budget.classList.add('budget-panel');
  budget.append(el('p','借款余额 '+yuan.format(p.debt)));
  if(p.education==='继续学习'){
    const {support,tuition}=studyBudget(p);
    budget.append(el('p','在读期间预计每月支持 '+yuan.format(support)+' · 学费 '+yuan.format(tuition)));
  }
  if(p.lastBill){
    const bill=p.lastBill;
    budget.append(el('div',monthKey(run.birthYear,bill.month,run.birthMonth)+' / 最近一次结算','eyebrow'));
    const lines=el('dl',undefined,'province-stats');
    for(const [label,value] of [['收入',bill.income],['生活开支',bill.expenses],['借款利息',bill.interest],['新增借款',bill.borrowed],['偿还借款',bill.repaid]]){
      const row=el('div');row.append(el('dt',label),el('dd',yuan.format(value)));lines.append(row);
    }
    budget.append(lines);
  }
  budget.append(el('small','模拟规则 · 借款月息 0.3%，月度收支结余的 20% 自动还款。'));
  left.append(budget);
}
const family=familyPanel(run);
const peers=cohortPanel(run);
const ages=panel('人生地图');
ages.classList.add('life-years');
const ageTip=inspector(ages);
ages.append(el('p','每格一年 · 悬停或点按查看经历'),drawAgeGrid(p,(age,cell)=>{
  const events=p.log.filter(entry=>entry.age===age);
  const lines=age>p.age?['尚未经历']:events.slice(0,4).map(entry=>entry.text);
  if(!lines.length)lines.push('这一岁暂无生活记录');
  if(events.length>4)lines.push('另有 '+(events.length-4)+' 条，可在生活记录查看');
  ageTip(age+' 岁',lines,cell.getBoundingClientRect());
}));
const survival=panel('存活曲线');
survival.classList.add('survival-card');
const survivalTip=inspector(survival);
survival.append(drawSurvival(p,(age,current,baseline,bounds)=>survivalTip(age+' 岁',[
  '当前健康 '+p.stats.health+' 分 · 存活率 '+(current*100).toFixed(1)+'%',
  '基准健康 65 分 · 存活率 '+(baseline*100).toFixed(1)+'%',
],bounds)),el('p','实线为当前健康，虚线为基准。点按曲线可查看模型估算。'));
right.append(family,peers,survival,ages);
if(notice)right.append(el('p',notice,'notice'));
layout.append(left,identity,right);
app.append(layout);
if(decision&&!p.ended&&dismissedDecision!==decision)left.querySelector('dialog').showModal();
}
document.addEventListener('pointerdown',event=>{
  for(const tip of app.querySelectorAll('.inspect-tip:not([hidden])')){
    if(!tip.parentElement.contains(event.target))tip.hidden=true;
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stop();render()}});render();
setInterval(updatePopulationClocks,1000);

function decisionCard(item){
  const card=cards.find(candidate=>candidate[1]===item.id);
  const teaser=panel();
  teaser.classList.add('life-decision');
  const modal=el('dialog',undefined,'decision-modal');
  modal.setAttribute('aria-labelledby','decision-title');
  const open=button('查看抉择',()=>modal.showModal(),'muted');
  teaser.append(el('div','等待抉择','eyebrow'),el('h2',card[2]),open,modal);
  const close=()=>{
    dismissedDecision=item;
    modal.close();
    open.focus();
  };
  const top=el('div',undefined,'decision-header');
  const future=card[1].startsWith('future-');
  top.append(el('span',(future?'未来推演':'人生抉择')+' · '+dateAt(run.player.month),'eyebrow'),button('先收起',close,'muted'));
  modal.addEventListener('cancel',event=>{event.preventDefault();close()});
  const body=el('div',undefined,'decision-body');
  const title=el('h2',card[2]);
  title.id='decision-title';
  body.append(title,el('p',card[3]));
  if(future)body.append(el('p','这段情境来自游戏对未来生活的设想。','cohort-caption'));
  choiceOptions(card).forEach(([label,detail],index)=>{
    const option=button(undefined,()=>{
      if(run.pending[0]!==item)return;
      resolve(run.player,card,index);
      run.pending.shift();
      dismissedDecision=null;
      save();render();
    },'choice decision-option');
    const description=el('span');
    description.append(el('strong',label),el('small',detail));
    option.append(el('span',String(index+1),'decision-number'),description);
    body.append(option);
  });
  body.append(button('交给托管并继续',startAuto,'muted'));
  modal.append(top,body);
  return teaser;
}

function focusPanel(){
  const section=panel('接下来的生活重心');
  section.classList.add('focus-panel');
  const choices=el('div',undefined,'focus-options');
  const hints={learn:'积累技能',work:'技能与成年收入',health:'改善健康',ties:'经营关系'};
  for(const [key,label] of Object.entries(focusLabels)){
    const choice=button(label,()=>{
      run.focus=key;save();
      for(const item of choices.querySelectorAll('button')){
        item.setAttribute('aria-pressed',String(item===choice));
      }
      const income=document.querySelector('[data-current-income]');
      if(income&&run.player.age>=18)income.textContent=yuan.format(annualIncome(run.player,run.focus));
    },'muted');
    choice.setAttribute('aria-pressed',String(run.focus===key));
    choice.append(el('small',hints[key]));
    choices.append(choice);
  }
  section.append(el('p','可以随时调整，主要收益会在下个生日结算。'),choices);
  return section;
}

function archiveShelf(){
  const section=panel('我的人生档案');
  section.classList.add('archive-shelf');
  section.append(el('p','最近完成的 8 段人生会保存在当前浏览器。'));
  let entries=[];
  try{entries=completedLives(localStorage)}catch{}
  if(!entries.length)section.append(el('p','走完第一段人生后，可以回来回顾。','cohort-caption'));
  for(const entry of entries){
    const summary=memoir(entry);
    const row=el('div',undefined,'archive-entry');
    const text=el('div');
    text.append(el('strong',entry.player.name),el('small',summary.from+' · '+summary.start+' 至 '+summary.end));
    row.append(text,button('回顾这段人生',()=>{
      run=entry;screen='archive';render();
    },'muted'));
    section.append(row);
  }
  return section;
}

function exportLife(entry){
  const {player}=entry;
  const date=month=>monthKey(entry.birthYear,month,entry.birthMonth);
  const summary=memoir(entry);
  const text=[
    player.name+' 的人生',summary.start+' 至 '+summary.end+' · '+summary.from+' → '+summary.to,
    ...player.log.map(item=>(item.month===undefined?item.age+' 岁':date(item.month))+' · '+item.text),
    ...lifeHistory(entry).map(fact=>fact.date+' · 史实：'+fact.title+' '+fact.url),
    ...entry.notes.filter(note=>note.text).map(note=>note.age+' 岁的笔记：'+note.text),
  ].join('\n');
  downloadFile(text,'人生一页-'+player.name+'.txt','text/plain;charset=utf-8');
}

function downloadLifeCard(entry,summary){
  const canvas=el('canvas');
  canvas.width=960;canvas.height=680;
  const ctx=canvas.getContext('2d');
  const art=drawScene(entry.player,Number(summary.end.slice(-2)));
  ctx.fillStyle='#f3f6fa';ctx.fillRect(0,0,960,680);
  ctx.fillStyle='#213048';
  ctx.font='600 28px sans-serif';ctx.fillText('人生一页',44,61);
  ctx.font='700 54px sans-serif';ctx.fillText(entry.player.name+' 的一生',44,130,872);
  ctx.font='24px sans-serif';ctx.fillText(summary.start+' 至 '+summary.end+'  ·  '+entry.player.age+' 岁',44,179,872);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(art,44,220,872,362);
  ctx.font='24px sans-serif';ctx.fillText(summary.from+' → '+summary.to,44,635,872);
  canvas.toBlob(blob=>{if(blob)downloadFile(blob,'人生一页-'+entry.player.name+'.png','image/png');});
}

function endingPanel(entry,archived=false){
  const summary=memoir(entry);
  const section=panel();
  section.classList.add('ending-panel');
  const title=el('h2',entry.player.name+'的一生');
  section.append(el('div','人生回顾 / LIFE IN PAGES','eyebrow'),title,
    el('p',summary.start+' 至 '+summary.end+' · '+summary.from+' → '+summary.to));
  if(archived){
    const art=el('figure',undefined,'register-art');
    art.append(drawScene(entry.player,Number(summary.end.slice(-2))));
    section.append(art);
    if(entry.player.family?.length)section.append(familyPanel(entry));
  }
  const metrics=el('dl',undefined,'ending-metrics');
  for(const [label,value] of [['走过的年龄',entry.player.age+' 岁'],['做出的抉择',summary.decisions+' 次'],['生活过的城市',summary.places+' 座']]){
    const cell=el('div');cell.append(el('dt',label),el('dd',value));metrics.append(cell);
  }
  section.append(metrics);
  for(const {label,entries} of lifeChapters(entry.player.log)){
    const chapter=el('details',undefined,'ending-chapter');
    chapter.append(el('summary',label));
    const list=el('ol');
    for(const item of entries)list.append(el('li',item.age+' 岁 · '+item.text));
    chapter.append(list);
    section.append(chapter);
  }
  let earlier=[];
  try{earlier=completedLives(localStorage).filter(other=>other.archiveId!==entry.archiveId&&sameOrigin(entry,other));}catch{}
  if(earlier.length){
    const slot=el('div',undefined,'replay-comparison');
    const show=index=>{
      const previous=earlier[Number(index)];
      slot.replaceChildren(cohortComparison(entry,previous.player,['同一起点对照','这一次','上一次']));
    };
    section.append(field('对照档案',earlier.map((other,i)=>[String(i),'第 '+(i+1)+' 段 · '+other.player.age+' 岁']), '0',show),slot);
    show(0);
  }
  const actions=el('div',undefined,'row');
  const replaySeed=entry.birthGeography==='census2020'?entry.seed:undefined;
  actions.append(button(replaySeed===undefined?'开始另一段人生':'重走同一起点',()=>startNewLife(entry.mode,entry.birthYear,entry.birthMonth,replaySeed,{name:entry.player.name,gender:entry.player.gender})),
    button('导出人生档案',()=>exportLife(entry),'muted'),
    button('下载结局卡',()=>downloadLifeCard(entry,summary),'muted'));
  if(archived)actions.append(button('返回主界面',returnHome,'muted'));
  section.append(actions);
  return section;
}

function provincePanel(){
  const byYear=new Map();
  for(const record of run.months){
    byYear.set(dateAt(record.month).slice(0,4),record.city);
  }
  const current=dateAt(run.player.month).slice(0,4);
  byYear.set(current,run.player.city);
  const year=byYear.has(selectedYear)?selectedYear:current;
  const city=byYear.get(year);
  const beforeChongqingMunicipality=cities[city].province==='重庆'&&Number(year)<1997;
  const province=beforeChongqingMunicipality?'四川':cities[city].province;
  const info=provinceData[year]?.[province];
  const card=panel(province+' · '+year+' 年');
  card.classList.add('chronicle','province-card');
  const menu=field('查看年份',[...byYear.keys()].reverse().map(value=>[value,value+' 年']),year,value=>{
    stop();selectedYear=value;render();
    document.querySelector('.province-card select')?.focus();
  });
  const location=beforeChongqingMunicipality?'四川 · 重庆（当年区划）':cityLabel(city);
  card.append(menu,el('p','该年最后记录地 · '+location,'province-location'));
  if(!info){
    card.append(el('p','此省份的该年统计暂未收录。当前省级年鉴资料覆盖 1990–2024 年。'));
    return card;
  }
  const [population,urban,gdp,perCapita,birthRate,deathRate]=info;
  const number=(value,unit)=>Number.isFinite(value)?value.toLocaleString('zh-CN')+unit:'—';
  const stats=el('dl',undefined,'province-stats');
  for(const [label,value] of [
    ['年末人口',number(population,' 万人')],
    ['城镇人口占比',number(urban,'%')],
    ['地区生产总值',number(gdp,' 亿元')],
    ['人均地区生产总值',number(perCapita,' 元')],
    ['人口出生率',number(birthRate,'‰')],
    ['人口死亡率',number(deathRate,'‰')],
  ]){
    const row=el('div');row.append(el('dt',label),el('dd',value));stats.append(row);
  }
  card.append(stats);
  const sources=el('p','统计来源','province-sources');
  for(const [label,url] of provinceSources[year]??[]){
    const link=el('a',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';
    sources.append(' · ',link);
  }
  const populationBasis=Number(year)<2005?'早期人口沿用年鉴原口径。':'人口采用年鉴常住人口口径。';
  card.append(sources,el('p',populationBasis+' 金额为当年价格。— 表示该项未收录。','province-location'));
  return card;
}

const KEY='life-page.save.v1';
import {cards,places,focusLabels} from './content.js';
import {create,resolve,advancePeriod,advanceToDecision,prepareCalendar,annualIncome,annualExpenses,choiceOptions,randomChoice} from './engine.js';
import {drawScene,drawTitleScene,seasonFor,drawAgeGrid,drawPortrait,familyAt,lifeStage} from './scene.js?v=1.1';
import {archiveLife,completedLives,memoir} from './life-archive.js';
import {drawSurvival} from './survival-view.js';
import {populationSinceOpen,populationClockSource} from './population-clock.js';
import {monthKey,getMonthHistory} from './history.js';
import {censusSource,cities,cityLabel,provinceWeight} from './geography.js';
import {provinceData,provinceSources} from './province-annual.js';
import {firstYear,lastYear,urbanShare} from './population.js';
const dateAt=offset=>monthKey(run.birthYear,offset,run.birthMonth);
let selectedYear=null,dismissedDecision=null;
const openSections=new Set();
const yuan=new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:0});
let run=null,playing=false,timer=null,notice='',screen='home';
const app=document.querySelector('#app');
function save(){
  if(!run||screen==='archive')return;
  if(run.player.ended)run.archiveId??=crypto.randomUUID();
  try{localStorage.setItem(KEY,JSON.stringify(run))}catch{notice='浏览器无法保存这段人生。';return}
  if(run.player.ended)try{
    archiveLife(localStorage,run);
  }catch{notice='这段人生已存档，但无法加入历史档案。'}
}
function hasSavedData(){try{return localStorage.getItem(KEY)!==null}catch{return false}}
function read(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return null;
    const value=JSON.parse(raw);
    const validPerson=p=>p&&Number.isInteger(p.age)&&p.age>=0&&p.age<=110
      && Number.isInteger(p.place)&&p.place>=0&&p.place<places.length
      && p.stats&&['health','mood','skill','ties'].every(key=>Number.isFinite(p.stats[key]))
      && Array.isArray(p.log)&&Array.isArray(p.seen)&&Array.isArray(p.scheduled);
    if(![1,2].includes(value?.version)||!validPerson(value.player)||value.peers?.length!==4||!value.peers.every(validPerson)
      ||!Array.isArray(value.notes)||!Array.isArray(value.pending)||!value.pending.every(item=>item?.kind==='reflection'
      ||item?.kind==='decision'&&cards.some(card=>card[1]===item.id)))throw Error('存档格式无效');
    if(value.version===2&&(!Number.isInteger(value.birthYear)||!Array.isArray(value.months)||!Number.isInteger(value.player.month)))throw Error('月历存档无效');
    return prepareCalendar(value);
  }catch{notice='旧存档暂时无法读取。你仍可开始新人生。';return null}
}
function startNewLife(mode,year,month,seed){
  const previous=read();
  if((previous&&!previous.player.ended||!previous&&hasSavedData())&&!confirm('开始新人生会替换当前进度，确定继续吗？'))return;
  if(previous?.player.ended){run=previous;screen='life';save()}
  run=create(mode,seed,year,month);
  run.registration=true;selectedYear=null;dismissedDecision=null;
  screen='birth';save();render();
}
function returnHome(){stop();save();screen='home';render()}
function stop(){playing=false;clearInterval(timer);timer=null}
function tick(pace=run?.pace){if(!run||run.player.ended||run.pending.length){stop();render();return}run=advancePeriod(run,pace);selectedYear=null;if(run.auto)auto();if(run.pending.length||run.player.ended)stop();save();render()}
function auto(){while(run.pending.length){let x=run.pending.shift();if(x.kind==='decision'){let c=cards.find(a=>a[1]===x.id);resolve(run.player,c,randomChoice(run.player,c))}}}
function start(){
  if(run.pending.length||run.player.ended)return;
  stop();playing=true;
  const annualDelay=run.mode==='quick'?2250:7500;
  const stepDelay=run.pace==='month'?Math.max(600,annualDelay/12):annualDelay;
  timer=setInterval(()=>tick(),Math.max(180,stepDelay/run.speed));render();
}
function el(tag,text,cls){let x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x}
function button(label,fn,cls){let b=el('button',label,cls);b.type='button';b.onclick=fn;return b}
function panel(title){let x=el('section',undefined,'card');if(title)x.append(el('h2',title));return x}
function disclosure(title){
  const details=el('details',undefined,'card life-details');
  details.open=openSections.has(title);
  const heading=el('summary',title);
  heading.onclick=()=>details.open?openSections.delete(title):openSections.add(title);
  details.append(heading);
  return details;
}
function field(label,options,value,change){let wrap=el('label',label+' ');let s=el('select');for(let [v,t] of options){let o=el('option',t);o.value=v;s.append(o)}s.value=value;s.onchange=()=>change(s.value);wrap.append(s);return wrap}
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
function cohortPanel(cohort,birth=false){
  const section=panel('在同一秒出生的人们');
  section.classList.add('cohort-panel');
  const living=cohort.filter(peer=>!peer.ended).length;
  section.append(el('p',birth?'四位模拟同龄人将和你一起成长。':living+' / '+cohort.length+' 位同龄人仍在世 · 随你推进，各自生活。','cohort-caption'));
  for(const peer of cohort){
    const entry=el('div',undefined,'cohort-entry');
    const who=el('div');
    who.append(el('strong',peer.name),el('small',cityLabel(peer.birthCity)+' · '+
      (birth?'家庭收入第 '+peer.quintile+' 组':peer.city!==peer.birthCity?'现居 '+cityLabel(peer.city):places[peer.birth])));
    const state=peer.ended?'已离世 · '+peer.age+' 岁':birth?places[peer.birth]:
      peer.age+' 岁 · '+(peer.job==='尚未工作'?(peer.education==='尚未入学'?lifeStage(peer.age):peer.education):peer.job);
    entry.append(who,el('span',state,'cohort-state'));section.append(entry);
  }
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
  let year=2002,birthMonth=1,mode='quick';
  const hero=el('section',undefined,'hero pixel-home');
  const intro=el('div',undefined,'hero-intro');
  const title=el('h1','人生');
  title.setAttribute('aria-label','人生一页');
  title.append(el('span','一页'));
  intro.append(el('div','中国人生模拟 / 公开试玩 1.1','eyebrow home-issue'),title,
    el('p','选一个年月，让出生地交给运气。从陌生的街巷出发，在每一次选择里，走出自己的一生。','home-deck'));
  const setup=el('div',undefined,'home-setup');
  setup.append(
    field('出生年份',Array.from({length:lastYear-firstYear+1},(_,i)=>[String(firstYear+i),(firstYear+i)+' 年']),String(year),v=>{year=Number(v);paintYear();paintStreet()}),
    field('出生月份',Array.from({length:12},(_,i)=>[String(i+1),(i+1)+' 月']),String(birthMonth),v=>{birthMonth=Number(v);paintStreet()}),
    field('推进节奏',[['quick','快览'],['standard','标准']],mode,v=>{mode=v}));
  const actions=el('div',undefined,'row home-actions');
  actions.append(button('随机出生',()=>startNewLife(mode,year,birthMonth),'birth-action'));
  const saved=read();
  if(saved)actions.append(button('继续上次人生',()=>{
    run=saved;selectedYear=null;dismissedDecision=null;screen=run.registration?'birth':'life';stop();
    if(run.player.ended)save();
    render();
  },'muted'));
  intro.append(setup,actions,populationClock());
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
  if(saved)records.append(cohortPanel(saved.peers,saved.registration));
  const info=panel('关于这段模拟');
  const source=el('a','国家统计局 · 第七次全国人口普查');
  source.href=censusSource;
  info.append(el('p','出生覆盖中国大陆 31 个省级地区。省级权重按 2020 年常住人口计算，省内主要城市样本等概率抽取。角色家庭和抉择为模拟设定，真实事件单独标注。'),source);
  records.append(archiveShelf(),info);
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
  const art=el('figure',undefined,'register-art');
  art.append(drawScene(p,run.birthMonth),el('figcaption',cityLabel(p.birthCity)+' / '+seasonFor(run.birthMonth)[1]));
  const actions=el('div',undefined,'row register-actions');
  actions.append(button('开始这段人生',()=>{run.registration=false;screen='life';save();render()}),button('返回主界面',returnHome,'muted'));
  c.append(location,el('h1',p.name),el('p',`${places[p.birth]} · ${dateAt(0)} · 家庭收入第 ${p.quintile} 组`),art,actions,cohortPanel(run.peers,true),populationClock());
  app.append(c);return
}
const top=el('nav',undefined,'life-toolbar');
top.setAttribute('aria-label','人生导航');
const position=el('div',undefined,'life-position');
position.append(el('span',p.ended?'已归档 / LIFE JOURNAL':'人生进行中 / LIFE JOURNAL','eyebrow'),el('strong',dateAt(p.month),'toolbar-age'));
top.append(position,button('返回主界面',returnHome,'muted return-home'));
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
  const progressState=run.pending.length?'等待选择':playing?'正在推进':'已暂停';
  const playButton=button(playing?'暂停':'开始',()=>playing?(stop(),render()):start());
  const nextButton=button(run.pace==='year'?'过一年':'过一个月',()=>{stop();tick()},'muted');
  const jumpButton=button('跳到下一抉择',()=>{
    stop();
    run=advanceToDecision(run);selectedYear=null;
    if(run.auto)auto();
    save();render();
  },'muted');
  playButton.disabled=nextButton.disabled=jumpButton.disabled=run.pending.length>0;
  stepping.append(playButton,nextButton,jumpButton,field('步长',[['month','按月递进'],['year','按年递进']],run.pace,v=>{
    run.pace=v;save();if(playing)start();else render();
  }),el('span',progressState,'play-state'));
  const settings=disclosure('更多推进设置');
  const settingsRow=el('div',undefined,'row');
  settingsRow.append(
    field('速度',[['1','1×'],['2','2×'],['4','4×'],['8','8×'],['12','12×'],['16','16×']],String(run.speed),v=>{
      run.speed=Number(v);save();if(playing)start();
    }),
    button(run.auto?'托管：开':'托管：关',()=>{run.auto=!run.auto;if(run.auto)auto();save();render()},'muted'));
  settings.append(settingsRow);
  controls.append(stepping,settings);
  left.append(controls,focusPanel());
}
const decision=run.pending[0];
if(decision&&!p.ended)left.append(decisionCard(decision));
if(p.ended)left.append(endingPanel(run));
const history=panel('生活记录');
const log=el('div',undefined,'log life-log');
log.tabIndex=0;
p.log.slice().reverse().forEach(entry=>{
  const line=el('div',undefined,'log-entry'+(entry.kind?' log-'+entry.kind:''));
  line.append(el('span',entry.age+' 岁'),el('p',entry.text));
  log.append(line);
});
history.append(log);left.append(history,provincePanel());
const profile=panel('身份记录');
profile.classList.add('profile-card');
const idBody=el('div',undefined,'id-body');
const idName=el('div',undefined,'id-name');
idName.append(drawPortrait(p),el('strong',p.name));
idBody.append(idName);
const details=el('dl',undefined,'profile-lines');
for(const [label,value] of [
  ['出生地',cityLabel(p.birthCity)],
  ['现居地',cityLabel(p.city)],
  ['家庭收入','第 '+p.quintile+' 组'],
  ['教育',p.education],
  ['工作',p.job],
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
identity.append(profile,state);
const family=panel('家人与生活');
family.classList.add('family-panel');
for(const member of familyAt(p)){
  const entry=el('div',undefined,'family-entry');
  const detail=member.currentAge>110?'家庭档案':member.currentAge+' 岁 · '+(member.atHome?'同住':'家人');
  entry.append(el('strong',member.role),el('span',detail));
  family.append(entry);
}
const peers=cohortPanel(run.peers);
const ages=panel('人生地图');
ages.classList.add('life-years');
ages.append(el('p','一格 = 一年 · 实色为已经历'),drawAgeGrid(p));
const survival=panel('存活曲线');
survival.classList.add('survival-card');
survival.append(drawSurvival(p),el('p','实线：当前健康设定 · 虚线：基准健康'),el('p','游戏模型估算 · 圆点标记当前年龄'));
right.append(family,peers,survival,ages);
if(notice)right.append(el('p',notice,'notice'));
layout.append(left,identity,right);
app.append(layout);
if(decision&&!p.ended&&dismissedDecision!==decision)left.querySelector('dialog').showModal();
}
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
  top.append(el('span','人生抉择 · '+dateAt(run.player.month),'eyebrow'),button('先收起',close,'muted'));
  modal.addEventListener('cancel',event=>{event.preventDefault();close()});
  const body=el('div',undefined,'decision-body');
  const title=el('h2',card[2]);
  title.id='decision-title';
  body.append(title,el('p',card[3]));
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
  body.append(button('交给托管',()=>{
    run.auto=true;dismissedDecision=null;
    auto();save();render();
  },'muted'));
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
    ...entry.months.flatMap(m=>getMonthHistory(date(m.month),m.city).map(fact=>fact.date+' · 史实：'+fact.title+' '+fact.url)),
    ...entry.notes.filter(note=>note.text).map(note=>note.age+' 岁的笔记：'+note.text),
  ].join('\n');
  const link=el('a');
  link.href=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  link.download='人生一页-'+player.name+'.txt';
  link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}

function endingPanel(entry,archived=false){
  const summary=memoir(entry);
  const section=panel();
  section.classList.add('ending-panel');
  const title=el('h2',entry.player.name+'的一生');
  section.append(el('div','人生回顾 / LIFE IN PAGES','eyebrow'),title,
    el('p',summary.start+' 至 '+summary.end+' · '+summary.from+' → '+summary.to));
  const art=el('figure',undefined,'register-art');
  art.append(drawScene(entry.player,Number(summary.end.slice(-2))));
  section.append(art);
  const metrics=el('dl',undefined,'ending-metrics');
  for(const [label,value] of [['走过的年龄',entry.player.age+' 岁'],['做出的抉择',summary.decisions+' 次'],['生活过的城市',summary.places+' 座']]){
    const cell=el('div');cell.append(el('dt',label),el('dd',value));metrics.append(cell);
  }
  section.append(metrics);
  if(summary.moments.length){
    section.append(el('h3','这一路的几个片段'));
    const list=el('ol');
    for(const item of summary.moments)list.append(el('li',item.age+' 岁 · '+item.text));
    section.append(list);
  }
  const actions=el('div',undefined,'row');
  const replaySeed=entry.birthGeography==='census2020'?entry.seed:undefined;
  actions.append(button(replaySeed===undefined?'开始另一段人生':'重走同一起点',()=>startNewLife(entry.mode,entry.birthYear,entry.birthMonth,replaySeed)),
    button('导出人生档案',()=>exportLife(entry),'muted'));
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

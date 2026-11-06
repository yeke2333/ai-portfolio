const KEY='life-page.save.v1';
import {cards,places,focusLabels} from './content.js';
import {create,resolve,advancePeriod,prepareCalendar,annualIncome,choiceOptions,randomChoice} from './engine.js';
import {drawScene,drawAgeGrid,drawPortrait,familyAt,lifeStage} from './scene.js';
import {drawSurvival} from './survival-view.js';
import {populationSinceOpen,populationClockSource} from './population-clock.js';
import {monthKey,getMonthHistory} from './history.js';
import {censusSource,cities,cityLabel,provinceWeight} from './geography.js';
import {provinceData,provinceSources} from './province-annual.js';
import {firstYear,lastYear,urbanShare} from './population.js';
const dateAt=offset=>monthKey(run.birthYear,offset,run.birthMonth);
let selectedYear=null,dismissedDecision=null;
const openSections=new Set();
let run=null,playing=false,timer=null,notice='',screen='home';
const app=document.querySelector('#app');
function save(){if(!run)return;try{localStorage.setItem(KEY,JSON.stringify(run))}catch{notice='浏览器无法保存，关闭页面后进度可能丢失。'}}
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
function returnHome(){stop();save();screen='home';render()}
function stop(){playing=false;clearInterval(timer);timer=null}
function tick(pace=run?.pace,paint=true){if(!run||run.player.ended||run.pending.length){stop();render();return}run=advancePeriod(run,pace);selectedYear=null;if(run.auto)auto();if(run.pending.length||run.player.ended)stop();if(paint){save();render()}}
function auto(){while(run.pending.length){let x=run.pending.shift();if(x.kind==='decision'){let c=cards.find(a=>a[1]===x.id);resolve(run.player,c,randomChoice(run.player,c))}}}
function start(){if(run.pending.length||run.player.ended)return;stop();playing=true;timer=setInterval(()=>tick(),(run.mode==='quick'?2250:7500)/run.speed);render()}
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
function render(){app.replaceChildren();queueMicrotask(updatePopulationClocks);if(screen==='home'){let hero=el('section',undefined,'hero');let intro=el('div',undefined,'hero-intro');intro.append(el('div','一段人生，一页一页展开','eyebrow'),el('h1','人生一页'),el('p','从一次随机的出生开始。在平凡的日子和重要的选择里，走过一段属于你的中国生活。'));let mode=el('select');[['quick','快览 · 约 3 分钟'],['standard','标准 · 约 10 分钟']].forEach(([v,t])=>{let o=el('option',t);o.value=v;mode.append(o)});let year=2002,birthMonth=1;let row=el('div',undefined,'row');row.append(field('出生年份',Array.from({length:lastYear-firstYear+1},(_,i)=>[String(firstYear+i),(firstYear+i)+' 年']),'2002',v=>{year=Number(v);paintStats()}),field('出生月份',Array.from({length:12},(_,i)=>[String(i+1),(i+1)+' 月']),'1',v=>birthMonth=Number(v)),mode,button('随机出生',()=>{if(hasSavedData()&&!confirm('开始新人生会覆盖本机已有的进度，确定继续吗？'))return;run=create(mode.value,undefined,year,birthMonth);run.registration=true;selectedYear=null;screen='birth';save();render()}));let saved=read();if(saved)row.append(button('继续上次人生',()=>{run=saved;selectedYear=null;screen=run.registration?'birth':'life';stop();render()},'muted'));intro.append(row,populationClock());if(notice)intro.append(el('p',notice,'notice'));const art=el('div',undefined,'art');intro.append(art);
 function paintStats(){
  art.replaceChildren(el('div','年度人口构成 / '+year,'eyebrow'),el('h2','出生环境抽样'));
  const urban=urbanShare(year)*100;
  for(const [label,weight] of [['城镇',urban],['乡村',100-urban]]){
    const line=el('div',undefined,'birth-weight');const meter=el('progress');
    meter.max=100;meter.value=weight;meter.setAttribute('aria-label',label);
    line.append(el('span',label),meter,el('strong',weight.toFixed(2)+'%'));art.append(line);
  }
  const source=el('a','世界银行 WDI · 联合国人口司');
  source.href='https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS?locations=CN';
  art.append(el('p','按所选年的城乡人口占比模拟抽样。它是居民构成，非城乡新生儿比例。月份用于人生时间线，同年各月共用年度数据。'),source);
 }
 paintStats();hero.append(intro,mapPreview());app.append(hero);let info=panel('关于这段模拟');info.append(el('p','出生环境使用公开年度统计做抽样代理。角色家庭、城市落点、事件与风险仍含模拟设定，历史事实在地方志中单独标注。'));let a=el('a','国家统计局 · 第七次全国人口普查');a.href=censusSource;info.append(el('p','出生地覆盖中国大陆 31 个省级地区。省级权重按 2020 年常住人口固定计算，省内主要城市样本等概率抽取。'),a);if(saved)app.append(cohortPanel(saved.peers,saved.registration));app.append(info);return}
const p=run.player;
if(screen==='birth'){
  const birthCity=cities[p.birthCity];
  const c=panel('出生登记');c.classList.add('birth-register');
  const location=el('div',undefined,'birth-location');
  const weight=run.birthGeography==='census2020'
    ? '省级抽取权重 '+(provinceWeight(birthCity.province)*100).toFixed(2)+'% · 省内主要城市样本等概率'
    : '沿用这段人生存档中的出生地';
  location.append(el('div','出生地 / '+dateAt(0),'eyebrow'),el('strong',cityLabel(p.birthCity)),el('small',weight));
  c.append(location,el('h1',p.name),el('p',`${places[p.birth]} · ${dateAt(0)} · 家庭收入第 ${p.quintile} 组`),el('p','你的起点已经确定。未来的日子，会由选择、环境与偶然共同写下。'),button('开始这段人生',()=>{run.registration=false;screen='life';save();render()}),button('返回主界面',returnHome,'muted'));c.append(drawScene(p),cohortPanel(run.peers,true),populationClock());app.append(c);return
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
illustration.append(drawScene(p));
chapter.append(illustration,chapterText);
left.append(chapter);
if(!p.ended){
  const controls=el('div',undefined,'play-controls');
  const stepping=el('div',undefined,'row play-primary');
  const progressState=run.pending.length?'等待选择':playing?'正在推进':'已暂停';
  const playButton=button(playing?'暂停':'开始',()=>playing?(stop(),render()):start());
  const nextButton=button(run.pace==='year'?'过一年':'过一个月',()=>tick(),'muted');
  const jumpButton=button('跳到下一抉择',()=>{
    stop();
    for(let i=0;i<1320&&!run.player.ended&&!run.pending.length;i++){
      const seen=run.player.seen.length;
      tick('month',false);
      if(run.player.seen.length>seen)break;
    }
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
    field('生活重心',Object.entries(focusLabels),run.focus,v=>{run.focus=v;save()}),
    button(run.auto?'托管：开':'托管：关',()=>{run.auto=!run.auto;if(run.auto)auto();save();render()},'muted'));
  settings.append(settingsRow);
  controls.append(stepping,settings);
  left.append(controls);
}
const decision=run.pending[0];
if(decision&&!p.ended)left.append(decisionCard(decision));
let history=panel(p.ended?'人生档案':'生活记录');if(p.ended){history.append(el('p',`从${places[p.birth]}出发，走过了 ${p.age} 年。教育：${p.education}；最后的工作状态：${p.job}。`));history.append(button('导出人生档案',()=>{let text=[p.name+' 的人生',...p.log.map(x=>(x.month===undefined?x.age+'岁':dateAt(x.month))+'：'+x.text),...run.months.flatMap(m=>getMonthHistory(dateAt(m.month),m.city).map(e=>e.date+' · 史实：'+e.title+' '+e.url)),...run.notes.filter(x=>x.text).map(x=>x.age+'岁的心里话：'+x.text)].join('\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.download='人生一页.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}))}const log=el('div',undefined,'log life-log');
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
const yuan=amount=>new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:0}).format(amount);
for(const [label,value] of [['现金余额',yuan(p.cash)],['年收入',p.age<18?'—':yuan(annualIncome(p,run.focus))]]){
  const cell=el('div');cell.append(el('span',label),el('strong',value));money.append(cell);
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

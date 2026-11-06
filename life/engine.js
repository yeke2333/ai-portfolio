import {urbanShare} from './population.js';
import {cityLabel, drawBirthCity, drawMoveCity} from './geography.js';
import {cards,places,names,records} from './content.js';
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
export const choiceOptions=card=>card.slice(4);
export const randomChoice=(person,card)=>Math.floor(rand(person)*choiceOptions(card).length);

export function annualIncome(person, focus) {
  if(person.age<18)return 0;
  const base=person.job==='退休'?26000:person.job==='尚未工作'?10000:39000+person.stats.skill*350;
  return base+(focus==='work'?1800:0);
}

function monthlyRisk(month,health) {
  const age=Math.floor(month/12);
  if(age>=110)return 1;
  const annual=month<=12?.004:Math.min(.95,(.00011+.0011*Math.exp((age-40)/10))*(1+(60-health)*.006));
  return 1-(1-annual)**(1/12);
}

export function survivalCurve(health=65) {
  const points=[1];
  let remaining=1;
  for(let month=1;month<=1320;month++){
    remaining*=1-monthlyRisk(month,health);
    if(month%12===0)points.push(remaining);
  }
  return points;
}

function followUp(person,item) {
  const {stats,age,month}=person;
  let text;
  switch(item.id){
    case 'playground': {
      const outcomes=[
        ['skill',3,'你拆开了一辆旧玩具车，第一次试着弄清轮子是怎么转动的。'],
        ['ties',4,'院子里的玩伴每天都来叫你下楼，你们渐渐成了好朋友。'],
        ['mood',4,'那个曾经独自坐着的孩子把最喜欢的绘本借给了你。'],
        ['ties',2,'你想出来的游戏传开了，院子里的孩子常请你来带头。'],
      ];
      const [stat,value,outcome]=outcomes[item.option];
      stats[stat]=clamp(stats[stat]+value);
      text=outcome;
      break;
    }
    case 'first-job':
      person.job='在职';
      text='两年的工作经历让你拿到了正式岗位，收入开始稳定下来。';
      break;
    case 'child':
      person.family.push({role:'孩子',age:0,joinedAt:age});
      person.cash-=4000;
      text='一个新成员来到了家里。你开始适应新的家庭节奏，添置了第一批照护用品。';
      break;
    default: {
      const chance=item.id==='settle'?(stats.skill>=50?.65:.4):Math.min(.8,.25+(stats.skill+stats.ties)/300);
      const success=rand(person)<chance;
      if(success){person.job='在职';person.cash+=5000}
      text=success?'经过一段时间，你遇到了一次合适的工作机会。':'事情没有立刻顺利，但你继续调整生活。';
    }
  }
  person.log.push({age,month,text,kind:'milestone'});
}
export function rand(p){let t=p.rng=(p.rng+0x6d2b79f5)>>>0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}
function person(seed,id,year){let p={id,rng:seed>>>0,age:0,ended:false,stats:{health:65,mood:62,skill:12,ties:55},cash:0,education:'尚未入学',job:'尚未工作',seen:[],log:[],scheduled:[]};p.name=names[Math.floor(rand(p)*names.length)];p.family=[{role:'母亲',age:23+Math.floor(rand(p)*13)},{role:'父亲',age:24+Math.floor(rand(p)*15)}];let n=rand(p);p.place=n<urbanShare(year)?1:3;p.birth=p.place;p.quintile=1+Math.floor(rand(p)*5);p.stats.ties=clamp(50+rand(p)*20);const location = {rng:(seed ^ 0xa341316c) >>> 0};
p.city = p.birthCity = drawBirthCity(rand(location), rand(location));
p.log.push({age:0,text:`你出生在${cityLabel(p.birthCity)}的一个${places[p.place]}家庭。`});return p}
export function create(mode,seed=crypto.getRandomValues(new Uint32Array(1))[0],birthYear=2002,birthMonth=1){
  if(!Number.isFinite(urbanShare(birthYear))||!Number.isInteger(birthMonth)||birthMonth<1||birthMonth>12){
    throw new RangeError('出生年月超出数据范围');
  }
  const player=person(seed,'p',birthYear);
  const namesInUse=new Set([player.name]);
  const peers=[1,2,3,4].map(index=>{
    const peer=person((seed+Math.imul(index,0x9e3779b9))>>>0,'p'+index,birthYear);
    let nameIndex=names.indexOf(peer.name);
    while(namesInUse.has(peer.name)){
      nameIndex=(nameIndex+1)%names.length;
      peer.name=names[nameIndex];
    }
    namesInUse.add(peer.name);
    return peer;
  });
  return prepareCalendar({version:2,birthYear,birthMonth,birthGeography:'census2020',pace:'month',mode,seed,
    focus:'learn',auto:false,speed:1,pending:[],notes:[],player,peers});
}
function effect(p,id,n){let s=p.stats;switch(id){case'playground':p.scheduled.push({age:4,id,option:n});break;case'household':if(!n){p.family.push({role:'伴侣',age:p.age,joinedAt:p.age});s.ties+=5}else s.mood+=4;break;case'parenthood':if(!n)p.scheduled.push({age:p.age+1,id:'child'});else p.cash+=2000;break;case'school':n?s.mood+=4:s.ties+=5;break;case'hobby':n?s.ties+=5:s.skill+=5;break;case'education':p.education=n?'职业教育':'普通教育';s.skill+=n?4:6;if(n)p.cash+=1000;break;case'future':if(n){p.job='初入职场';p.scheduled.push({age:p.age+2,id:'first-job'});}else{p.education='继续学习';s.skill+=7}break;case'move':if(!n){p.cash-=6000;s.ties-=4;s.skill+=3;p.place=p.place===0?1:0;p.nextCity=drawMoveCity(p.city,rand(p));p.scheduled.push({age:p.age+2,id:'settle'})}else{s.ties+=4;p.scheduled.push({age:p.age+2,id:'local'})}break;case'career':if(n)p.cash+=4000;else s.skill+=6;p.job='在职';break;case'relationship':n?s.mood+=5:s.ties+=6;break;case'home':if(n){p.cash+=5000;s.mood-=2}else{s.ties+=5;p.cash-=2000}break;case'learning':s.skill+=n?3:7;if(!n)p.cash-=3000;break;case'money':if(n){s.mood+=6;p.cash-=2000}else p.cash+=3000;break;case'care':s.ties+=n?3:6;if(n)s.mood+=2;else p.cash-=3000;break;case'retire':if(!n)p.job='退休';else s.mood+=4;break;case'community':n?s.mood+=5:s.ties+=6;break;case'later':n?s.mood+=4:s.ties+=5}
Object.keys(s).forEach(k=>s[k]=clamp(s[k]));}
export function resolve(p,card,n){effect(p,card[1],n);p.seen.push(card[1]);p.log.push({age:p.age,month:p.month,text:`「${card[2]}」你选择了${choiceOptions(card)[n][0]}。`,kind:"decision"})}
export function advancePerson(p,focus,isPlayer){if(p.ended)return [];let s=p.stats;const birthday=(p.month+1)%12===0;if(birthday){if(focus==='learn')s.skill+=2;if(focus==='work'){s.skill++;}if(focus==='health')s.health+=2;if(focus==='ties')s.ties+=2;if(p.age>=45)s.health-=1;Object.keys(s).forEach(k=>s[k]=clamp(s[k]));}if(p.age>=18){const childCost=p.family.some(member=>member.role==='孩子'&&p.age-member.joinedAt<18)?6000:0;p.cash+=(annualIncome(p,focus)-[39000,34000,27000,22000][p.place]-childCost)/12}
p.month++;if(p.nextCity!==undefined){p.city=p.nextCity;delete p.nextCity}if(birthday){p.age++;if(p.age===22&&p.education==='继续学习'){p.education='完成进修';p.log.push({age:p.age,month:p.month,text:'你完成了进修，开始把所学用到新的生活里。',kind:'milestone'});}for(const item of p.scheduled.filter(x=>x.age===p.age))followUp(p,item);p.scheduled=p.scheduled.filter(x=>x.age!==p.age);}
if(p.age>=110||rand(p)<monthlyRisk(p.month,s.health)){p.ended=true;p.log.push({age:p.age,month:p.month,text:'这一段人生走到了终点。'});return []}
if(!birthday)return [];
const decisions=cards.filter(card=>eligible(p,card));
if(decisions.length){
  if(isPlayer)return decisions.map(card=>({kind:"decision",id:card[1]}));
  for(const card of decisions)resolve(p,card,randomChoice(p,card));
}else if(rand(p)<.32){
  const lines=p.age<6?["你又认识了院子里的一张新面孔。","熟悉的声音让你在午后安静下来。","你试着自己完成了一件小事。"]:records;
  p.log.push({age:p.age,month:p.month,text:lines[Math.floor(rand(p)*lines.length)]});
}
return [];
}

function eligible(person, card) {
  const [age,id]=card;
  if(person.seen.includes(id))return false;
  if(id==='parenthood')return person.age===age&&person.family.some(member=>member.role==='伴侣');
  if(id==='move'){
    if(person.age<22||person.age>29||person.education==='继续学习')return false;
    return person.place>=2||person.job==='尚未工作'||person.stats.skill>=46;
  }
  if(id==='learning')return person.age>=38&&person.age<=42&&person.stats.skill>=30;
  if(id==='retire')return person.age>=60&&person.age<=68&&person.job==='在职';
  return person.age===age;
}
export function advanceRun(current){
  if(current.player.ended||current.pending.length)return current;
  const run=structuredClone(current);
  run.pending=advancePerson(run.player,run.focus,true);
  run.peers.forEach((peer,index)=>advancePerson(peer,['learn','work','ties','health'][index],false));
  run.months.push({month:run.player.month,city:run.player.city});
  return run;
}

export function prepareCalendar(run) {
  const legacy = run.version === 1;
  run.birthYear ??= legacy ? 2025 : 2002;
  run.version = 2;
  run.pending=run.pending.filter(item=>item.kind!=='reflection');
  run.birthMonth ??= 1;
  run.pace ??= legacy ? 'year' : 'month';
  for (const [i,person] of [run.player,...run.peers].entries()) {
    person.family ??= [{role:'母亲',age:28},{role:'父亲',age:30}];
    person.month ??= person.age * 12;
    person.city ??= ((run.seed >>> (i+1)) & 1);
    person.birthCity ??= person.city;
  }
  run.months ??= [{month:run.player.month,city:run.player.city}];
  return run;
}

export function advancePeriod(run, pace = run.pace) {
  const steps = pace === 'year' ? 12 : 1;
  for(let step=0;step<steps;step++){
    const next=advanceRun(run);
    if(next===run)break;
    run=next;
    if(run.pending.length||run.player.ended)break;
  }
  return run;
}

import {cities} from './geography.js';

const baseline={cost:1,wage:1};
const pilotCities={
  成都:{cost:1.06,wage:1.07},
  武汉:{cost:1.03,wage:1.05},
  杭州:{cost:1.24,wage:1.18},
};

export function localConditions(person){
  const city=cities[person.city]?.name;
  const pilot=Object.hasOwn(pilotCities,city);
  return {...(pilot?pilotCities[city]:baseline),pilot};
}

export function studyBudget(person){
  if(person.education!=='继续学习')return {support:0,tuition:0};
  // Values use a common game currency so runs can be compared across eras.
  const newer=person.birthYear>=2000;
  const {cost}=localConditions(person);
  return {
    support:700+person.quintile*350+(person.studyAid??0),
    tuition:(newer?450:350)*cost,
  };
}

export const contextCards=[
  [19,'study-aid','下一学年的费用','家里能承担一部分费用。你也可以争取助学岗位，或抽时间做有报酬的兼职。',['申请助学岗位','家境有限时获每月 650 元补助，其余获 250 元，持续到毕业'],['课余兼职','每月增加 850 元，持续到毕业，健康 −3'],['专注学业','技能 +5']],
  [23,'local-apprentice','本地的带教岗位','附近的单位愿意给新人安排带教。起步不快，但有人愿意手把手教。',['接受带教岗位','进入在职状态，技能 +5'],['看一看其他机会','关系 +3']],
  [23,'local-digital','平台运营的入门机会','本地团队在招运营新人。试用期间，你要学习商品管理和数据整理。',['接受这个岗位','进入在职状态，技能 +5'],['和同行交流，再做决定','关系 +4']],
  [0,'budget-recovery','借款仍在累积','上一轮调整之后，生活费仍有缺口。可以调整住处、商量家庭支持，或保持现有安排。',['换到开支更低的住处','今后生活开支减少 12%，心情 −3'],['商量家里能否搭把手','按家境获得一次性支持，家人亲密度 +3'],['保持现有安排','保留当前住所，每月照常还款']],
];

export function contextEligible(person,id){
  if(id==='study-aid')return person.education==='继续学习';
  if(id==='budget-recovery')return false;
  if(!localConditions(person).pilot||person.job==='退休')return false;
  return id===(person.birthYear<2000?'local-apprentice':'local-digital');
}

export function applyContextChoice(person,id,index){
  if(id==='study-aid'){
    if(index===0)person.studyAid=person.quintile<=3?650:250;
    if(index===1){person.studyAid=850;person.stats.health-=3;}
    if(index===2)person.stats.skill+=5;
    return;
  }
  if(id==='budget-recovery'){
    if(index===0){person.lowerHousingCost=true;person.stats.mood-=3;}
    if(index===1){
      person.cash+=1000+person.quintile*750;
      person.relationships.family=Math.min(100,person.relationships.family+3);
      for(const member of person.family)member.bond=Math.min(100,member.bond+3);
    }
    person.budgetReview=person.month+24;
    return;
  }
  if(index===0){person.job='在职';person.stats.skill+=5;}
  else person.stats.ties+=id==='local-digital'?4:3;
}

export function recordLifeStage(person,force=false){
  const age=person.age;
  const stage={
    month:person.month,city:person.city,education:person.education,
    work:person.job==='在职'||person.job==='初入职场'?(person.occupation??person.careerTrack??person.job):person.job,
    partner:person.family.some(member=>member.role==='伴侣'),
    children:person.family.filter(member=>member.role==='孩子').length,
  };
  person.stages??={};
  const before=person.stages[age];
  if(force||!before||Object.keys(stage).some(key=>key!=='month'&&before[key]!==stage[key])){
    person.stages[age]=stage;
  }
}

export function sharedStages(player,peer){
  return Object.keys(player.stages??{}).map(Number).filter(age=>peer.stages?.[age])
    .sort((a,b)=>a-b).map(age=>({age,player:player.stages[age],peer:peer.stages[age]}));
}

export function stageDifference(pair,player,peer){
  const {player:left,peer:right}=pair;
  return [
    left.education!==right.education&&'升学',
    left.work!==right.work&&'职业',
    (left.city!==player.birthCity||right.city!==peer.birthCity)&&left.city!==right.city&&'迁居',
    (left.partner!==right.partner||left.children!==right.children)&&'家庭',
  ].filter(Boolean);
}

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
  [27,'shop-trial','先摆三个周末的摊','旧同事问你愿不愿意合用一个摊位。你算过进货钱，还得留下自己的房租。',['先拿少量货试卖','投入 1200 元，两年后可决定是否正式开店'],['保留本职工作，帮忙记账','技能 +3，关系 +3']],
  [29,'shop-lease','签不签自己的铺面','周末摊摆了两年，客人已经会回来找你。现在有个小铺面空出来。',['签约开一家小店','投入 4800 元，转为社区小店店主'],['结束试卖，把库存盘出去','收回 1800 元，维持目前职业']],
  [37,'family-evening','谁去接孩子','这周放学时间改了，家里两个人的下班点都卡得紧。',['固定留出两个傍晚','家人亲密度 +6，心情 +2'],['排一张接送日程，轮流调整','家人亲密度 +3，技能 +3']],
  [46,'career-shift','一份离家更近的工作','新岗位离住处只有两站路，工资也有些变化。要不要把现在的工作经验带过去？',['接受附近的岗位','转为社区工作人员，健康 +4'],['留下，把工作边界重新谈清楚','关系 +4，心情 +3']],
  [63,'workshop-plan','每周有一个下午空出来','从单位离开以后，你想找个可以每周去一次的地方。附近图书馆正找人带阅读活动。',['试着组织读书小组','关系 +4，两年后有后续故事'],['把下午留给自己的作品','技能 +4，两年后有后续故事']],
  [65,'workshop-return','那段空闲时间留下了什么','两年前你重新安排了周四下午。现在，有人问能不能把你做的事继续办下去。',['再教一位新来的参与者','关系 +6'],['把做过的东西整理出来','技能 +5']],
];

export function contextEligible(person,id){
  if(id==='study-aid')return person.education==='继续学习';
  if(id==='budget-recovery')return false;
  if(id==='shop-trial')return person.cash>=1200&&person.job==='在职';
  if(id==='shop-lease')return person.shopTrial===true&&person.cash>=4800;
  if(id==='family-evening')return person.family.some(member=>member.role==='孩子');
  if(id==='career-shift')return person.job==='在职'&&person.careerTrack!=='社区工作';
  if(id==='workshop-plan')return person.job==='退休';
  if(id==='workshop-return')return person.seen.includes('workshop-plan');
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
  if(id==='shop-trial'){
    if(index){person.stats.skill+=3;person.stats.ties+=3;}
    else{person.cash-=1200;person.shopTrial=true;}
    return;
  }
  if(id==='shop-lease'){
    if(index)person.cash+=1800;
    else{
      person.cash-=4800;person.job='在职';person.careerTrack='自由职业';
      person.chosenOccupation='社区小店店主';
    }
    person.shopTrial=false;
    return;
  }
  if(id==='family-evening'){
    const gain=index?3:6;
    person.relationships.family=Math.min(100,person.relationships.family+gain);
    for(const member of person.family)member.bond=Math.min(100,member.bond+gain);
    if(index)person.stats.skill+=3;
    else person.stats.mood+=2;
    return;
  }
  if(id==='career-shift'){
    if(index){person.stats.ties+=4;person.stats.mood+=3;}
    else{person.careerTrack='社区工作';person.chosenOccupation='社区工作人员';person.stats.health+=4;}
    return;
  }
  if(id==='workshop-plan'||id==='workshop-return'){
    person.stats[index?'skill':'ties']+=id==='workshop-plan'?4:index?5:6;
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

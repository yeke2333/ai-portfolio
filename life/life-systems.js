export const journeyCards=[
  [14,'journey-curiosity','一直没有放下的好奇心','小时候反复动手尝试的经历，让你留意到了一次作品展示机会。',['认真准备一份作品','技能 +6，两年后得到展示反馈'],['邀请伙伴一起完成','关系 +5，两年后再次合作']],
  [26,'journey-network','一位旧识的邀请','过去积累的交往，让一位旧识想到了你，邀请你参与一项短期合作。',['花时间尝试合作','技能 +5，资金 +2000'],['保持联系，暂缓合作','关系 +5']],
  [0,'budget-pressure','这个月的账单','支出超过了可用现金，缺口已记入借款。你需要安排接下来的几个月。',['压缩一部分生活开支','未来一年生活开支降低 15%，心情 −2'],['接一些额外工作','未来一年每月增加收入 600 元，健康 −3'],['借一笔周转金','现金 +3000，同时增加借款；每月计息']],
  [35,'family-time','一次认真相处的约定','亲近的人提起，最近大家都很忙。你想怎样照顾这段关系？',['定期一起吃饭或散步','家人亲密度 +8，心情 +3'],['先倾听，再一起安排','家人亲密度 +5，关系 +4']],
  [50,'friend-reunion','多年后的再次见面','童年时一起玩的朋友联系了你，问你愿不愿意找个时间见一面。',['赴约聊聊各自的生活','友情 +8，心情 +4'],['认真回信，约定继续联系','友情 +5，关系 +4']],
];
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
export function prepareJourney(person){
  person.interests??={curiosity:0,sociability:0};
  person.relationships??={family:55,friend:45};
  person.debt??=0;
  if(person.cash<0){person.debt-=person.cash;person.cash=0;}
  person.family.forEach(member=>member.bond??=person.relationships.family);
}
export function rememberChoice(person,card,index){
  prepareJourney(person);
  const hint=card[4+index][1];
  if(hint.includes('技能'))person.interests.curiosity++;
  if(hint.includes('关系'))person.interests.sociability++;
  if(card[1]==='playground'){
    if(index===0)person.interests.curiosity+=2;
    else{
      person.interests.sociability+=2;
      person.relationships.friend+=4;
    }
  }
}
export function journeyEffect(person,id,index){
  prepareJourney(person);
  const {stats,relationships}=person;
  switch(id){
    case 'journey-curiosity':
      stats[index?'ties':'skill']+=index?5:6;
      person.scheduled.push({age:person.age+2,id:'journey-feedback',option:index});
      break;
    case 'journey-network':
      if(index)stats.ties+=5;
      else{stats.skill+=5;person.cash+=2000;}
      break;
    case 'budget-pressure':
      if(index===0){person.frugalUntil=person.month+12;stats.mood-=2;}
      else if(index===1){person.extraWorkUntil=person.month+12;stats.health-=3;}
      else{person.debt+=3000;person.cash+=3000;}
      person.budgetReview=person.month+12;
      break;
    case 'family-time':
      relationships.family=clamp(relationships.family+(index?5:8));
      person.family.forEach(member=>member.bond=clamp(member.bond+(index?5:8)));
      stats[index?'ties':'mood']+=index?4:3;
      break;
    case 'friend-reunion':
      relationships.friend=clamp(relationships.friend+(index?5:8));
      stats[index?'ties':'mood']+=4;
      break;
  }
}
export function journeyEligible(person,id){
  if(id==='journey-curiosity')return person.interests.curiosity>=3;
  if(id==='journey-network')return person.interests.sociability>=3;
  if(id==='family-time')return person.family.length>0;
  if(id==='friend-reunion')return person.relationships.friend>=49;
  return false;
}
export function settleMonth(person,income,expenses){
  prepareJourney(person);
  const extraWork=person.month<(person.extraWorkUntil??0);
  const earned=income/12+(extraWork?600:0);
  const spent=expenses/12*(person.month<(person.frugalUntil??0)?.85:1);
  const interest=person.debt*.003;
  person.debt+=interest;
  person.cash+=earned-spent;
  const borrowed=Math.max(0,-person.cash);
  person.debt+=borrowed;
  person.cash=Math.max(0,person.cash);
  const repaid=Math.min(person.debt,person.cash,Math.max(0,earned-spent)*.2);
  person.cash-=repaid;
  person.debt=Math.max(0,person.debt-repaid);
  person.lastBill={month:person.month,income:earned,expenses:spent,interest,borrowed,repaid,balance:earned-spent-interest};
}
export function journeyBirthday(person,focus){
  prepareJourney(person);
  if(focus==='ties'){
    person.relationships.family=clamp(person.relationships.family+2);
    person.relationships.friend=clamp(person.relationships.friend+2);
    person.family.forEach(member=>member.bond=clamp(member.bond+2));
  }
}

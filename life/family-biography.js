import {cities,cityLabel} from './geography.js';
import {monthKey} from './history.js?v=1.5';
import {familyCareer} from './life-careers.js?v=1.5.2';
const childhood=[
  '第一次自己走到学校，在校门口等同桌一起进教室。',
  '上学路上要经过一段小坡，下雨时总记得绕开积水。',
  '开学前家里包好了新书皮，还在封面角上写了名字。',
];
const interests=[
  ['做饭','把一道常做的菜改了好几回，终于找到了自己喜欢的味道。'],
  ['养花','把窗边空出来的一小块地方留给了花盆，浇水成了早晨的习惯。'],
  ['摄影','开始留意街上熟悉的角落，时不时带相机出去走一走。'],
  ['修理旧物','把家里一个停了很久的旧钟修好，之后常替熟人看看坏掉的小物件。'],
  ['读书','常把借来的书带在身边，等车时也能翻几页。'],
];

export function isParent(member){
  return member.role==='母亲'||member.role==='父亲';
}

function biographyRoll(life,index){
  let state=((life.player.identitySeed??life.seed)^Math.imul(index+1,0x85ebca6b)^0xcd3cb977)>>>0;
  return size=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return Math.floor(state/4294967296*size);
  };
}

export function familyBiography(life,member,index){
  const {player}=life;
  const parent=isParent(member);
  const joinMonth=(member.joinedAt??0)*12;
  const joinedCity=parent?player.birthCity:life.months.find(entry=>entry.month===joinMonth)?.city;
  const dateAt=offset=>monthKey(life.birthYear,offset,life.birthMonth);
  const birthYear=Number(dateAt(joinMonth).slice(0,4))-member.age;
  const roll=biographyRoll(life,index);
  const province=cities[joinedCity??player.birthCity]?.province;
  const nearby=cities.flatMap((city,id)=>city.province===province?[id]:[]);
  const birthCity=nearby[roll(nearby.length)]??player.birthCity;
  const career=familyCareer(birthYear,roll(4294967296)/4294967296,player.birth===3);
  const schoolScene=childhood[roll(childhood.length)];
  const [interest,interestScene]=interests[roll(interests.length)];
  const interestAge=career.start+1+roll(3);
  const retirementAge=60+roll(5);
  const age=Math.min(110,member.currentAge);
  const graduationAge={初中:15,中职:18,高中:18,大专:21,本科:22}[career.education];
  const education=age<6?'学龄前':age<15?'基础教育在读':
    age<graduationAge?career.education+'在读':career.education;
  const occupation=age<career.start?'尚未工作':age>=retirementAge?'已退休 · 曾任'+career.job:career.job;
  const chapters=[];
  function add(eventAge,title,text,date=String(birthYear+eventAge),shared=false){
    if(eventAge<=age)chapters.push({age:eventAge,date,title,text,shared});
  }
  add(0,'出生','出生在'+cityLabel(birthCity)+'。');
  add(6,'开始上学',schoolScene);
  add(15,'读完初中',career.education==='初中'?'结束学校生活，开始打听附近的学徒机会。':'决定继续升学，准备下一阶段的课程。');
  add(career.start,'第一份工作','开始做'+career.job+'。'+career.firstJob);
  add(interestAge,'工作之外',interestScene);
  add(retirementAge,'退休后的生活','离开'+career.job+'岗位后，把更多空闲时间留给'+interest+'。');
  add(member.age,parent?'主角出生':'与主角开始共同生活',parent
    ? player.name+'在'+cityLabel(player.birthCity)+'出生，成为家里的新成员。'
    : (joinedCity===undefined?'':'在'+cityLabel(joinedCity))+'与'+player.name+'开始共同生活。',
  dateAt(joinMonth),true);
  for(const child of player.family.filter(item=>item.role==='孩子')){
    const joinedAt=child.joinedAt??0;
    if(joinedAt*12<joinMonth)continue;
    add(member.age+joinedAt-(member.joinedAt??0),parent?'家里多了一位晚辈':'迎来孩子',
      child.name?child.name+'出生，家里有了新的日常。':'家里迎来了一个孩子。',dateAt(joinedAt*12),true);
  }
  chapters.sort((a,b)=>a.age-b.age||a.date.localeCompare(b.date));
  return {birthYear,birthCity,education,occupation,interest,joinedCity,chapters};
}

const surnames='赵 钱 孙 李 周 吴 郑 王 冯 陈 褚 卫 蒋 沈 韩 杨 朱 秦 许 何 吕 施 张 孔 曹 严 华 金 魏 陶 姜 谢 邹 苏 潘 葛 范 彭 鲁 韦 马 方 任 柳 唐 薛 雷 贺 倪 汤 罗 郝 安 乐 于 傅 余 顾 孟 黄 叶 白 杜 江 童 章 洪 汪 石 尹 邵 袁 田 胡 郭 梁 曾 林 郑 欧阳 司马 上官'.split(' ');
const givenNames={
  女:'小梅 晓燕 秀兰 玉琴 芳华 秋月 明珠 春桃 雪莲 文静 雅琴 倩倩 佳怡 思雨 欣然 雯雯 雨桐 清禾 若溪 可昕 梦琪 知夏 清越 沁宁 舒桐 晓棠 沐晴'.split(' '),
  男:'建军 国强 志明 海涛 卫东 向阳 长青 德生 明远 志鹏 家伟 宇航 嘉诚 子昂 浩然 俊杰 文博 景行 泽宇 承安 远航 嘉树 明朗 亦辰 言川 南舟 景澄'.split(' '),
};

function pick(list,roll){return list[Math.floor(roll*list.length)]}

export function makeIdentity(roll,gender=roll()<.5?'女':'男',surname=pick(surnames,roll())){
  return {gender,surname,name:surname+pick(givenNames[gender],roll())};
}

const professions={
  专业岗位:['会计','设备工程师','软件测试员','建筑绘图员'],
  社区工作:['社区工作人员','公务员','公共图书馆馆员','养老服务协调员'],
  自由职业:['社区小店店主','摄影师','家电维修个体户','家政服务经营者'],
  入门:['餐厅服务员','商超理货员','仓库管理员','车间装配工','客服专员'],
};
export function occupationAt(person){
  const options=professions[person.careerTrack]??professions.入门;
  return options[((person.birthCity??0)+(person.quintile??0))%options.length];
}

export function dailyLife(person,roll){
  const age=person.age;
  const scenes=age<6?[
    '下楼时你坚持自己按电梯，按完又踮脚看数字一层层跳。',
    '你把吃剩的橘子籽埋进花盆，第二天一早就去看有没有发芽。',
    '午睡醒来，窗外已经在下雨。你趴在椅背上等家里人回来。',
    '你给桌边的玩具一人摆了一块饼干，最后还是自己挨个吃完了。',
    '买菜回家路上，你接过最轻的袋子，坚持拎到家门口。',
  ]:age<18?[
    '同桌忘带直尺，你们把同一把尺子在两张桌子间推来推去。',
    '放学下起雨，你和同学站在校门口的小卖部檐下等雨小一点。',
    '鞋带在操场上散了两次，回家才发现裤脚沾了一圈白灰。',
    '你把练习册夹在书包最里面，回到家才想起还有一面没写。',
    '周一收作业时，同桌递来一本上周借走的书，书页里夹着半张车票。',
    '运动会结束后你们留在操场捡纸杯。广播里说可以回教室了，大家才舍得散。',
  ]:age<65?[
    '你下楼买早点，摊主已经记得你不要葱，伸手就把袋子递过来。',
    '试着照菜谱做饭，最后还是给家里打电话问该放多少水。',
    '洗衣服前翻了翻口袋，摸出一张上个月忘了报销的小票。',
    '楼道灯坏了两天，你和邻居在群里商量谁有空去报修。',
    '换乘时没赶上车。你索性在站台旁买了杯豆浆，等下一班。',
    '周末收拾冰箱，你发现上次买的香葱还没用完，干脆摊了两张葱油饼。',
    '月底对账，才发现常去的那家店已经半个月没开。路过时，你又抬头看了一眼。',
    '加班回来，菜还在锅里温着。你先盛了一碗汤，坐下才想起换鞋。',
  ]:[
    '你把散落在几个设备里的旧照片挑出来，给每张补上年份和地点。',
    '约了老朋友在另一头的街口见。你提前出门，顺路买了两杯热饮。',
    '你帮邻居录了一段做菜的视频，后来他真照着视频把那道菜做出来了。',
    '有人邀你带一次社区工作坊。你挑了件自己用了多年的工具放进包里。',
    '你把散步路上遇见的野花拍下来，核对了几本图册，才把名字补进自己的记录。',
    '老同学发来一段没剪完的视频，你在时间线上挪了几个镜头，顺手加上字幕。',
  ];
  return pick(scenes,roll);
}

export const futureCards=[
  [2035,'future-ai-work','同事多了一个 AI 助手','部门把整理表格和回复常见问题交给了 AI。你仍要核实它办不了的例外。',['报名学自动化流程','技能 +6'],['专做需要当面沟通的事','关系 +5']],
  [2045,'future-ai-community','社区的数字工具课','社区开放了 AI 工作台。有人用它修老照片，也有人试着把方言整理成教材。',['带上旧照片试着修复','心情 +5'],['教大家用自己的话提要求','技能 +4，关系 +3']],
  [2060,'future-shuttle','街口的预约接驳车','附近新增了按需接驳服务。你可以在公共屏幕预约，也可以用自己的设备。',['约朋友坐车去逛展','关系 +5'],['替邻居一起试预约','心情 +4']],
  [2075,'future-maker','退休后的维修课','一间共享工坊开始招讲师。你带着用了几十年的工具，和年轻人一起试新的检测设备。',['每月带一节课','技能 +5，关系 +3'],['做学员，试试陌生的工具','心情 +5']],
];

export function futureEligible(person,card){
  const [year,id]=card;
  const calendarYear=person.birthYear+Math.floor((person.month+(person.birthMonth??1)-1)/12);
  if(id==='future-ai-work'&&!['在职','初入职场'].includes(person.job))return false;
  const minimumAge=id==='future-maker'?65:18;
  return person.age>=minimumAge&&calendarYear>=year;
}

export function applyFutureChoice(person,id,index){
  const stats=person.stats;
  switch(id){
    case 'future-ai-work': stats[index?'ties':'skill']+=index?5:6; break;
    case 'future-ai-community':
      if(index){stats.skill+=4;stats.ties+=3;}
      else stats.mood+=5;
      break;
    case 'future-shuttle': stats[index?'mood':'ties']+=index?4:5; break;
    case 'future-maker':
      if(index)stats.mood+=5;
      else{stats.skill+=5;stats.ties+=3;}
      break;
  }
}

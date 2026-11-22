import {cities} from './geography.js';

const entries = [
  ['1999-11-20','national','','神舟一号首飞','我国的第一艘试验飞船在酒泉发射。','https://www.cmse.gov.cn/xwzx/zhxw/201812/t20181225_22560.html'],
  ['2001-12-11','national','','中国加入世界贸易组织','中国加入世界贸易组织的议定书正式生效。','https://treaty.mfa.gov.cn/web/detail1.jsp?objid=1545032325250'],
  ['2003-10-15','national','','神舟五号载人飞行','杨利伟搭乘神舟五号升空，这是我国首次载人航天飞行。','https://www.cmse.gov.cn/xwzx/zhxw/201812/t20181225_22560.html'],
  ['2008-05-12','province','四川','汶川地震','地震发生于四川省汶川县。成都居民的具体经历由游戏另行模拟。','https://www.mee.gov.cn/zcwj/gwywj/201811/t20181129_676448.shtml'],
  ['2008-08-08','national','','北京夏季奥运会开幕','第29届奥林匹克运动会在北京开幕。','https://www.sport.gov.cn/n4/n6/n8/c320803/part/192557.pdf'],
  ['2010-05-01','city','上海','上海世博会园区开放','开幕式在前一天举行，世博园区于5月1日正式开放。','https://www.pudong.gov.cn/assets/daj/pddaxxw/smsbzPDF/%E4%B8%96%E5%8D%9A%E8%AE%B0-1.pdf'],
  ['2018-10-24','province','广东','港珠澳大桥通车','连接香港、珠海、澳门的大桥于这一天正式通车。','https://www.chinatax.gov.cn/chinatax/n810219/n810744/n1671176/n1671206/c2069874/5116154/files/b52253723a6a44fcb2475e29301d0639.pdf'],
  ['2021-06-17','national','','神舟十二号发射','三名航天员从酒泉出发，开启空间站建造阶段的首次载人飞行任务。','https://www.cmse.gov.cn/xwzx/yzjz/202106/t20210616_48135.html'],
  ['2022-02-04','national','','北京冬奥会开幕','第二十四届冬季奥林匹克运动会在北京开幕。','https://www.sport.gov.cn/n20001280/n20744752/c23975500/content.html'],
  ['2022-03-04','national','','北京冬残奥会开幕','北京冬残奥会开幕式在国家体育场举行。','https://www.mfa.gov.cn/zyxw/202203/t20220305_10648307.shtml'],
  ['2023-07-28','city','成都','成都大运会','四川省人大决定载明，成都大运会举办期为7月28日至8月8日。','https://www.scspc.gov.cn/jyjd/202307/19391.html'],
  ['2023-09-23','city','杭州','杭州亚运会开幕','第十九届亚洲运动会在杭州开幕。','https://www.mfa.gov.cn/zyxw/202309/t20230924_11148823.shtml'],
].map(([date, scope, area, title, summary, url]) => ({ date, scope, area, title, summary, url }));

export function monthKey(birthYear, offset, birthMonth = 1) {
  offset += birthMonth - 1;
  return (birthYear + Math.floor(offset / 12)) + '-' + String(offset % 12 + 1).padStart(2, '0');
}

export function getMonthHistory(month, cityIndex) {
  const city = cities[cityIndex];
  return entries.filter(event => event.date.startsWith(month + '-') &&
    (event.scope === 'national' || event.area === (event.scope === 'city' ? city?.name : city?.province)));
}

export function lifeHistory(life){
  const facts=new Map();
  for(const {month,city} of life.months){
    const date=monthKey(life.birthYear,month,life.birthMonth);
    for(const fact of getMonthHistory(date,city))facts.set(fact.date+fact.title,{...fact,month,age:Math.floor(month/12)});
  }
  return [...facts.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

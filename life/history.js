import {cities} from './geography.js';

const entries = [
  ['2008-05-12','province','四川','汶川地震','地震发生于四川省汶川县。成都居民的具体经历由游戏另行模拟。','https://www.mee.gov.cn/zcwj/gwywj/201811/t20181129_676448.shtml'],
  ['2008-08-08','national','','北京夏季奥运会开幕','第29届奥林匹克运动会在北京开幕。','https://www.sport.gov.cn/n4/n6/n8/c320803/part/192557.pdf'],
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

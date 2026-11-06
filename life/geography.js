export const censusSource = 'https://www.stats.gov.cn/sj/zxfb/202302/t20230203_1901083.html';

// 第七次全国人口普查表 3-1。城市为游戏样本，按现行名称展示。
const regions = [
  ['北京', 21893095, ['北京']],
  ['天津', 13866009, ['天津']],
  ['河北', 74610235, ['石家庄', '唐山', '保定', '邯郸']],
  ['山西', 34915616, ['太原', '大同', '运城', '长治']],
  ['内蒙古', 24049155, ['呼和浩特', '包头', '赤峰', '鄂尔多斯']],
  ['辽宁', 42591407, ['沈阳', '大连', '鞍山', '锦州']],
  ['吉林', 24073453, ['长春', '吉林', '四平']],
  ['黑龙江', 31850088, ['哈尔滨', '齐齐哈尔', '大庆', '牡丹江']],
  ['上海', 24870895, ['上海']],
  ['江苏', 84748016, ['南京', '苏州', '无锡', '徐州']],
  ['浙江', 64567588, ['杭州', '宁波', '温州', '金华']],
  ['安徽', 61027171, ['合肥', '芜湖', '阜阳', '蚌埠']],
  ['福建', 41540086, ['福州', '厦门', '泉州', '漳州']],
  ['江西', 45188635, ['南昌', '赣州', '九江', '上饶']],
  ['山东', 101527453, ['济南', '青岛', '烟台', '临沂']],
  ['河南', 99365519, ['郑州', '洛阳', '南阳', '新乡']],
  ['湖北', 57752557, ['武汉', '襄阳', '宜昌', '荆州']],
  ['湖南', 66444864, ['长沙', '衡阳', '株洲', '岳阳']],
  ['广东', 126012510, ['广州', '深圳', '佛山', '东莞']],
  ['广西', 50126804, ['南宁', '柳州', '桂林', '北海']],
  ['海南', 10081232, ['海口', '三亚']],
  ['重庆', 32054159, ['重庆']],
  ['四川', 83674866, ['成都', '绵阳', '德阳', '南充']],
  ['贵州', 38562148, ['贵阳', '遵义', '六盘水']],
  ['云南', 47209277, ['昆明', '曲靖', '玉溪', '大理']],
  ['西藏', 3648100, ['拉萨', '日喀则']],
  ['陕西', 39528999, ['西安', '咸阳', '宝鸡', '榆林']],
  ['甘肃', 25019831, ['兰州', '天水', '酒泉']],
  ['青海', 5923957, ['西宁', '格尔木']],
  ['宁夏', 7202654, ['银川', '石嘴山', '吴忠']],
  ['新疆', 25852345, ['乌鲁木齐', '克拉玛依', '喀什', '伊宁']],
];

// 存档按数组索引引用城市。成都、杭州沿用旧编号，其余编号由上方列表的顺序决定。
export const cities = [
  { name: '成都', province: '四川', blurb: '成都平原上的城市。档案覆盖部分四川及成都事件。' },
  { name: '杭州', province: '浙江', blurb: '钱塘江畔的城市。档案覆盖部分浙江及杭州事件。' },
];

const provinces = regions.map(([name, population, names]) => ({
  name,
  population,
  cityIds: names.map(city => {
    const existing = cities.findIndex(record => record.name === city && record.province === name);
    if (existing !== -1) return existing;
    return cities.push({ name: city, province: name }) - 1;
  }),
}));
const totalPopulation = provinces.reduce((total, province) => total + province.population, 0);

export function drawBirthCity(provinceRoll, cityRoll) {
  let threshold = provinceRoll * totalPopulation;
  for (const province of provinces) {
    threshold -= province.population;
    if (threshold < 0) return province.cityIds[Math.floor(cityRoll * province.cityIds.length)];
  }
}

export function provinceWeight(name) {
  return provinces.find(province => province.name === name).population / totalPopulation;
}

export function drawMoveCity(currentCity, roll) {
  const index = Math.floor(roll * (cities.length - 1));
  return index < currentCity ? index : index + 1;
}

export function cityLabel(cityId) {
  const { name, province } = cities[cityId];
  return province === name ? name : `${province} · ${name}`;
}

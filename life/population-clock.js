export const populationClockSource='https://www.stats.gov.cn/sj/zxfbhjd/202602/t20260228_1962662.html';
const secondsIn2025=365*24*60*60;

export function populationSinceOpen(seconds){
  return [7_920_000,11_310_000].map(annual=>Math.floor(Math.max(0,seconds)*annual/secondsIn2025));
}

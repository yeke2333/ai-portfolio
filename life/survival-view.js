import {survivalCurve} from './engine.js';

export function drawSurvival(person){
  const baseline=survivalCurve();
  const comparison=survivalCurve(person.stats.health);
  const plot=document.createElementNS('http://www.w3.org/2000/svg','svg');
  plot.setAttribute('viewBox','0 0 260 150');
  plot.setAttribute('role','img');
  plot.setAttribute('aria-label','游戏模型存活曲线。年龄横轴，模拟存活比例纵轴。');
  function mark(tag,attrs,text){
    const node=document.createElementNS(plot.namespaceURI,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
    if(text!==undefined)node.textContent=text;
    plot.append(node);
  }
  const x=age=>33+age*2;
  const y=share=>119-share*107;
  const line=points=>points.map((share,age)=>(age?'L':'M')+x(age)+' '+y(share).toFixed(2)).join('');
  for(const share of [0,.25,.5,.75,1]){
    mark('line',{x1:33,x2:253,y1:y(share),y2:y(share),stroke:'#d2dfd8'});
    mark('text',{x:29,y:y(share)+3,'text-anchor':'end'},share*100+'%');
  }
  for(const age of [0,25,50,75,100])mark('text',{x:x(age),y:137,'text-anchor':'middle'},age);
  mark('path',{d:line(comparison)+'L253 119H33Z',fill:'#dcebe4'});
  mark('path',{d:line(baseline),fill:'none',stroke:'#647976','stroke-width':'1.4','stroke-dasharray':'4 3'});
  mark('path',{d:line(comparison),fill:'none',stroke:'#227969','stroke-width':'2'});
  const age=person.age;
  mark('line',{x1:x(age),x2:x(age),y1:y(comparison[age]),y2:119,stroke:'#8b2044','stroke-opacity':'.55'});
  mark('circle',{cx:x(age),cy:y(comparison[age]),r:3.8,fill:'#8b2044',stroke:'#fff'});
  return plot;
}

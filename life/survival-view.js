import {survivalCurve} from './engine.js?v=1.5';

export function drawSurvival(person,inspect){
  const baseline=survivalCurve();
  const comparison=survivalCurve(person.stats.health);
  const plot=document.createElementNS('http://www.w3.org/2000/svg','svg');
  plot.setAttribute('viewBox','0 0 260 150');
  plot.setAttribute('role','img');
  plot.setAttribute('aria-label','游戏模型存活曲线。年龄横轴，模拟存活比例纵轴。');
  plot.setAttribute('tabindex','0');
  function mark(tag,attrs,text){
    const node=document.createElementNS(plot.namespaceURI,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
    if(text!==undefined)node.textContent=text;
    plot.append(node);
    return node;
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
  const cursor=mark('line',{y1:12,y2:119,stroke:'#546785','stroke-dasharray':'3 3',visibility:'hidden'});
  let selected=age;
  function show(next){
    selected=Math.max(0,Math.min(110,next));
    cursor.setAttribute('x1',x(selected));cursor.setAttribute('x2',x(selected));
    cursor.setAttribute('visibility','visible');
    const bounds=plot.getBoundingClientRect();
    inspect(selected,comparison[selected],baseline[selected],
      {left:bounds.left+x(selected)*bounds.width/260,top:bounds.top,bottom:bounds.bottom,width:0});
  }
  function showPointer(event){
    const bounds=plot.getBoundingClientRect();
    show(Math.round(((event.clientX-bounds.left)*260/bounds.width-33)/2));
  }
  plot.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')showPointer(event);});
  plot.addEventListener('click',showPointer);
  plot.addEventListener('focus',()=>show(selected));
  plot.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    show(selected+(event.key==='ArrowLeft'?-1:1));
  });
  plot.addEventListener('pointerleave',()=>cursor.setAttribute('visibility','hidden'));
  plot.addEventListener('blur',()=>cursor.setAttribute('visibility','hidden'));
  return plot;
}

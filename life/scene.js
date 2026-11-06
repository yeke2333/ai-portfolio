export function lifeStage(age){
  if(age<2)return '婴儿';
  if(age<6)return '幼儿';
  if(age<12)return '童年';
  if(age<18)return '少年';
  if(age<40)return '青年';
  if(age<65)return '中年';
  return '老年';
}

export function familyAt(person) {
  return person.family.map(member=>({
    ...member,
    currentAge:member.age+person.age-(member.joinedAt??0),
    atHome:member.role==='孩子'?person.age-member.joinedAt<22:
      member.joinedAt!==undefined || (person.age<22&&person.city===person.birthCity),
  }));
}

function canvasAt(width,height){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  return canvas;
}

function blocks(ctx){
  return (x,y,width,height,color)=>{
    ctx.fillStyle=color;ctx.fillRect(x,y,width,height);
  };
}

function sprite(block,x,ground,age,coat){
  const outline='#293d44',skin='#e7aa80',light='#f6ca9f';
  const rect=(dx,dy,w,h,c)=>block(x+dx,ground+dy,w,h,c);
  rect(-9,0,18,2,'#23383855');
  if(age<2){
    rect(-8,-9,16,9,outline);rect(-7,-8,14,7,coat);
    rect(-5,-12,9,6,outline);rect(-4,-11,7,4,light);
    rect(-2,-10,1,1,outline);rect(1,-10,1,1,outline);
    rect(-2,-5,7,2,'#fff0c9');
    return;
  }
  const height=age<6?18:age<12?23:age<18?28:age<65?33:30;
  const top=-height;
  const hair=age>=65?'#d8d7c1':age>=42?'#4f524d':'#343934';
  rect(-6,top,12,13,outline);rect(-4,top-2,8,3,outline);
  rect(-5,top+1,10,5,hair);rect(-4,top+5,8,7,skin);
  rect(-3,top+6,6,3,light);rect(-3,top+7,1,2,outline);rect(2,top+7,1,2,outline);
  rect(-8,top+12,16,height-16,outline);rect(-6,top+13,12,height-18,coat);
  rect(-2,top+13,4,2,'#e8dfc7');rect(-1,top+16,2,2,'#f3e5c8');
  rect(-5,-6,4,5,'#435358');rect(1,-6,4,5,'#435358');
  rect(-6,-2,5,2,outline);rect(1,-2,5,2,outline);
  if(age>=65){
    rect(8,-11,5,2,'#b38e65');rect(11,-11,2,11,'#b38e65');
    rect(-4,top+8,8,1,'#514c40');
  }
}

export function drawPortrait(person){
  const canvas=canvasAt(44,47);
  canvas.className='id-portrait';
  canvas.setAttribute('aria-hidden','true');
  const block=blocks(canvas.getContext('2d'));
  block(0,0,44,47,'#b9d9d8');
  block(6,8,12,3,'#e7edda');block(29,12,10,3,'#e7edda');
  block(0,37,44,10,'#8da391');block(0,43,44,4,'#657c75');
  sprite(block,22,41,person.age,'#2e8074');
  return canvas;
}


const seasons=[
  ['冬','冬日','#354765','#67718c','#b99099','#f8d0a1','#809d9c','#cddbd6'],
  ['春','春日','#496b75','#75a29b','#d5b4a0','#ffe2a9','#719a76','#b4cc91'],
  ['夏','夏日','#355976','#538e9a','#a4b6a2','#ffe3a3','#5d8d71','#92b486'],
  ['秋','秋日','#4c4667','#986a80','#d59a86','#ffdc9b','#9b765c','#d5a878'],
];
const W=400,H=166;
const skyLine=116;
export function seasonFor(month){
  return seasons[month===12||month<3?0:month<6?1:month<9?2:3];
}

function pixelCloud(block,x,y,w,light,shadow){
  block(x,y,w,3,shadow);
  block(x+4,y-3,w-10,3,light);
  block(x+12,y-6,w-24,3,light);
  block(x+18,y-9,Math.max(4,w-34),3,light);
}

function house(block,x,width,height,wall,roof,index,isTown){
  const y=skyLine-height;
  block(x+5,y+3,width,height,'#293344');
  block(x,y,width,height,wall);
  block(x+width-5,y+4,5,height-4,'#4b444d');
  for(let t=0;t<5;t++)block(x-4+t*2,y-t*2,width+8-t*4,2,roof);
  block(x-4,y+1,width+8,2,'#342d40');
  for(let wy=y+9;wy<skyLine-14;wy+=13){
    block(x+2,wy-3,width-8,1,'#573f4a55');
    for(let wx=x+6;wx<x+width-9;wx+=12){
      const warm=(wx+wy+index)%4!==0;
      block(wx,wy,7,8,'#403949');
      block(wx+1,wy+1,5,5,warm?'#f2bf83':'#82949c');
      block(wx+3,wy+1,1,5,'#a17a72');
      block(wx-1,wy+7,9,1,'#efd5af');
    }
  }
  block(x+7,skyLine-16,width-15,3,isTown?'#815953':'#467572');
  block(x+10,skyLine-13,10,13,'#433748');
  block(x+11,skyLine-12,7,8,'#ae7863');
  block(x+24,skyLine-12,width-33,8,'#c79577');
  if(isTown){
    block(x+6,skyLine-22,width-11,5,'#c27757');
    for(let s=x+9;s<x+width-8;s+=6)block(s,skyLine-21,3,2,'#f5d5a0');
  }
}

function drawStreet(canvas,person,month,preview){
  const [season,,sky,mid,haze,sun,trees,grass]=seasonFor(month);
  const ctx=canvas.getContext('2d');
  const b=blocks(ctx);
  const city=person.place<2;
  const village=person.place===3;
  const region=person.city??0;
  b(0,0,W,56,sky);
  for(const [y,h,c] of [[28,16,mid],[44,17,haze],[61,32,'#d9a38e']])b(0,y,W,h,c);
  for(let y=6;y<54;y+=4)for(let x=(y%3)*2;x<W;x+=7){
    if((x*17+y*13)%19<5)b(x,y,1,1,'#fff1d329');
  }
  const sunX=city?306:286;
  for(let y=-19;y<=19;y+=2){
    const half=Math.floor(Math.sqrt(400-y*y)/2)*2;
    b(sunX-half,49+y,half*2,2,sun);
  }
  pixelCloud(b,35,38,62,'#dec2b9','#aa93a1');
  pixelCloud(b,193,27,50,'#ccafad','#96859a');
  pixelCloud(b,320,59,52,'#ebc8ae','#b58d93');
  for(let x=0;x<W;x+=2){
    const ridges=2*Math.floor((Math.sin(x/39+region*.11)*13+Math.cos(x/17)*5)/2);
    b(x,78+ridges,2,45-ridges,'#797e8c');
    b(x,90+Math.floor(Math.cos(x/25+region)*11),2,30,'#626f79');
  }
  for(let i=0;i<(village?0:20);i++){
    const x=i*22-2,h=city?12+(i*13+region)%30:8+(i*7+region)%14;
    const y=106-h;
    b(x,y,16,h,'#576671');
    b(x+2,y-2,12,2,'#6e7c83');
    for(let wy=y+4;wy<103;wy+=5)if((wy+i)%3!==0)b(x+4,wy,3,1,'#b59d8a');
  }
  b(0,107,W,24,grass);
  b(0,127,W,5,'#b39a87');
  b(0,132,W,25,village?'#8f7668':'#50505c');
  b(0,134,W,2,village?'#ad9080':'#817279');
  b(0,156,W,10,'#343743');
  for(let x=1;x<W;x+=23){
    if(!village)b(x,143,12,1,'#c0a88d');
    b(x+4,154,14,1,village?'#a38876':'#686471');
    b(x,123,5,1,trees);
  }
  if(village){
    for(let y=92;y<120;y+=5){
      b(110+y-92,y,68,3,trees);
      b(292,y,90-(y-92),2,trees);
    }
    house(b,18,64,36,'#d1b295','#705662',0,false);
    house(b,79,36,22,'#bb947d','#635365',1,false);
    house(b,346,42,31,'#c9b39b','#515665',3,false);
  }else{
    house(b,15,49,city?64:41,'#c99880','#795567',0,true);
    house(b,63,45,city?47:32,'#bba28a','#55536a',1,false);
    house(b,116,46,city?59:36,'#ad8a82','#735260',2,true);
    house(b,331,60,city?48:35,'#b49b80','#575468',3,true);
  }
  for(const [x,y] of [[5,98],[174,91],[309,91],[396,98]]){
    b(x-1,y+3,3,23,'#514c55');
    for(const [dx,dy,w,h] of [[-8,-2,16,12],[-13,3,26,9],[-5,-6,10,4],[-9,12,18,4]])b(x+dx,y+dy,w,h,trees);
    b(x-7,y+1,9,3,grass);b(x-10,y+5,5,2,grass);
  }
  b(101,46,2,65,'#454252');b(298,50,2,65,'#454252');
  b(92,51,20,2,'#454252');b(290,54,18,2,'#454252');
  for(let x=102;x<=298;x+=2){
    const t=(x-102)/196;
    b(x,52+Math.floor(18*t*(1-t)+t*3),2,1,'#454252');
  }
  b(292,86,2,36,'#474757');b(281,86,13,2,'#474757');
  b(280,89,7,2,'#ffdda1');
  for(let i=0;i<13;i++){
    const x=(i*37+region*11)%W;
    b(x,117+i%9,3,1,season==='冬'?'#f3dfcf':'#e6c08d');
  }
  const people=preview?[31,28,9,3]:[...familyAt(person).filter(member=>member.atHome).map(member=>member.currentAge),person.age];
  const coats=['#a45659','#586e88','#8b688d','#bb814b'];
  people.forEach((age,index)=>{
    const x=233+Math.round((index-(people.length-1)/2)*22);
    sprite(b,x,123,age,index===people.length-1?'#3e8b78':coats[index%coats.length]);
  });
  if(!village){
    for(let x=34;x<73;x+=7)b(x,136,3,14,'#a29690');
    b(350,150,25,7,'#6d4b59');b(355,146,13,5,'#6d4b59');b(357,147,8,3,'#a3a6aa');
    b(351,156,4,3,'#292d3a');b(368,156,4,3,'#292d3a');b(374,152,3,2,'#f6cb89');
  }
  for(let i=0;i<28;i++){
    const x=(i*47+13)%W,y=159+i%6;
    b(x,y,3,1,'#716278');
  }
}

export function drawTitleScene(month,year){
  const canvas=canvasAt(W,H);
  canvas.className='title-pixels';
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label',seasonFor(month)[1]+'的像素街景');
  drawStreet(canvas,{place:1,city:year%31},month,true);
  return canvas;
}

export function drawScene(person,month=1){
  const canvas=canvasAt(W,H);
  canvas.setAttribute('role','img');
  const household=familyAt(person).filter(member=>member.atHome);
  const members=household.length?'，画面有'+household.map(member=>member.role).join('、'):'';
  canvas.setAttribute('aria-label',seasonFor(month)[1]+'，'+lifeStage(person.age)+'时期的像素场景'+members);
  drawStreet(canvas,person,month,false);
  return canvas;
}

export function drawAgeGrid(person) {
  const grid=document.createElement('div');
  grid.className='age-grid';
  for(let age=0;age<=110;age++){
    const cell=document.createElement('span');
    cell.title=age+' 岁';
    if(age<=person.age)cell.classList.add('lived');
    if(age===person.age)cell.classList.add('current');
    grid.append(cell);
  }
  return grid;
}

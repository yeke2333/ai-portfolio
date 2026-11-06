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
    atHome:member.joinedAt!==undefined || (person.age<22&&person.city===person.birthCity),
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

export function drawScene(person){
  const canvas=canvasAt(320,108);
  canvas.setAttribute('role','img');
  const household=familyAt(person).filter(member=>member.atHome);
  canvas.setAttribute('aria-label',lifeStage(person.age)+'时期的像素场景'+(household.length?'，画面有'+household.map(member=>member.role).join('、'):''));
  const block=blocks(canvas.getContext('2d'));
  const city=person.place<2;
  block(0,0,320,108,person.age>=65?'#aec7d1':'#a9d4df');
  block(31,12,13,12,'#f2deb1');
  for(let i=0;i<6;i++){
    const x=49*i+12,y=12+i%3*5;
    block(x,y,24,5,'#e8f0e8');block(x+5,y-3,12,4,'#e8f0e8');
  }
  for(let i=0;i<10;i++){
    const x=i*35,h=city?20+(i*11)%35:9+(i*7)%15;
    block(x,79-h,29,h,city?'#88aeb5':'#8daf93');
    if(city)for(let y=83-h;y<75;y+=7){
      block(x+5,y,5,3,'#bcd3cf');block(x+16,y,6,3,'#bcd3cf');
    }
  }
  block(0,78,320,30,'#adc397');block(0,94,320,14,'#626f71');block(0,93,320,2,'#e2debd');
  for(let x=9;x<320;x+=23)block(x,101,12,1,'#e0d9bc');
  const floor=city?43:62;
  block(17,floor,58,34+43-floor,'#ebdfc4');
  block(14,floor-3,65,5,'#655d59');block(21,floor-6,51,4,'#ae7968');
  block(42,66,12,12,'#536564');
  for(let x=24;x<72;x+=14)for(let y=floor+6;y<69;y+=10){
    block(x,y,8,6,'#738f96');block(x+1,y+1,6,2,'#c0d6cf');
  }
  for(const x of [94,282,307]){
    block(x,57,3,24,'#686553');block(x-5,60,14,9,'#5c9475');block(x-3,55,10,8,'#76a47c');
  }
  block(115,48,2,34,'#536d70');block(116,49,12,2,'#536d70');block(126,49,4,3,'#f3e7bb');
  const people=[...household.map(member=>member.currentAge),person.age];
  const palette=['#ac746c','#476783','#756e9a','#bd8850'];
  people.forEach((age,index)=>{
    const last=index===people.length-1;
    sprite(block,195+(index-(people.length-1)/2)*24,87,age,last?'#2e8074':palette[index]);
  });
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

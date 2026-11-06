import {createTerrain,reliefSource} from './china-terrain.js';

const WIDTH=880, HEIGHT=560;
const defaultCenter=[104,35.3];
const elevationScale=.014;
let mapData;
function loadMap() {
  mapData ??= Promise.all(['china-shapes.json','china-places.json','china-relief.json'].map(async name=>{
    const response=await fetch(new URL(name,import.meta.url));
    if(!response.ok)throw Error('地图数据不可用');
    return response.json();
  })).then(([shapes,places,relief])=>{
    const placeByName=new Map(places.map(place=>[place.name,place]));
    const regions=shapes.filter(shape=>shape.name).map(shape=>({...shape,...placeByName.get(shape.name)}));
    return {regions, referenceLines:shapes.filter(shape=>!shape.name), terrain:createTerrain(relief,regions)};
  }).catch(error=>{
    mapData=undefined;
    throw error;
  });
  return mapData;
}

export async function makeChinaMap() {
  const frame=document.createElement('figure');
  frame.className='atlas';
  frame.innerHTML=`
    <figcaption><span>地形档案 / CHINA ATLAS</span><strong>山河之间</strong></figcaption>
    <canvas width="880" height="560" aria-label="可旋转的中国立体地形图"></canvas>
    <div class="atlas-legend"><span>平原</span><i></i><span>高原与山脉</span></div>
    <div class="atlas-controls">
      <button type="button" aria-label="放大">＋</button><button type="button" aria-label="缩小">−</button>
      <button type="button" aria-label="复位地图">复位</button>
      <label>地形起伏 <input type="range" min="0" max="2.3" step="0.05" value="1.35"></label>
    </div>
    <div class="atlas-places">
      <label>省级地区 <select aria-label="省级地区"><option value="">全国</option></select></label>
      <label hidden>城市 <select aria-label="城市"><option value="">全部城市</option></select></label>
    </div>
    <small class="atlas-hint">点击地图或选择省级地区看城市 · 拖动旋转与俯仰 · 滚轮缩放</small>
    <small class="atlas-sources">底图与地名：阿里云 DataV · <a href="${reliefSource}" target="_blank" rel="noopener noreferrer">海拔：NOAA ETOPO1</a> · 地形高度经夸张</small>`;
  const canvas=frame.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  const [plus,minus,reset]=frame.querySelectorAll('button');
  const [provinceSelect,citySelect]=frame.querySelectorAll('select');
  const slider=frame.querySelector('input');
  let data,selected,selectedCity,pointer,animation,hitRegions=[];
  let yaw=-.13,pitch=.75,zoom=1,exaggeration=1.35,center=defaultCenter;

  function makeProjector() {
    const cosYaw=Math.cos(yaw),sinYaw=Math.sin(yaw);
    const cosPitch=Math.cos(pitch),sinPitch=Math.sin(pitch);
    const offset=data.terrain.elevationAt(center)*elevationScale*exaggeration;
    return ([lon,lat,z], elevation=z)=>{
      const x=(lon-center[0])*11.6,y=(center[1]-lat)*15.8;
      const rx=x*cosYaw-y*sinYaw,ry=x*sinYaw+y*cosYaw;
      const height=elevation*elevationScale*exaggeration;
      return [WIDTH/2+rx*zoom, HEIGHT*.52+(ry*cosPitch-(height-offset)*sinPitch)*zoom,
        ry*sinPitch+height*cosPitch];
    };
  }

  function shapePath(regions,project,elevation) {
    const path=new Path2D();
    for(const region of regions)for(const ring of region.rings){
      ring.forEach((point,i)=>{
        const [x,y]=project(point,elevation(point));
        if(i)path.lineTo(x,y);else path.moveTo(x,y);
      });
      path.closePath();
    }
    return path;
  }

  function draw() {
    animation=undefined;
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    if(!data)return;
    ctx.save();
    const {regions,referenceLines,terrain}=data;
    const project=makeProjector();
    const elevated=(point,lift=0)=>project(point,terrain.elevationAt(point)+lift);

    ctx.lineWidth=1;
    ctx.strokeStyle='#a6c9ae22';
    for(let lon=75;lon<=135;lon+=5)drawGridLine([lon,18],[lon,54]);
    for(let lat=20;lat<=50;lat+=5)drawGridLine([73,lat],[135,lat]);
    function drawGridLine(a,b) {
      ctx.beginPath();ctx.moveTo(...project(a,0).slice(0,2));ctx.lineTo(...project(b,0).slice(0,2));ctx.stroke();
    }

    const base=shapePath(regions,project,()=>0);
    ctx.save();
    ctx.translate(0,9*zoom);
    ctx.shadowColor='#061813';
    ctx.shadowBlur=14;
    ctx.fillStyle='#112e29';
    ctx.fill(base,'evenodd');
    ctx.restore();

    const outline=shapePath(regions,project,terrain.elevationAt);
    ctx.save();
    ctx.clip(outline,'evenodd');
    ctx.fillStyle='#438270';
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    const points=terrain.vertices.map(point=>project(point));
    for(const face of terrain.faces)face.depth=points[face.a][2]+points[face.b][2]+points[face.c][2];
    terrain.faces.sort((a,b)=>a.depth-b.depth||a.a-b.a||a.b-b.b);
    ctx.lineWidth=.65;
    for(const {a,b,c,color} of terrain.faces){
      const [ax,ay]=points[a],[bx,by]=points[b],[cx,cy]=points[c];
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx,cy);ctx.closePath();
      ctx.fillStyle=color;ctx.strokeStyle=color;ctx.fill();ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle='#89ad8f66';
    ctx.lineWidth=1.3;
    if(!selected)ctx.stroke(shapePath(referenceLines,project,()=>0));
    hitRegions=regions.map(region=>[region,shapePath([region],project,terrain.elevationAt)]);
    ctx.strokeStyle='#173d34b8';
    for(const [,path] of hitRegions)ctx.stroke(path);
    if(selected){
      const path=hitRegions.find(([region])=>region===selected)[1];
      ctx.fillStyle='#ffce7830';ctx.fill(path,'evenodd');
      ctx.strokeStyle='#ffe4a0';ctx.lineWidth=2.5;ctx.stroke(path);
    }

    const boxes=[];
    const textScale=Math.min(1.38,Math.max(1,520/(canvas.clientWidth||520)));
    function label(name,x,y,color,priority=false) {
      ctx.font='700 '+Math.round((priority?21:17)*textScale)+'px sans-serif';
      const width=ctx.measureText(name).width, height=22*textScale;
      const box=[x-3,y-height+3,x+width+4,y+4];
      if(box[0]<5||box[1]<5||box[2]>WIDTH-5||box[3]>HEIGHT-5)return false;
      if(boxes.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))return false;
      boxes.push(box);
      ctx.fillStyle=color;ctx.strokeStyle='#15392e';ctx.lineWidth=4;ctx.lineJoin='round';
      ctx.strokeText(name,x,y);ctx.fillText(name,x,y);
      return true;
    }
    if(selected){
      const cities=selected.cities.slice().sort((a,b)=>Number(b[0]===selectedCity)-Number(a[0]===selectedCity));
      for(const [name,lon,lat] of cities){
        const [x,y]=elevated([lon,lat]);
        const active=name===selectedCity;
        ctx.beginPath();ctx.arc(x,y,active?7:4.5,0,Math.PI*2);ctx.fillStyle=active?'#fff5bd':'#ffca7a';ctx.fill();
        ctx.strokeStyle='#18392d';ctx.lineWidth=1.7;ctx.stroke();
        const labelWidth=name.length*18*textScale;
        const placements=[[x+9,y-6],[x-labelWidth-9,y-6],[x+9,y+19],[x-labelWidth-9,y+19]];
        placements.some(([lx,ly])=>label(name,lx,ly,'#fff4cc',active));
      }
    }else{
      for(const region of regions){
        const name=region.name.replace(/(壮族自治区|维吾尔自治区|回族自治区|特别行政区|自治区|省|市)$/,'');
        const [x,y]=elevated(region.centroid,45);
        label(name,x-name.length*8*textScale,y,'#f5f1da');
      }
    }
    ctx.restore();
  }

  function scheduleDraw(){
    if(animation===undefined)animation=requestAnimationFrame(draw);
  }

  function selectRegion(region) {
    selected=region;
    selectedCity=undefined;
    center=region?.centroid??defaultCenter;
    zoom=region?1.72:1;
    provinceSelect.value=region?.name??'';
    citySelect.replaceChildren(new Option('全部城市',''));
    for(const [name] of region?.cities??[])citySelect.add(new Option(name,name));
    citySelect.parentElement.hidden=!region?.cities.length;
    scheduleDraw();
  }

  function scale(factor){zoom=Math.min(3.7,Math.max(.64,zoom*factor));scheduleDraw()}
  plus.onclick=()=>scale(1.18);
  minus.onclick=()=>scale(1/1.18);
  reset.onclick=()=>{
    yaw=-.13;pitch=.75;exaggeration=1.35;slider.value='1.35';
    selectRegion(undefined);
  };
  slider.oninput=()=>{exaggeration=Number(slider.value);scheduleDraw()};
  provinceSelect.onchange=()=>selectRegion(data?.regions.find(region=>region.name===provinceSelect.value));
  citySelect.onchange=()=>{
    selectedCity=citySelect.value;
    const point=selected.cities.find(([name])=>name===selectedCity);
    center=point?point.slice(1):selected.centroid;
    scheduleDraw();
  };

  canvas.onpointerdown=event=>{
    if(pointer||!event.isPrimary||event.button!==0)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,distance:0};
    canvas.setPointerCapture(pointer.id);
  };
  canvas.onpointermove=event=>{
    if(pointer?.id!==event.pointerId)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    pointer.x=event.clientX;pointer.y=event.clientY;pointer.distance+=Math.hypot(dx,dy);
    if(pointer.distance<4)return;
    yaw+=dx*.008;
    pitch=Math.max(.12,Math.min(1.17,pitch-dy*.006));
    scheduleDraw();
  };
  canvas.onpointerup=event=>{
    if(pointer?.id!==event.pointerId||pointer.distance>=4)return;
    const rect=canvas.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width*WIDTH,y=(event.clientY-rect.top)/rect.height*HEIGHT;
    const hit=hitRegions.find(([,path])=>ctx.isPointInPath(path,x,y,'evenodd'));
    if(hit)selectRegion(hit[0]);
  };
  canvas.onlostpointercapture=()=>{pointer=undefined};
  canvas.addEventListener('wheel',event=>{event.preventDefault();scale(event.deltaY<0?1.09:1/1.09)},{passive:false});
  data=await loadMap();
  for(const region of data.regions)provinceSelect.add(new Option(region.name,region.name));
  scheduleDraw();
  return frame;
}

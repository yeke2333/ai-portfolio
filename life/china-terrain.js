export const reliefSource = 'https://www.ncei.noaa.gov/products/etopo-global-relief-model';

const colors = [
  [0, 68, 139, 118], [500, 105, 160, 116], [1400, 156, 175, 119],
  [2500, 190, 168, 117], [4400, 185, 169, 141], [6300, 241, 234, 214],
];

function slopeColor(elevation, light) {
  const high = colors.findIndex(([height]) => height >= elevation);
  const start = colors[Math.max(0, high - 1)];
  const end = colors[Math.max(0, high)];
  const t = (elevation - start[0]) / (end[0] - start[0] || 1);
  return 'rgb(' + start.slice(1).map((value, i) =>
    Math.min(255, Math.round((value + (end[i+1] - value) * t) * light))).join(',') + ')';
}

export function createTerrain({south,west,step,width,height,elevations:sampledHeights}, shapes) {
  // Soften isolated coarse-grid peaks while retaining the broader ridges and basins.
  const elevations=sampledHeights.map((heightValue,i)=>{
    const col=i%width,row=Math.floor(i/width);
    if(heightValue===0||col===0||col===width-1||row===0||row===height-1)return heightValue;
    return heightValue*.62+(sampledHeights[i-1]+sampledHeights[i+1]+sampledHeights[i-width]+sampledHeights[i+width])*.095;
  });
  const vertices=elevations.map((z,i)=>[west+i%width*step,south+Math.floor(i/width)*step,z]);
  function elevationAt([lon,lat]) {
    const x=Math.max(0,Math.min(width-1,(lon-west)/step));
    const y=Math.max(0,Math.min(height-1,(lat-south)/step));
    if(lat<south || lat>south+(height-1)*step)return 0;
    const col=Math.min(width-2,Math.floor(x)), row=Math.min(height-2,Math.floor(y));
    const u=x-col,v=y-row,i=row*width+col;
    const a=elevations[i],b=elevations[i+1],c=elevations[i+width],d=elevations[i+width+1];
    return u>=v ? a+(b-a)*u+(d-b)*v : a+(d-c)*u+(c-a)*v;
  }

  // Rasterize the outline once so camera movement only visits faces near land.
  const mask=document.createElement('canvas');
  mask.width=width*4;mask.height=height*4;
  const ctx=mask.getContext('2d',{willReadFrequently:true});
  ctx.beginPath();
  for(const shape of shapes)for(const ring of shape.rings){
    ring.forEach(([lon,lat],i)=>{
      const x=(lon-west)/step*4,y=(lat-south)/step*4;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    });
    ctx.closePath();
  }
  ctx.fill('evenodd');
  const pixels=ctx.getImageData(0,0,mask.width,mask.height).data;
  const alphaAt=(x,y)=>pixels[(y*mask.width+x)*4+3];
  const faces=[];
  function addFace(a,b,c,east,north) {
    const average=(elevations[a]+elevations[b]+elevations[c])/3;
    const light=Math.max(.69,Math.min(1.23,1+(east-north)/3700));
    faces.push({a,b,c,color:slopeColor(average,light),depth:0});
  }
  for(let row=0;row<height-1;row++)for(let col=0;col<width-1;col++){
    const x=col*4,y=row*4;
    if(!alphaAt(x,y)&&!alphaAt(x+4,y)&&!alphaAt(x+2,y+2)&&!alphaAt(x,y+4)&&!alphaAt(x+4,y+4))continue;
    const a=row*width+col,b=a+1,c=a+width,d=c+1;
    addFace(a,b,d,elevations[b]-elevations[a],elevations[d]-elevations[b]);
    addFace(a,d,c,elevations[d]-elevations[c],elevations[c]-elevations[a]);
  }
  return {elevationAt,vertices,faces};
}

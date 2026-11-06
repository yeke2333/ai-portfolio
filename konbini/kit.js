import * as T from './vendor/three.module.js';
export {T};
const geometryCache=new Map(),materials=new Map();
const gradient=new T.DataTexture(new Uint8Array([85,85,85,255,145,145,145,255,205,205,205,255,255,255,255,255]),4,1);gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.needsUpdate=true;
export function material(color,kind='toon',emission=0){const key=[color,kind,emission].join();if(!materials.has(key)){const props={color,emissive:color,emissiveIntensity:emission};const m=kind==='basic'?new T.MeshBasicMaterial({color}):kind==='wet'?new T.MeshStandardMaterial({...props,roughness:.24,metalness:.35}):new T.MeshToonMaterial({...props,gradientMap:gradient});if(kind==='basic')m.userData.luminous=true;materials.set(key,m);}return materials.get(key);}
function rounded(w,h,d,r){r=Math.min(r,w/4,h/4,d/4);const key=[w,h,d,r].join();if(!geometryCache.has(key)){let geo;if(r<.006)geo=new T.BoxGeometry(w,h,d);else{const s=new T.Shape(),x=w/2-r,y=h/2-r;s.moveTo(-x,-y);s.lineTo(x,-y);s.lineTo(x,y);s.lineTo(-x,y);s.closePath();geo=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:r,bevelThickness:r,curveSegments:1});geo.translate(0,0,-d/2+r);geo.computeVertexNormals();}geometryCache.set(key,geo);}return geometryCache.get(key);}
export function add(g,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
export function box(g,x,y,z,w,h,d,c,r=.018,kind='toon',em=0){return add(g,rounded(w,h,d,r),material(c,kind,em),x,y,z);}
export function cylinder(g,x,y,z,r,h,c,r2=r){const key=['c',r,r2,h].join();if(!geometryCache.has(key))geometryCache.set(key,new T.CylinderGeometry(r,r2,h,12));return add(g,geometryCache.get(key),material(c),x,y,z);}
export function rod(g,a,b,r,c){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);const o=cylinder(g,...p.add(q).multiplyScalar(.5).toArray(),r,v.length(),c);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
export function tube(g,points,c,r=.022){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return add(g,new T.TubeGeometry(curve,24,r,6,false),material(c));}
export function label(g,txt,x,y,z,w,h,bg,fg='#453f38',font=110,options={}){
 // Match the texture aspect to its physical face: a glyph must not be stretched by the mesh.
 const canvas=document.createElement('canvas'),ratio=w/h;
 canvas.width=Math.round(Math.min(4096,Math.max(256,256*ratio)));
 canvas.height=Math.round(canvas.width/ratio);
 const ctx=canvas.getContext('2d'),cw=canvas.width,ch=canvas.height;
 if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,cw,ch);}
 ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
 const family=options.serif?'"Yu Mincho","MS Mincho","Noto Serif JP","SimSun",serif':'"Yu Gothic","Meiryo","Microsoft YaHei",sans-serif';
 const chars=Array.from(txt),padding=.065;
 let size=ch*font/256;
 if(options.vertical)size=Math.min(cw*.82,ch*.93/(chars.length*1.1));
 ctx.font=`${options.weight||700} ${size}px ${family}`;
 const spacing=(options.tracking||0)*size;
 if(!options.vertical){const measured=ctx.measureText(txt).width+spacing*Math.max(0,chars.length-1);if(measured>cw*(1-padding*2)){size*=cw*(1-padding*2)/measured;ctx.font=`${options.weight||700} ${size}px ${family}`;}}
 if(options.vertical){const step=size*1.1;chars.forEach((c,i)=>ctx.fillText(c,cw/2,ch/2+(i-(chars.length-1)/2)*step+size*.04));}
 else if(options.tracking){const gap=options.tracking*size,widths=chars.map(c=>ctx.measureText(c).width);let cursor=(cw-widths.reduce((a,b)=>a+b,0)-gap*(chars.length-1))/2;chars.forEach((c,i)=>{ctx.fillText(c,cursor+widths[i]/2,ch/2+size*.04);cursor+=widths[i]+gap;});}
 else ctx.fillText(txt,cw/2,ch/2+size*.04);
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=16;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
 const m=new T.MeshBasicMaterial({map:tex,transparent:!bg,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false});
 const o=add(g,new T.PlaneGeometry(w,h),m,x,y,z);o.castShadow=false;return o;
}
export function instances(g,poses,w,h,d,c){if(!poses.length)return;const mesh=new T.InstancedMesh(rounded(w,h,d,.008),material(c),poses.length),dummy=new T.Object3D();poses.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.castShadow=false;mesh.receiveShadow=true;g.add(mesh);return mesh;}
export function disc(g,x,y,z,r,c){const o=add(g,new T.CircleGeometry(r,24),material(c),x,y,z);o.rotation.x=-Math.PI/2;return o;}
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const ctx=glowCanvas.getContext('2d'),gr=ctx.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.3,'rgba(255,255,255,.24)');gr.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,128,128);const glowMap=new T.CanvasTexture(glowCanvas);
export function halo(g,x,y,z,color,size,opacity=.3){const o=new T.Sprite(new T.SpriteMaterial({map:glowMap,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}));o.material.userData.glow=true;o.position.set(x,y,z);o.scale.setScalar(size);g.add(o);return o;}
export function pool(g,x,z,w,d,color,opacity=.2,y=.33){const m=new T.MeshBasicMaterial({map:glowMap,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending});m.userData.glow=true;const o=add(g,new T.PlaneGeometry(w,d),m,x,y,z);o.rotation.x=-Math.PI/2;o.castShadow=false;return o;}
export function lamp(g,x,y,z,c,power,range){const light=new T.PointLight(c,power,range,2);light.position.set(x,y,z);g.add(light);return light;}

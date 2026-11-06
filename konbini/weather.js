import {T,add} from './kit.js';
import {Reflector} from './vendor/Reflector.js';
import {roofHeight,seededRandom} from './logic.mjs';
export function createWeather(scene){
 const g=new T.Group();g.name='rain and reflections';scene.add(g);const rng=seededRandom(2807);
 const shader={uniforms:T.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),vertexShader:Reflector.ReflectorShader.vertexShader,fragmentShader:''};
 shader.uniforms.uTime={value:0};
 shader.vertexShader=shader.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec3 vWorld;').replace('vUv = textureMatrix','vWorld = (modelMatrix * vec4(position,1.0)).xyz; vUv = textureMatrix');
 shader.fragmentShader=`
 uniform sampler2D tDiffuse;uniform float uTime;varying vec4 vUv;varying vec3 vWorld;
 #include <common>
 #include <logdepthbuf_pars_fragment>
 float puddle(vec2 p,vec2 center,vec2 size){vec2 q=(p-center)/size;float a=atan(q.y,q.x);float rim=1.0+.09*sin(a*7.0)+.055*sin(a*13.0+1.3);return 1.0-smoothstep(rim-.08,rim+.03,length(q));}
 void main(){
  #include <logdepthbuf_fragment>
  vec2 p=vWorld.xz;float m=0.0;
  m=max(m,puddle(p,vec2(.3,3.8),vec2(2.55,.56)));
  m=max(m,puddle(p,vec2(3.0,5.6),vec2(1.65,.65)));
  m=max(m,puddle(p,vec2(-4.8,5.6),vec2(1.05,.46)));
  m=max(m,puddle(p,vec2(5.55,-3.8),vec2(.72,1.6)));
  m=max(m,puddle(p,vec2(5.6,1.4),vec2(.8,.7)));
  m=max(m,puddle(p,vec2(-2.8,3.7),vec2(.86,.4)));
  if(m<.01)discard;
  vec4 uv=vUv;uv.xy+=vec2(sin(p.y*47.0+uTime*1.7)+sin(p.x*23.0-uTime),cos(p.x*36.0+uTime*.8))*.00065*uv.w;
  vec3 reflection=texture2DProj(tDiffuse,uv).rgb;
  vec3 view=normalize(cameraPosition-vWorld);float fresnel=pow(1.0-abs(view.y),2.0);
  gl_FragColor=vec4(mix(vec3(.075,.12,.17),reflection,.88),m*(.31+.33*fresnel));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
 const reflection=new Reflector(new T.PlaneGeometry(14,14),{textureWidth:768,textureHeight:768,clipBias:.002,shader});reflection.rotation.x=-Math.PI/2;reflection.position.y=.068;reflection.material.transparent=true;reflection.material.depthWrite=false;g.add(reflection);
 const n=850,positions=new Float32Array(n*6),speed=new Float32Array(n),floor=new Float32Array(n);
 for(let i=0;i<n;i++){const x=rng()*13.7-6.85,z=rng()*13.7-6.85;floor[i]=roofHeight(x,z);const y=floor[i]+rng()*(10-floor[i]);positions.set([x,y,z,x-.055,y+.25,z+.018],i*6);speed[i]=4+rng()*4;}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));g.add(new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xa7bdd0,transparent:true,opacity:.26,depthWrite:false})));
 const ripples=[],ringGeo=new T.RingGeometry(.07,.077,28);for(let i=0;i<45;i++){let x,z;do{x=rng()*13.4-6.7;z=rng()*13.4-6.7;}while(x<4.7&&z<3.25);const o=add(g,ringGeo,new T.MeshBasicMaterial({color:i%3?0x83a0b4:0xd2c7a1,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}),x,.084,z);o.rotation.x=-Math.PI/2;o.castShadow=false;ripples.push({o,phase:rng()});}
 const dripCount=34,drips=new Float32Array(dripCount*6),dripPhase=[];for(let i=0;i<dripCount;i++){const x=-3.5+rng()*7.5;drips.set([x,3.2,2.28,x,3.28,2.28],i*6);dripPhase.push(rng());}
 const dripGeo=new T.BufferGeometry();dripGeo.setAttribute('position',new T.BufferAttribute(drips,3));g.add(new T.LineSegments(dripGeo,new T.LineBasicMaterial({color:0xb1c8ce,transparent:true,opacity:.35,depthWrite:false})));
 return {group:g,reflection,update(t,dt){
  g.visible=t>11.2;if(!g.visible)return;
  reflection.material.uniforms.uTime.value=t;
  for(let i=0;i<n;i++){const a=i*6;positions[a+1]-=speed[i]*dt;positions[a+4]=positions[a+1]+.25;if(positions[a+1]<floor[i]+.03){positions[a+1]=10;positions[a+4]=10.25;}}
  geometry.attributes.position.needsUpdate=true;
  for(const {o,phase} of ripples){const p=(t*.7+phase)%1;o.scale.setScalar(.3+p*3.8);o.material.opacity=(1-p)*.18;}
  for(let i=0;i<dripCount;i++){const p=(t*1.3+dripPhase[i])%1;drips[i*6+1]=3.28-p*2.9;drips[i*6+4]=drips[i*6+1]+.09;}dripGeo.attributes.position.needsUpdate=true;
 }};
}

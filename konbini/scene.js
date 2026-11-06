import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {buildModel} from './model.js';
import {createWeather} from './weather.js';
import {assemblyProgress,framingFov,lightingProgress} from './logic.mjs';
const scene=new T.Scene();
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;document.body.appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.1,120);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,2.65,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=12;controls.maxDistance=48;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2-.03;controls.maxTargetRadius=5;
function initialView(){camera.fov=framingFov(innerWidth/innerHeight);camera.updateProjectionMatrix();camera.position.set(17,11.9,25);camera.lookAt(controls.target);}
initialView();
scene.add(new T.HemisphereLight(0x8ca9d8,0x293b48,.82));
const moon=new T.DirectionalLight(0x9ebce4,1.05);moon.position.set(-7,13,7);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:35});moon.shadow.normalBias=.025;moon.shadow.bias=-.00015;scene.add(moon);
const rim=new T.DirectionalLight(0xa48cae,.5);rim.position.set(7,8,-5);scene.add(rim);
const model=buildModel(scene),weather=createWeather(scene);
const luminous=[];const seen=new Set();model.root.traverse(o=>{const m=o.material;if(!m||seen.has(m))return;seen.add(m);if(m.userData.luminous)luminous.push({m,color:m.color.clone()});if(m.userData.glow)luminous.push({m,opacity:m.opacity});if(m.emissiveIntensity>0)luminous.push({m,emission:m.emissiveIntensity});});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock=new T.Clock();let completed=false,frameCount=0,measure=0;
function animate(){requestAnimationFrame(animate);const delta=clock.getDelta(),dt=Math.min(delta,.05),actual=clock.elapsedTime,t=reduced?actual+12:actual;
 if(!completed){for(const p of model.parts){const e=assemblyProgress(t,p.delay,1.18);p.g.visible=e>0;p.g.position.y=-(1-e)*p.lift;p.g.rotation.y=(1-e)*p.turn;}if(t>10)completed=true;}
 const lit=lightingProgress(t);for(const {light,power}of model.lights)light.intensity=power*lit;for(const p of luminous){if(p.color)p.m.color.copy(p.color).multiplyScalar(.13+.87*lit);if(p.opacity!==undefined)p.m.opacity=p.opacity*lit;if(p.emission!==undefined)p.m.emissiveIntensity=p.emission*lit;}
 weather.update(t,dt);controls.update();renderer.render(scene,camera);
 if(t>10.2)renderer.shadowMap.autoUpdate=false;
 frameCount++;measure+=delta;if(measure>2){renderer.domElement.dataset.fps=String(Math.round(frameCount/measure));frameCount=0;measure=0;}
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=framingFov(camera.aspect);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextrestored',()=>{renderer.shadowMap.needsUpdate=true;});
animate();window.__diorama={scene,camera,controls,renderer,parts:model.parts,weather};

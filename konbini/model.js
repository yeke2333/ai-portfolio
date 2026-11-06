import {T,box,cylinder,rod,tube,label,instances,disc,halo,pool,lamp,add,material} from './kit.js';
import {seededRandom} from './logic.mjs';

export function buildModel(scene){
 const root=new T.Group();scene.add(root);const parts=[],lights=[];const random=seededRandom(1105);
 const part=(name,delay,build)=>{const g=new T.Group();g.name=name;root.add(g);build(g);if(name==='illuminated shop fascia'||name==='utility poles and real wire anchors')g.traverse(o=>{if(o.material?.isMeshBasicMaterial&&o.material.map)o.material.userData.luminous=true;});parts.push({g,delay,turn:(random()-.5)*.10,lift:.7+random()*.9});return g;};
 const warm=0xffdda1,iron=0x354756,wall=0xb1b7b1;
 const light=(...args)=>{const l=lamp(...args);lights.push({light:l,power:l.intensity});return l;};
 const productColors=[0xd1ab69,0x709f8a,0xc16d73,0xdacb9d,0x7998ad,0xe5dace];
 function plant(g,x,y,z,r=.28){cylinder(g,x,y+.18,z,r,.36,0x59655b,r*.8);for(let i=0;i<5;i++){const a=i*2.4;const o=add(g,new T.IcosahedronGeometry(r*.7,1),material(i%2?0x56765b:0x6c8762),x+Math.sin(a)*r*.6,y+.5+random()*.13,z+Math.cos(a)*r*.6);o.scale.set(.9,1.25,.9);}}
 function ac(g,x,y,z,w=1){box(g,x,y,z,w,.62,.48,0xb3b8af,.025);box(g,x,y,z+.25,w-.12,.48,.025,0x697a7a,.005);for(let i=0;i<8;i++)box(g,x,y-.21+i*.06,z+.27,w-.19,.018,.018,0xa6b1a8,.002);rod(g,[x-w*.35,y-.4,z],[x+w*.35,y-.4,z],.025,iron);}
 part('square foundation',0,g=>{box(g,0,-.47,0,14,.82,14,0x142338,.09);box(g,0,-.09,0,14.05,.09,14.05,0x4b6572,.025);box(g,0,-.025,0,14,.05,14,0x263746,.015,'wet');box(g,0,-.3,7.01,13.9,.025,.02,0xada47d,.002);box(g,7.01,-.3,0,.02,.025,13.9,0xada47d,.002);});
 part('pavement and curb',.35,g=>{
  box(g,-1.29,.15,-1.96,11.42,.29,10.08,0x7a8589,.025);box(g,-1.29,.303,-1.96,11.38,.035,10,0x879394,.01);
  const joints=[];for(let x=-6.8;x<4.3;x+=.55)for(let z=-6.8;z<3;z+=.55){joints.push([x,.325,z]);}instances(g,joints,.014,.005,.53,0x6b7a82);
  const horiz=[];for(let z=-6.75;z<3;z+=.55)horiz.push([-1.3,.326,z]);instances(g,horiz,11.3,.005,.012,0x6c7d82);
  const curb=[];for(let x=-6.7;x<4.4;x+=.48)curb.push([x,.17,3.08]);instances(g,curb,.46,.3,.18,0xa4aaa2);
  for(let z=-6.7;z<3;z+=.48)box(g,4.45,.17,z,.18,.3,.46,0xa4aaa2,.012);
  // Narrow tactile strip stops before the entrance, rather than covering the whole walk.
  for(let x=-3;x<3.7;x+=.36){box(g,x,.34,2.65,.33,.025,.33,0xb7aa70,.006);for(let j=0;j<3;j++)box(g,x-.09+j*.09,.36,2.65,.025,.015,.25,0xc6b77e,.003);}
 });
 part('street markings',.8,g=>{
  for(let i=0;i<7;i++)box(g,-.8+i*.62,.039,4.7,.36,.012,2.1,0xbfc7bd,.004,'wet');
  for(let i=0;i<5;i++)box(g,5.65,.04,-1.8+i*.47,2.05,.012,.26,0xbfc7bd,.004,'wet');
  for(let x=-6;x<7;x+=2.3)box(g,x,.038,6.35,1,.01,.065,0xb5b898,0);
  for(let z=-5.9;z<6;z+=2)box(g,6.3,.038,z,.06,.01,.9,0xb5b898,0);
  box(g,-5,.039,4.9,2.1,.01,.055,0x8fa3aa,0);box(g,-6,.039,5.6,.055,.01,1.4,0x8fa3aa,0);box(g,-4,.039,5.6,.055,.01,1.4,0x8fa3aa,0);
  for(let i=0;i<12;i++){box(g,4.66,.045,-6.5+i*.74,.26,.025,.56,0x182c38,.006);for(let j=0;j<6;j++)box(g,4.66,.061,-6.72+i*.74+j*.085,.23,.01,.024,0x526773,0);}
  disc(g,5.6,.053,4.65,.42,0x243846);for(let i=-3;i<=3;i++)box(g,5.6,.057,4.65+i*.08,.59,.009,.012,0x52656d,0);
  const paint=label(g,'止まれ',5.6,.055,2.5,1.6,.7,null,'#b8c5bb',140);paint.rotation.x=-Math.PI/2;
 });
 part('shop floor and masonry',1,g=>{
  box(g,.25,.45,-1.4,7.45,.24,5.3,0x475b63,.03);box(g,.25,.59,-1.4,7.3,.05,5.15,0xc4b99a,.01);
  const joints=[];for(let x=-3.2;x<3.8;x+=.5)joints.push([x,.621,-1.4]);instances(g,joints,.012,.005,5.1,0x9e9d8d);for(let z=-3.8;z<1.2;z+=.5)box(g,.25,.622,z,7.25,.005,.012,0x9e9d8d,0);
  box(g,.25,1.96,-4,7.45,2.7,.16,0xa2aaa2,.02);box(g,-3.43,1.96,-1.4,.16,2.7,5.2,wall,.02);
  box(g,.25,.84,1.25,7.45,.45,.16,0x567b78,.01);box(g,3.93,.84,-1.4,.16,.45,5.3,0x567b78,.01);
 });
 function shelf(g,x,z,w,low=false){const height=low?1.12:1.48;box(g,x,.65+height/2,z,w,height,.14,0x778f89,.018);const poses=productColors.map(()=>[]),labels=[];
  for(let j=0;j<3;j++){const y=.7+j*(height/3);box(g,x,y,z+.20,w+.08,.055,.58,0xc8c5ae,.008);box(g,x,y+.025,z+.505,w,.08,.02,0x7a9c85,.003);for(let k=0;k<Math.floor(w/.18);k++){poses[(j+k)%6].push([x-w/2+.12+k*.18,y+.15,z+.23]);labels.push([x-w/2+.12+k*.18,y+.12,z+.355]);}}
  poses.forEach((p,i)=>instances(g,p,.13,.24,.22,productColors[i]));instances(g,labels,.085,.048,.005,0xe6d9b7);
 }
 part('front snack shelves',2,g=>{shelf(g,-2.2,.15,1.65,true);shelf(g,-.25,.15,1.65,true);label(g,'おにぎり ・ お弁当',-.3,1.99,.64,1.6,.16,'#cfbd8b','#3f6157',100);});
 part('middle grocery aisle',2.3,g=>{shelf(g,-2.15,-1.8,1.7);shelf(g,-.15,-1.8,1.7);label(g,'SNACKS',-2.15,2.2,-1.27,1.1,.16,'#d1c192','#5a665c',120);});
 part('refrigerator wall',2.6,g=>{
  const bottles=productColors.map(()=>[]);for(let n=0;n<5;n++){const x=-2.7+n*1.17;box(g,x,1.85,-3.72,1.13,2.42,.44,0x415b65,.025);box(g,x,1.85,-3.48,.99,2.17,.025,0xc0cbb2,.005,'toon',.22);box(g,x,2.99,-3.43,1.03,.045,.08,0xf1dca4,.003,'basic');
   for(let j=0;j<4;j++){const y=.87+j*.5;box(g,x,y,-3.38,1.02,.04,.32,0xa4b3a6,.005);for(let k=0;k<5;k++)bottles[(j+k+n)%6].push([x-.4+k*.2,y+.16,-3.35]);}
   box(g,x+.48,1.9,-3.17,.025,.43,.03,0xe4d7b4,.005);box(g,x-.52,1.85,-3.18,.025,2.2,.025,0x738c8e,.004);
  }bottles.forEach((p,i)=>instances(g,p,.115,.25,.13,productColors[i]));label(g,'冷たい飲みもの',-.3,3.14,-3.43,3,.18,'#658f84','#eddfba',100);
 });
 part('checkout and hot food',2.9,g=>{
  box(g,3.03,1.12,-1.17,1.05,1.02,2.12,0x7b9c8b,.025);box(g,3.03,1.65,-1.17,1.18,.08,2.22,0xd2c4a0,.025);box(g,2.95,1.87,-.55,.49,.32,.41,0x2b414c,.018);const screen=box(g,2.76,2.13,-.57,.07,.35,.43,0x78b8a6,.01,'basic');screen.rotation.z=-.15;
  box(g,3.03,1.98,-1.7,.79,.57,.66,0x6e7d77,.015);box(g,3.03,1.98,-1.354,.69,.43,.02,0xcb9d55,.004,'toon',.4);for(let i=0;i<4;i++)box(g,2.76+i*.18,1.9,-1.33,.12,.15,.05,0xba7e37,.02);label(g,'揚げたて',3.03,2.2,-1.32,.7,.14,'#f2d89c','#725431',110);
  box(g,2.95,1.94,-2.04,.44,.54,.36,0x354a52,.02);cylinder(g,2.94,1.8,-1.82,.06,.1,0xe2d5b9);label(g,'COFFEE',2.94,2.18,-1.848,.36,.08,'#354a52','#e5cd9d',100);
  box(g,1.95,.85,-2.9,.65,.45,.65,0x9e8a68,.01);box(g,1.95,1.09,-2.9,.06,.01,.65,0xd0bc8f,0);
  // Trays of bentos and triangular rice-ball wrappers.
  box(g,-2.45,1.43,.4,1.06,.075,.44,0x293e43,.012);for(let i=0;i<4;i++){box(g,-2.83+i*.25,1.49,.4,.21,.06,.3,0xe4d9bd,.012);box(g,-2.83+i*.25,1.53,.39,.11,.035,.11,0x87a06c,.008);}
  for(let i=0;i<4;i++){const o=add(g,new T.ConeGeometry(.105,.20,3),material(0xe0d8bc),-.87+i*.24,1.52,.43);o.rotation.y=Math.PI/2;box(g,-.87+i*.24,1.46,.51,.07,.10,.012,0x3c5649,.003);}
  box(g,-3.04,1.05,-2.55,.49,.9,.64,0x617f77,.015);box(g,-3.04,1.52,-2.55,.55,.05,.7,0xd2c4a3,.01);box(g,-3.04,1.76,-2.55,.32,.43,.38,0x314953,.02);
 });
 part('glass frames and automatic door',3.3,g=>{
  const glass=new T.MeshPhysicalMaterial({color:0xb7d6cb,roughness:.16,metalness:.05,transparent:true,opacity:.075,depthWrite:false,side:T.DoubleSide});
  for(const x of [-3.38,-1.5,.45,1.58,3.9])box(g,x,2.05,1.34,.065,2.7,.09,0x425b62,.008);
  for(const [x,w] of [[-2.44,1.8],[-.52,1.88],[1.02,1.04],[2.75,2.22]]){const pane=add(g,new T.PlaneGeometry(w,2.53),glass,x,2,1.36);pane.castShadow=false;}
  for(const z of [-3.95,-2.2,-.5,1.3])box(g,3.95,2.05,z,.09,2.7,.065,0x425b62,.008);
  const side=add(g,new T.PlaneGeometry(5.15,2.53),glass,3.97,2,-1.35);side.rotation.y=Math.PI/2;side.castShadow=false;
  for(const y of [.75,3.33]){box(g,.25,y,1.35,7.4,.07,.12,0x5c7478,.008);box(g,3.95,y,-1.35,.12,.07,5.4,0x5c7478,.008);}
  // Door is deliberately offset right so the main shop window stays open to view.
  for(const x of [1.65,2.74,3.82])box(g,x,1.99,1.4,.045,2.62,.06,0x8fa8a7,.006);for(const x of [2.7,2.8])box(g,x,1.93,1.46,.025,.40,.035,0xc8c8af,.005);
  for(const x of [-2.44,-.53]){box(g,x,1.35,1.39,1.79,.10,.01,0x699d83,.002);box(g,x,1.25,1.39,1.79,.035,.01,0xc7ba79,.002);}
  label(g,'自動ドア',2.75,2.82,1.45,.48,.13,'#e3debf','#57756a',110);label(g,'いらっしゃいませ',2.73,1.37,1.45,1.7,.13,'#588a7c','#e1d5ae',100);
  box(g,2.7,.66,1.83,2.25,.065,.67,0x334f55,.02);const ribs=[];for(let i=0;i<15;i++)ribs.push([1.69+i*.145,.698,1.83]);instances(g,ribs,.025,.009,.53,0x6c8580);
  label(g,'新発売',-2.55,2.53,1.41,.58,.2,'#b96352','#f7e6b7',125);label(g,'お弁当',-2.55,2.26,1.411,.58,.32,'#e0cc98','#4a725e',140);label(g,'¥ 390',-2.55,2.0,1.413,.58,.16,'#e0cc98','#a06442',110);
  label(g,'月あかり便り',-.7,2.5,1.41,.76,.17,'#e0d6b5','#486d68',95);
 });
 part('ground floor ceiling',3.8,g=>{box(g,.25,3.35,-1.35,7.55,.16,5.5,0x767d76,.02);for(const x of [-2.1,.1,2.4]){box(g,x,3.24,-1.25,.13,.045,3.5,0xf9e0a0,.005,'basic');light(g,x,2.8,-.75,warm,11,5.7);}});
 part('illuminated shop fascia',4.1,g=>{
  box(g,.25,3.69,1.48,7.75,.72,.4,0x3c565e,.025);box(g,.25,3.69,1.697,7.56,.57,.035,0xebd6a1,.009,'basic');label(g,'まちかどマート',-.25,3.71,1.723,5.7,.50,'#ebd6a1','#263e34',225,{serif:true,tracking:.16});
  label(g,'24',3.3,3.77,1.725,.69,.36,'#263e34','#f5dfaa',230,{weight:900});label(g,'HOURS',3.3,3.49,1.725,.69,.15,'#263e34','#f5dfaa',195,{weight:700,tracking:.06});
  for(let i=0;i<3;i++)box(g,-3.43,3.87-i*.16,1.727,.14,.15,.02,[0xd47f53,0x77a779,0xd1ae66][i],.001,'basic');
  box(g,4.05,3.69,-1.31,.28,.72,5.55,0x485e61,.018);const side=label(g,'まちかどマート',4.208,3.7,-1.3,5.25,.57,'#ebd6a1','#263e34',225,{serif:true,tracking:.13});side.rotation.y=Math.PI/2;
  box(g,.25,3.36,1.78,7.8,.1,1.03,0x314f5d,.015);box(g,.25,3.29,2.25,7.8,.07,.07,0x829c9a,.008);box(g,.25,3.29,1.95,7.5,.025,.065,0xf0d6a0,.005,'basic');
  for(const x of [-3.5,4.05])rod(g,[x,.35,2.16],[x,3.31,2.16],.034,0x697e7f);
  halo(g,.2,3.68,1.95,0xffce83,6,.14);pool(g,.1,2.9,8,2.8,0xffd499,.23);light(g,.3,3.5,2.1,warm,8,6);
 });
 part('upper floor volume',4.7,g=>{
  box(g,.25,4.03,-1.4,7.42,.16,5.3,0x485c64,.02);box(g,.25,5.36,-4.03,7.42,2.6,.17,0x969fa1,.025);box(g,-3.43,5.36,-1.4,.16,2.6,5.3,0x929d9e,.025);box(g,3.94,5.36,-1.4,.16,2.6,5.3,0x9fa9a5,.025);box(g,.25,5.36,1.24,7.42,2.6,.15,0xb9b5a7,.02);
  for(const y of [4.12,6.55])box(g,.25,y,1.34,7.48,.07,.08,0x7e8a89,.006);
  for(const x of [-3.25,-.95,1.35,3.75])box(g,x,5.35,1.34,.025,2.33,.035,0x8f9994,.004);
  for(const z of [-3.6,-1.8,0])box(g,4.035,5.3,z,.018,2.3,.018,0x899894,.002);
 });
 for(let i=0;i<3;i++)part('upstairs window '+i,5.15+i*.22,g=>{
  const x=-2.15+i*2.35,lit=i!==1;box(g,x,5.45,1.35,1.66,1.58,.13,0x5d7076,.02);box(g,x,5.45,1.427,1.43,1.34,.025,lit?0xb49a65:0x2b4355,.005,'toon',lit?.32:0);
  if(lit){for(let j=0;j<8;j++)box(g,x-.62+j*.18,5.44,1.447,.11,1.25,.008,j%2?0xcbb17a:0xbfa271,.002,'toon',.12);}
  for(const xx of [x-.73,x,x+.73])box(g,xx,5.45,1.465,.04,1.39,.055,0x53656a,.006);for(const y of [4.76,5.45,6.14])box(g,x,y,1.47,1.52,.035,.055,0x617374,.005);
  box(g,x,4.72,1.48,1.8,.10,.24,0x7f8f8d,.015);if(lit)halo(g,x,5.4,1.63,0xffc779,2.4,.12);
 });
 part('upper floor pipes and condenser',5.9,g=>{
  ac(g,.77,4.44,1.64,.85);tube(g,[[1.18,4.5,1.6],[1.53,4.5,1.6],[1.53,4.14,1.6],[3.6,4.14,1.6],[3.6,3.96,1.6]],0x8b9791,.035);
  rod(g,[-3.6,.4,-3.8],[-3.6,6.7,-3.8],.047,0x516c77);for(const y of [1,3,5.2])box(g,-3.6,y,-3.8,.16,.055,.16,0x8d9c9a,.004);
  const unit=new T.Group();g.add(unit);unit.position.set(4.15,4.8,-2.7);unit.rotation.y=Math.PI/2;ac(unit,0,0,0,1.1);tube(g,[[4.14,4.9,-2.2],[4.14,4.9,-1.8],[4.14,4,-1.8]],0x7c918f,.035);
 });
 part('side and rear residential details',6.05,g=>{
 const side=new T.Group();g.add(side);side.position.set(4.04,0,-.55);side.rotation.y=Math.PI/2;
 box(side,0,5.48,0,1.55,1.42,.09,0x506670,.018);box(side,0,5.48,.053,1.34,1.23,.018,0x4b6067,.005);for(const x of [-.66,0,.66])box(side,x,5.48,.075,.035,1.25,.035,0x8b9b98,.005);for(const y of [4.86,6.10])box(side,0,y,.08,1.38,.035,.035,0x8b9b98,.005);
 const back=new T.Group();g.add(back);back.position.set(.25,0,-4.13);back.rotation.y=Math.PI;
 for(const x of [-2.1,.3,2.3]){box(back,x,5.43,0,1.4,1.24,.07,0x536a71,.015);box(back,x,5.43,.045,1.22,1.07,.018,0x3a5361,.004);box(back,x,5.43,.065,.035,1.1,.035,0x829592,.004);box(back,x,4.84,.09,1.5,.08,.18,0x74888b,.01);}
 box(back,2.3,1.53,.0,1.06,2.3,.08,0x50636b,.015);label(back,'搬入口',2.3,2.15,.06,.6,.2,'#50636b','#a5b4ab',100);box(back,2.62,1.45,.07,.035,.28,.04,0xa8b4ac,.005);
 rod(back,[-3.05,.35,.16],[-3.05,6.6,.16],.055,0x586e78);for(let y=.5;y<6.4;y+=.6)box(back,-3.05,y,.16,.19,.05,.14,0x788d8d,.004);
 });
 part('main roof and trim',6.2,g=>{
  box(g,.25,6.71,-1.4,7.8,.22,5.8,0x354958,.035);box(g,.25,6.85,-1.4,7.58,.055,5.57,0x526773,.015,'wet');
  for(let x=-3.4;x<4;x+=.3)box(g,x,6.887,-1.4,.018,.015,5.45,0x3d5360,.002);
  box(g,.25,6.95,-4.2,7.8,.2,.10,0x526773,.012);box(g,-3.59,6.95,-1.4,.10,.2,5.7,0x526773,.012);box(g,4.09,6.95,-1.4,.10,.2,5.7,0x526773,.012);
  box(g,1.9,7.06,-2.7,1.17,.33,.91,0x82918d,.025);for(let i=0;i<7;i++)box(g,1.43+i*.15,7.24,-2.7,.045,.01,.69,0x3e5760,.003);
  cylinder(g,-1.9,7.09,-2.9,.16,.45,0x718688);cylinder(g,-1.9,7.34,-2.9,.24,.055,0x465b67);
 });
 // Lower neighbor leaves an actual narrow alley visible between the buildings.
 part('alley neighbor',1.8,g=>{
  box(g,-5.72,1.9,-1.63,2.15,3.16,4.8,0x655b58,.025);box(g,-5.72,3.56,-1.63,2.3,.16,5.0,0x394c58,.03);
  const slope=Math.atan(.5/1.15);for(const side of [-1,1]){const panel=box(g,-5.75+side*.575,3.99,-1.63,1.27,.085,5.15,0x4f6168,.018,'wet');panel.rotation.z=-side*slope;}
  box(g,-5.72,1.63,.79,1.16,2.35,.08,0x344849,.015);box(g,-5.72,1.7,.84,.95,2.05,.025,0x87785e,.008);box(g,-5.72,2.06,.87,.77,1.13,.02,0xb59861,.005,'toon',.25);
  for(const x of [-6.55,-6.25,-5.2,-4.9])box(g,x,1.88,.86,.045,2.8,.065,0x958575,.006);
  for(let z=-3.9;z<.9;z+=.32)box(g,-4.62,1.8,z,.02,2.7,.022,0x857368,.002);
  box(g,-5.72,3.02,.89,1.8,.35,.09,0x4b5049,.012);label(g,'喫茶  こもれび',-5.72,3.02,.95,1.65,.28,'#4b5049','#cfbc8c',100);
  box(g,-5.72,2.76,1.15,2.35,.08,.7,0x3a5556,.012);ac(g,-4.39,1.03,-2.65,.65);
  label(g,'路地',-4.12,2.65,-2.6,.36,.6,'#5c5551','#d7c4a1',140);box(g,-4.12,2.65,-2.65,.42,.67,.11,0x3b4c50,.01);
  rod(g,[-4.72,.4,-3.7],[-4.72,3.5,-3.7],.045,0x3b5159);box(g,-4.17,.36,-1.6,.16,.07,4.6,0x2d4149,.005);
  plant(g,-6.5,.33,1.35,.27);plant(g,-4.75,.33,.9,.21);
 });
 part('vending machine',6.8,g=>{
  box(g,-3.93,1.49,1.52,.86,2.32,.74,0x9c6374,.035);box(g,-3.93,2.67,1.52,.92,.08,.79,0xc49198,.015);box(g,-4.0,1.93,1.903,.61,1.16,.025,0xabc9b6,.008,'basic');
  for(let j=0;j<3;j++){box(g,-4,1.49+j*.35,1.93,.65,.03,.05,0x5d7a7b,.003);for(let i=0;i<3;i++){cylinder(g,-4.22+i*.21,1.65+j*.35,1.96,.052,.21,productColors[(j+i)%6]);box(g,-4.22+i*.21,1.48+j*.35,1.97,.09,.025,.02,0xe7dbab,.003,'basic');}}
  box(g,-3.93,.75,1.908,.59,.23,.025,0x293f4a,.01);box(g,-3.57,1.6,1.91,.09,.28,.025,0x314951,.006);label(g,'DRINKS',-3.93,2.52,1.92,.72,.15,'#c49198','#f3dcb6',130);halo(g,-3.9,1.8,2,0xffadbf,2.1,.25);pool(g,-3.8,2.8,2.3,2.8,0xe8a1af,.22);light(g,-3.9,1.9,2.1,0xf6a1b9,5,3.5);
 });
 part('street furniture',7.1,g=>{
  for(let i=0;i<2;i++){box(g,.75+i*.58,.78,1.99,.47,.86,.5,0x7d9c91,.035);box(g,.75+i*.58,1.23,1.99,.5,.07,.52,0x3a555e,.015);box(g,.75+i*.58,1.14,2.25,.25,.12,.013,0x2b444b,.005);label(g,i?'びん':'缶',.75+i*.58,.83,2.25,.25,.17,'#7d9c91','#d5d8bd',130);}
  box(g,-2.8,.61,1.95,.63,.49,.42,0x4b6971,.025);for(let i=0;i<4;i++){const x=-3.03+i*.15;rod(g,[x,.57,1.95],[x,1.52,1.95],.022,i%2?0x7f9da3:0x3e576a);tube(g,[[x,1.5,1.95],[x,1.64,1.95],[x+.08,1.67,1.95],[x+.12,1.57,1.95]],0xb7bbb0,.014);}
  plant(g,3.7,.33,2.5,.24);plant(g,-1.8,.33,2.3,.19);
  // Sandwich board faces the viewer without covering the window.
  const board=box(g,-1.45,.83,2.5,.58,.91,.07,0x8c7959,.015);board.rotation.x=-.10;label(g,'お弁当',-1.45,1.0,2.55,.48,.18,'#dcc690','#5e674c',120);label(g,'390',-1.45,.75,2.57,.48,.24,'#dcc690','#9c5d45',150);rod(g,[-1.7,.33,2.7],[-1.7,1.26,2.44],.025,0x8c7959);rod(g,[-1.2,.33,2.7],[-1.2,1.26,2.44],.025,0x8c7959);
  // Bulletin board on the cafe side.
  box(g,-5.8,1.22,2.22,1.49,1.02,.15,0x4b5b58,.035);for(const x of [-6.4,-5.2])rod(g,[x,.33,2.22],[x,1.8,2.22],.035,0x4b5b58);label(g,'町内のお知らせ',-5.8,1.55,2.31,1.3,.17,'#aa956e','#e1d4b0',95);for(let i=0;i<3;i++)label(g,['夏祭り','回覧板','古本市'][i],-6.25+i*.45,1.15,2.31,.36,.49,['#cdbd92','#b3c6ae','#cbb1a0'][i],'#5e6556',115);
  for(const x of [-6.6,-5.1,-3.6]){rod(g,[x,.32,2.84],[x,1.12,2.84],.035,iron);rod(g,[x,1.1,2.84],[x+1.2,1.1,2.84],.027,iron);rod(g,[x,.65,2.84],[x+1.2,.65,2.84],.02,iron);}rod(g,[-2.4,.33,2.84],[-2.4,1.12,2.84],.035,iron);
 });
 part('city bicycle',7.5,g=>{
  const b=new T.Group();g.add(b);b.position.set(4.18,.35,-1.7);b.rotation.y=Math.PI/2;
  for(const x of [-.61,.61]){add(b,new T.TorusGeometry(.38,.035,7,28),material(0x1e303c),x,.4,0);add(b,new T.TorusGeometry(.33,.012,6,28),material(0x9caaa7),x,.4,0);for(let i=0;i<10;i++){const a=i*Math.PI/5;rod(b,[x,.4,0],[x+Math.cos(a)*.33,.4+Math.sin(a)*.33,0],.006,0x91a2a1);}}
  for(const [a,c]of [[[-.61,.4,0],[-.2,.94,0]],[[-.2,.94,0],[.13,.4,0]],[[.13,.4,0],[-.61,.4,0]],[[-.2,.94,0],[.45,.97,0]],[[.45,.97,0],[.13,.4,0]],[[.45,.97,0],[.61,.4,0]]])rod(b,a,c,.026,0xaba078);
  rod(b,[-.2,.8,0],[-.23,1.12,0],.02,0x96aaa8);box(b,-.23,1.13,0,.30,.07,.18,0x2c414a,.018);rod(b,[.45,.97,0],[.4,1.26,0],.02,0x96aaa8);rod(b,[.4,1.26,-.2],[.4,1.26,.2],.02,0x304751);box(b,.69,1.06,0,.3,.26,.34,0x536c74,.025);for(let i=0;i<4;i++)box(b,.57+i*.08,1.07,.18,.012,.22,.01,0x8a9d9e,0);rod(b,[.1,.4,0],[.16,0,.24],.015,0x859b9c);
 });
 part('utility poles and real wire anchors',8,g=>{
  for(const [x,z]of [[4.85,-5.8],[-5.95,5.5]]){cylinder(g,x,3.8,z,.095,7.6,0x657982);box(g,x,6.95,z,1.65,.09,.12,0x4e626b,.01);for(const dx of [-.65,0,.65]){cylinder(g,x+dx,7.12,z,.065,.26,0x9caeaa);}}
  for(let i=0;i<3;i++){const dx=(i-1)*.65;tube(g,[[4.85+dx,7.25,-5.8],[-.25+dx,6.48,-.15],[-5.95+dx,7.25,5.5]],0x172934,.02);}
  box(g,4.86,4.75,-5.8,.6,1.03,.52,0x4f6871,.035);for(let i=0;i<5;i++)box(g,4.86,4.48+i*.12,-5.52,.42,.025,.02,0x8b9c96,.003);
  // Vertical store sign, strongly readable against the dark alley.
  rod(g,[-3.55,5.9,.6],[-4.15,5.9,.6],.028,iron);box(g,-4.05,5.05,.65,.88,2.47,.24,0x3a555b,.025);box(g,-4.05,5.05,.785,.73,2.30,.02,0xe3cc90,.008,'basic');
  label(g,'24',-4.05,5.97,.808,.61,.39,'#e3cc90','#263e34',235,{weight:900});
  label(g,'まちかど',-4.05,5.08,.808,.60,1.22,'#e3cc90','#263e34',220,{vertical:true,weight:800});
  label(g,'ATM',-4.05,4.10,.808,.61,.23,'#263e34','#f2dcaa',210,{weight:800,tracking:.06});
  halo(g,-4.05,5.1,.9,0xffcd89,2.3,.12);
 });
 part('street lamps signs and corner',8.4,g=>{
  for(const [x,z,h]of [[5.5,4.4,6.15],[-6.55,1.2,4.85]]){cylinder(g,x,h/2,z,.065,h,iron);tube(g,[[x,h-.2,z],[x,h+.1,z],[x-.25,h+.16,z],[x-.65,h+.16,z]],iron,.05);box(g,x-.66,h+.1,z,.49,.11,.31,0x697d80,.018);box(g,x-.66,h+.035,z,.41,.025,.25,0xece1b5,.005,'basic');halo(g,x-.66,h-.04,z,0xffe1a1,1.7,.35);light(g,x-.66,h-.12,z,0xffdea0,20,8);pool(g,x-.45,z,3.8,3.7,0xf1d49c,.19,.07);}
  rod(g,[4.7,.04,1.65],[4.7,4.2,1.65],.045,0x57717c);box(g,4.7,3.75,1.65,1.6,.43,.08,0x365d58,.015);label(g,'月見町 三丁目',4.7,3.75,1.7,1.48,.31,'#365d58','#d7d7b5',110);
  const mirror=add(g,new T.CircleGeometry(.34,28),new T.MeshStandardMaterial({color:0x9cac9c,metalness:.8,roughness:.2}),4.7,3.05,1.71);const ring=add(g,new T.TorusGeometry(.35,.04,7,28),material(0xb48d60),4.7,3.05,1.72);label(g,'30',4.7,2.52,1.71,.4,.35,'#3f6a64','#dce0bf',150);
  for(const z of [3.35,5.8]){cylinder(g,4.25,.53,z,.06,.45,0xb1aa88);cylinder(g,4.25,.74,z,.063,.1,0x334f5d);}
  for(const z of [-.25,.5]){cylinder(g,4.85,.22,z,.13,.37,0xc59158,.027);box(g,4.85,.055,z,.36,.07,.36,0x42535c,.02);cylinder(g,4.85,.26,z,.09,.065,0xdbd5b5,.075);}
  box(g,4.14,1.0,-3.3,.42,1.27,.76,0x7e9292,.025);box(g,4.375,1.25,-3.3,.025,.14,.35,0xa7b7ad,.005);box(g,4.37,.75,-3.3,.025,.2,.35,0x48626d,.005);
 });
 return {root,parts,lights};
}

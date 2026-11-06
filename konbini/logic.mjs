export function seededRandom(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function assemblyProgress(time,delay,duration){const p=Math.max(0,Math.min(1,(time-delay)/duration));return 1-(1-p)**3;}
export function framingFov(aspect){return 360/Math.PI*Math.atan(Math.tan(36*Math.PI/360)/Math.min(1,aspect));}
export function lightingProgress(time){return assemblyProgress(time,9.65,1.55);}
export function roofHeight(x,z){
 if(x>=-3.65&&x<=4.15&&z>=-4.3&&z<=1.5)return 6.89;
 if(x>=-3.7&&x<=4.2&&z>1.5&&z<=2.3)return 3.42;
 if(x>=-6.91&&x<=-4.59&&z>=-4.21&&z<=.95)return 3.80+.5*(1-Math.min(1,Math.abs(x+5.75)/1.15));
 if(x>=-6.9&&x<=-4.54&&z>.95&&z<=1.5)return 2.81;
 return x<4.45&&z<3.05?.32:.035;
}

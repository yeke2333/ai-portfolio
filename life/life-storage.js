import {cards,places} from './content.js?v=1.5';
import {prepareCalendar} from './engine.js?v=1.5';
import {cities} from './geography.js';

export const slots=[1,2,3,4];
export const slotKey=slot=>slot===1?'life-page.save.v1':'life-page.save.v1.slot-'+slot;
export const backupLimit=2*1024*1024;

const bounded=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
const list=(value,limit,check)=>Array.isArray(value)&&value.length<=limit&&value.every(check);
const validCity=value=>bounded(value,0,cities.length-1);
const validLog=entry=>entry&&bounded(entry.age,0,110)&&typeof entry.text==='string'
  && (entry.month===undefined||bounded(entry.month,0,1320));
const validPerson=person=>person&&bounded(person.age,0,110)&&bounded(person.place,0,places.length-1)
  && typeof person.name==='string'&&person.name.trim().length>0&&person.name.length<=80
  && (person.city===undefined||validCity(person.city))&&(person.birthCity===undefined||validCity(person.birthCity))
  && (person.month===undefined||bounded(person.month,0,1320))
  && (person.family===undefined||list(person.family,12,member=>member&&typeof member.role==='string'&&bounded(member.age,0,110)))
  && person.stats&&['health','mood','skill','ties'].every(key=>Number.isFinite(person.stats[key]))
  && Number.isFinite(person.cash)
  && list(person.log,3000,validLog)&&list(person.seen,3000,id=>typeof id==='string')
  && list(person.scheduled,300,entry=>entry&&bounded(entry.age,0,120)&&typeof entry.id==='string');
const cardIds=new Set(cards.map(card=>card[1]));

function restore(value){
  const valid=[1,2].includes(value?.version)&&validPerson(value.player)
    && list(value.peers,4,validPerson)&&value.peers.length===4
    && list(value.notes,1000,item=>item&&typeof item==='object')
    && list(value.pending,50,item=>item?.kind==='reflection'||item?.kind==='decision'&&cardIds.has(item.id))
    && (value.bookmarks===undefined||list(value.bookmarks,3000,index=>bounded(index,0,value.player.log.length-1)));
  if(!valid)throw new Error('存档格式无效');
  const calendar=bounded(value.birthYear,1900,2100)&&bounded(value.player.month,0,1320)
    && list(value.months,1321,item=>item&&bounded(item.month,0,1320)&&validCity(item.city));
  if(value.version===2&&!calendar)throw new Error('月历存档无效');
  if(value.birthMonth!==undefined&&!bounded(value.birthMonth,1,12))throw new Error('出生月份无效');
  return prepareCalendar(value);
}

export function readLife(raw){
  return raw===null?null:restore(JSON.parse(raw));
}
export function packLife(life){
  return JSON.stringify({format:'life-in-pages',version:1,life},null,2);
}
export function unpackLife(raw){
  if(raw.length>backupLimit)throw new Error('备份超过 2 MB');
  const backup=JSON.parse(raw);
  if(backup?.format!=='life-in-pages'||backup.version!==1)throw new Error('备份版本无效');
  return restore(backup.life);
}

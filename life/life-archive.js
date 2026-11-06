import {cityLabel} from './geography.js';
import {monthKey} from './history.js';

export const archiveKey='life-page.completed.v1';
const archiveLimit=8;

export function completedLives(storage){
  try{
    const entries=JSON.parse(storage.getItem(archiveKey)??'[]');
    if(Array.isArray(entries))return entries.filter(entry=>entry?.archiveId&&entry.player?.ended&&Array.isArray(entry.player.log));
  }catch{}
  return [];
}

export function archiveLife(storage,run,makeId=()=>crypto.randomUUID()){
  if(!run.player.ended)return;
  run.archiveId??=makeId();
  const entries=completedLives(storage);
  if(entries.some(entry=>entry.archiveId===run.archiveId))return;
  storage.setItem(archiveKey,JSON.stringify([run,...entries].slice(0,archiveLimit)));
}

export function memoir(run){
  const {player}=run;
  const [start,end]=[0,player.month].map(month=>monthKey(run.birthYear,month,run.birthMonth));
  const decisions=player.log.filter(entry=>entry.kind==='decision');
  const moments=player.log.filter(entry=>entry.kind==='milestone');
  const locations=new Set(run.months.map(record=>record.city));
  locations.add(player.birthCity);
  return {
    start,end,
    from:cityLabel(player.birthCity),
    to:cityLabel(player.city),
    places:locations.size,
    decisions:decisions.length,
    moments:(moments.length?moments:decisions).slice(-5),
  };
}

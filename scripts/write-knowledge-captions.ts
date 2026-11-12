import { writeFileSync } from 'node:fs';
import { knowledge } from '../src/data/knowledge.ts';
const stamp=(n:number)=>`00:00:${String(n).padStart(2,'0')}.000`;
for(const item of knowledge.filter(k=>k.kind==='clip')){
  if(item.duration!==24||item.sections.length!==3)throw new Error(`Check caption timing for ${item.id}`);
  writeFileSync(new URL(`../public/media/${item.media}.vtt`,import.meta.url),'WEBVTT\n\n'+item.sections.map((s,i)=>`${i+1}\n${stamp(i*8)} --> ${stamp((i+1)*8)}\n${s.body}\n`).join('\n'));
}

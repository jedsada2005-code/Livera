import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { applyKnowledgeAction, emptyKnowledge, readKnowledgeData, filterKnowledge, annualPremiums, premiumSummaryCSV, sortKnowledge, knowledgeHref, reelForLink } from '../src/domain/knowledge.ts';
import { knowledge, checkedOn } from '../src/data/knowledge.ts';
import { createSeed } from '../src/domain/ledger.ts';
const now='2026-11-11T03:00:00Z';
const apply=(data:ReturnType<typeof emptyKnowledge>,action:Parameters<typeof applyKnowledgeAction>[1])=>applyKnowledgeAction(data,action,now);
const all={query:'',topic:'all',kind:'all',collection:'all'} as const;
test('curated content has unique IDs, HTTPS primary sources, and explicit dates for news',()=>{
  assert.equal(new Set(knowledge.map(i=>i.id)).size,knowledge.length);
  for(const item of knowledge){const u=new URL(item.sourceUrl);assert.equal(u.protocol,'https:');assert.ok(item.editorial ? u.hostname==='jedsada2005-code.github.io'&&u.pathname==='/Livera/' : ['www.bot.or.th','personal.prd.go.th'].includes(u.hostname));assert.ok(item.sections.length);if(item.topic==='government')assert.ok(item.publishedOn&&item.publishedOn<=checkedOn);if(item.kind==='clip')assert.ok(item.duration&&item.media);}
});
test('saving is idempotent, removes only the selected item, and does not mutate input',()=>{
  const seed=emptyKnowledge();const one=apply(seed,{type:'save',id:'retirement-map',saved:true});const two=apply(one,{type:'save',id:'retirement-map',saved:true});assert.deepEqual(two.saved,['retirement-map']);assert.deepEqual(seed.saved,[]);
  const three=apply(two,{type:'save',id:'money-routine',saved:true});assert.deepEqual(apply(three,{type:'save',id:'retirement-map',saved:false}).saved,['money-routine']);
});
test('unknown IDs cannot enter the library',()=>{assert.throws(()=>apply(emptyKnowledge(),{type:'save',id:'missing',saved:true}));assert.throws(()=>readKnowledgeData({...emptyKnowledge(),saved:['missing']}));});
test('opening an article does not mark it read; explicit read action is required',()=>{const d=emptyKnowledge();assert.deepEqual(d.activity,{});const r=apply(d,{type:'read',id:'retirement-map'});assert.equal(r.activity['retirement-map'].read,true);assert.throws(()=>apply(d,{type:'read',id:'clip-money'}));});
test('watch position and completion survive roundtrip and completion remains sticky',()=>{
  const d=apply(emptyKnowledge(),{type:'progress',id:'clip-money',position:7.25});assert.equal(readKnowledgeData(d).activity['clip-money'].position,7.25);
  const ended=apply(d,{type:'progress',id:'clip-money',position:24,completed:true});const replay=apply(ended,{type:'progress',id:'clip-money',position:2});assert.equal(replay.activity['clip-money'].completed,true);assert.equal(replay.activity['clip-money'].position,2);
});
test('progress rejects nonfinite, negative, wrong-kind and over-duration values',()=>{
  for(const position of [NaN,Infinity,-1,25])assert.throws(()=>apply(emptyKnowledge(),{type:'progress',id:'clip-money',position}));assert.throws(()=>apply(emptyKnowledge(),{type:'progress',id:'money-routine',position:2}));
  assert.equal(apply(emptyKnowledge(),{type:'progress',id:'clip-money',position:24.1}).activity['clip-money'].position,24);
});
test('preferences allow opting out of every topic, reject duplicates and whitelist fields',()=>{
  const d=apply(emptyKnowledge(),{type:'preferences',interests:[],newsInApp:false});assert.deepEqual(d.interests,[]);assert.equal(d.newsInApp,false);
  assert.throws(()=>apply(d,{type:'preferences',interests:['money','money'],newsInApp:true}));assert.throws(()=>readKnowledgeData({...d,interests:['medical']}));
  const safe=readKnowledgeData({...d,medicalNotes:'private',activity:{}});assert.equal(Object.hasOwn(safe,'medicalNotes'),false);
});
test('corrupt and incompatible persisted activity is rejected without silently resetting',()=>{
  for(const raw of [null,{}, {...emptyKnowledge(),version:2}, {...emptyKnowledge(),saved:['money-routine','money-routine']}, {...emptyKnowledge(),activity:[]}, {...emptyKnowledge(),activity:{'clip-money':{read:true,position:0,completed:false,updatedAt:now}}}, {...emptyKnowledge(),activity:{'money-routine':{read:false,position:1,completed:false,updatedAt:now}}}])assert.throws(()=>readKnowledgeData(raw));
});
test('filters intersect search, format, topic and saved items',()=>{
  const d=apply(emptyKnowledge(),{type:'save',id:'public-retirement-2026',saved:true});assert.equal(filterKnowledge(d,{...all,collection:'saved',topic:'government',query:'  ภาครัฐ '}).length,1);assert.equal(filterKnowledge(d,{...all,collection:'saved',kind:'clip'}).length,0);assert.equal(filterKnowledge(d,{...all,query:'not-a-match'}).length,0);assert.equal(filterKnowledge(d,{...all,kind:'clip'}).length,knowledge.filter(i=>i.kind==='clip').length);
});
test('continue excludes completed clips and articles',()=>{
  let d=apply(emptyKnowledge(),{type:'progress',id:'clip-money',position:6});d=apply(d,{type:'read',id:'money-routine'});assert.deepEqual(filterKnowledge(d,{...all,collection:'continue'}).map(i=>i.id),['clip-money']);d=apply(d,{type:'progress',id:'clip-money',position:24,completed:true});assert.equal(filterKnowledge(d,{...all,collection:'continue'}).length,0);
});
test('interests follow explicitly selected topics, including no topics',()=>{const d=apply(emptyKnowledge(),{type:'preferences',interests:['government'],newsInApp:true});assert.deepEqual(filterKnowledge(d,{...all,collection:'interests'}).map(i=>i.id),['public-retirement-2026']);assert.equal(filterKnowledge({...d,interests:[]},{...all,collection:'interests'}).length,0);});
test('annual premium summary uses paid date calendar year, excludes voids, retains partial satang',()=>{
  const seed=createSeed();const extra={...seed[0],id:'extra',paidDate:'2026-12-31',satang:12345,status:'pending' as const};const voided={...extra,id:'void',status:'voided' as const};const next={...extra,id:'next',paidDate:'2027-01-01'};const input=[...seed,extra,voided,next];
  const rows=annualPremiums(input,2026);const baseline=annualPremiums(seed,2026);assert.equal(rows[0].satang-baseline[0].satang,12345);assert.equal(rows[0].pending,1);assert.equal(annualPremiums(input,2027)[0].satang,12345);assert.throws(()=>annualPremiums(input,NaN));
});
test('CSV is a labeled demo summary and never exports notes, references or attachment names',()=>{
  const entries=createSeed().map(e=>({...e,note:'PRIVATE NOTE',reference:'PRIVATE REF',attachment:{id:'secret',name:'secret.pdf',type:'application/pdf',size:5}}));const csv=premiumSummaryCSV(entries,2026);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/ไม่ใช่หนังสือรับรองภาษี/);assert.match(csv,/2569/);assert.ok(!csv.includes('PRIVATE'));assert.ok(!csv.includes('secret'));
});

test('Round 5 records migrate additively without losing saves, progress or interests',()=>{
  const old={version:1,saved:['retirement-map'],activity:{'clip-money':{read:false,position:6,completed:false,updatedAt:now}},interests:['government'],newsInApp:false};
  const next=readKnowledgeData(old);assert.deepEqual(next.saved,old.saved);assert.deepEqual(next.activity,old.activity);assert.deepEqual(next.interests,['government']);assert.equal(next.newsInApp,false);assert.deepEqual(next.player,{muted:true,autoPlay:false});assert.equal(next.lastReelId,null);assert.equal(Object.hasOwn(old,'player'),false);
});
test('new playback preferences are validated, canonicalized and retained by member preferences',()=>{
  const d=apply(apply(emptyKnowledge(),{type:'player',muted:false,autoPlay:true}),{type:'view',id:'clip-housing'});
  const next=apply(d,{type:'preferences',interests:['living'],newsInApp:false});assert.deepEqual(readKnowledgeData(next).player,d.player);assert.equal(next.lastReelId,'clip-housing');
  assert.deepEqual(readKnowledgeData({...next,player:{...next.player,secret:'remove'}}).player,{muted:false,autoPlay:true});
  for(const player of [null,{}, {muted:'true',autoPlay:false}])assert.throws(()=>readKnowledgeData({...d,player}));
  assert.throws(()=>readKnowledgeData({...d,lastReelId:'retirement-map'}));assert.throws(()=>apply(d,{type:'view',id:'retirement-map'}));
});
test('publication sorting places undated guides after dated content, never uses check date',()=>{
  const items=knowledge.filter(k=>k.kind==='article');const before=items.map(k=>k.id);const sorted=sortKnowledge(items,emptyKnowledge(),'newest');
  assert.equal(sorted[0].publishedOn,'2026-11-12');const firstUndated=sorted.findIndex(k=>!k.publishedOn);assert.ok(firstUndated>0);assert.ok(sorted.slice(firstUndated).every(k=>!k.publishedOn));assert.deepEqual(items.map(k=>k.id),before);
});
test('recommendation prioritizes selected interests and unread content without fake engagement',()=>{
  let d=apply(emptyKnowledge(),{type:'preferences',interests:['money'],newsInApp:true});d=apply(d,{type:'read',id:'capital-and-income'});
  const sorted=sortKnowledge(knowledge,d,'recommended');assert.equal(sorted[0].topic,'money');assert.equal(sorted[0].id,'clip-money-streams');assert.ok(sorted.findIndex(k=>k.id==='capital-and-income')>0);
});
test('history sorts by actual activity; unread and continue remain distinct',()=>{
  let d=apply(emptyKnowledge(),{type:'read',id:'money-routine'});d=applyKnowledgeAction(d,{type:'progress',id:'clip-housing',position:5},'2026-11-12T03:00:00Z');
  const history=sortKnowledge(filterKnowledge(d,{...all,collection:'history'}),d,'recent');assert.deepEqual(history.map(k=>k.id),['clip-housing','money-routine']);
  assert.ok(!filterKnowledge(d,{...all,collection:'unread'}).some(k=>k.id==='money-routine'));assert.ok(filterKnowledge(d,{...all,collection:'unread'}).some(k=>k.id==='clip-housing'));assert.deepEqual(filterKnowledge(d,{...all,collection:'continue'}).map(k=>k.id),['clip-housing']);
});
test('clip deep links support old IDs, canonical URLs, latest clip and missing IDs honestly',()=>{
  const clip=knowledge.find(k=>k.id==='clip-housing')!;assert.equal(knowledgeHref(clip),'#/knowledge/reels/clip-housing');assert.equal(knowledgeHref(knowledge[0]),'#/knowledge/retirement-map');
  assert.equal(reelForLink('clip-money','',null)?.id,'clip-money');assert.equal(reelForLink('reels','clip-housing',null)?.id,'clip-housing');assert.equal(reelForLink('reels','','clip-housing')?.id,'clip-housing');assert.equal(reelForLink('reels','missing','clip-money'),undefined);
});
test('every lesson has local media, poster and three ordered eight-second caption cues',()=>{
  for(const clip of knowledge.filter(k=>k.kind==='clip')){
    for(const ext of ['mp4','webp','vtt'])assert.ok(existsSync(new URL(`../public/media/${clip.media}.${ext}`,import.meta.url)));
    const vtt=readFileSync(new URL(`../public/media/${clip.media}.vtt`,import.meta.url),'utf8');assert.ok(vtt.startsWith('WEBVTT'));assert.equal((vtt.match(/ --> /g)??[]).length,3);assert.match(vtt,/00:00:16.000 --> 00:00:24.000/);for(const section of clip.sections)assert.ok(vtt.includes(section.body));
  }
});

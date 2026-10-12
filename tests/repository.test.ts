import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { createLocalRepository, PLAN_KEY, PROFILE_KEY } from '../lib/repository.ts';
function setup(){const data=new Map<string,string>();const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};return {data,repo:createLocalRepository(()=>storage,['akihabara-electric-town','tsukiji-food-walk']),storage};}
test('save Akihabara, reload adapter, preserve plan without duplicates',async()=>{const {repo,storage}=setup();await repo.addToPlan('akihabara-electric-town');await repo.addToPlan('akihabara-electric-town');const reloaded=createLocalRepository(()=>storage,['akihabara-electric-town']);assert.equal((await reloaded.getPlan()).items.length,1);assert.equal((await reloaded.getPlan()).items[0].experienceId,'akihabara-electric-town');});
test('remove an experience without removing other saved items',async()=>{const {repo}=setup();await repo.addToPlan('akihabara-electric-town');await repo.addToPlan('tsukiji-food-walk');await repo.removeFromPlan('akihabara-electric-town');assert.deepEqual((await repo.getPlan()).items.map((i:{experienceId:string})=>i.experienceId),['tsukiji-food-walk']);});
test('unknown experience does not change storage',async()=>{const {repo,data}=setup();await assert.rejects(repo.addToPlan('missing'),/not found/);assert.equal(data.size,0);});
test('corrupt and malformed storage safely recovers',async()=>{const {repo,data}=setup();data.set(PLAN_KEY,'broken json');assert.deepEqual((await repo.getPlan()).items,[]);data.set(PLAN_KEY,JSON.stringify({items:[null,{}, {id:'bad',experienceId:'missing',addedAt:'today'}]}));assert.deepEqual((await repo.getPlan()).items,[]);data.set(PROFILE_KEY,'{}');assert.equal(await repo.getProfile(),null);});
test('storage failures are surfaced so UI cannot claim success',async()=>{const repo=createLocalRepository(()=>({getItem:()=>null,setItem:()=>{throw new Error('Quota exceeded')}}),['akihabara-electric-town']);await assert.rejects(repo.addToPlan('akihabara-electric-town'),/Quota exceeded/);});
test('onboarding profile survives a new repository instance',async()=>{const {repo,storage}=setup();const profile={id:'local-traveller',homeCityId:'london',interestIds:['gaming','food'],travelIntent:{cityId:'tokyo',status:'Probably going' as const},onboardingComplete:true};await repo.saveProfile(profile);assert.deepEqual(await createLocalRepository(()=>storage,[]).getProfile(),profile);});
test('legacy saved plans migrate into an unscheduled shortlist without losing places',async()=>{
 const {repo,data}=setup();data.set(PLAN_KEY,JSON.stringify({items:[{id:'old',experienceId:'akihabara-electric-town',addedAt:'2026-01-01'}]}));
 const plan=await repo.getPlan();assert.equal(plan.dayCount,3);assert.equal(plan.items[0].id,'old');assert.equal(plan.items[0].day,null);
});
test('day assignment and trip length survive reloading',async()=>{
 const {repo,storage}=setup();await repo.setDayCount(5);await repo.addToPlan('akihabara-electric-town',4);await repo.addToPlan('tsukiji-food-walk');await repo.setItemDay('tsukiji-food-walk',2);
 const plan=await createLocalRepository(()=>storage,['akihabara-electric-town','tsukiji-food-walk']).getPlan();assert.equal(plan.dayCount,5);assert.deepEqual(plan.items.map(i=>i.day),[4,2]);
 await repo.addToPlan('akihabara-electric-town');assert.equal((await repo.getPlan()).items[0].day,4);
});
test('removing a day returns its experiences to Saved',async()=>{
 const {repo}=setup();await repo.addToPlan('akihabara-electric-town',3);await repo.addToPlan('tsukiji-food-walk',1);await repo.setDayCount(2);
 const plan=await repo.getPlan();assert.equal(plan.items.length,2);assert.deepEqual(plan.items.map(i=>i.day),[null,1]);
});
test('reordering skips other days and persists the within-day order',async()=>{
 const data=new Map<string,string>();const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 const repo=createLocalRepository(()=>storage,['a','b','c']);await repo.addToPlan('a',1);await repo.addToPlan('b',2);await repo.addToPlan('c',1);
 await repo.moveItem('c',-1);let plan=await repo.getPlan();assert.deepEqual(plan.items.filter(i=>i.day===1).map(i=>i.experienceId),['c','a']);assert.equal(plan.items[1].experienceId,'b');
 await repo.moveItem('c',-1);await repo.moveItem('c',1);plan=await repo.getPlan();assert.deepEqual(plan.items.map(i=>i.experienceId),['a','b','c']);
 await repo.setItemDay('a',2);assert.deepEqual((await repo.getPlan()).items.filter(i=>i.day===2).map(i=>i.experienceId),['b','a']);
});
test('invalid trip edits do not overwrite the saved itinerary',async()=>{
 const {repo,data}=setup();await repo.addToPlan('akihabara-electric-town',1);const before=data.get(PLAN_KEY);
 for(const count of [0,31,1.5,NaN]) await assert.rejects(repo.setDayCount(count));
 await assert.rejects(repo.setItemDay('akihabara-electric-town',4));await assert.rejects(repo.setItemDay('missing',1));await assert.rejects(repo.addToPlan('tsukiji-food-walk',-1));
 assert.equal(data.get(PLAN_KEY),before);
});
test('malformed day data is recovered safely',async()=>{
 const {repo,data}=setup();data.set(PLAN_KEY,JSON.stringify({dayCount:900,items:[{id:'old',experienceId:'akihabara-electric-town',addedAt:'today',day:'2'}]}));const plan=await repo.getPlan();assert.equal(plan.dayCount,3);assert.equal(plan.items[0].day,null);
});
test('completion atomically marks plan complete, creates a dated passport stamp, and survives reload',async()=>{
 const {repo,storage}=setup();await repo.addToPlan('akihabara-electric-town');const stamp=await repo.completeExperience('akihabara-electric-town');
 assert.equal(stamp.evidenceStatus,'standard');assert.ok(Number.isFinite(Date.parse(stamp.completedAt)));assert.equal(stamp.cityId,'tokyo');
 const reload=createLocalRepository(()=>storage,['akihabara-electric-town']);assert.deepEqual(await reload.getStamps(),[stamp]);const plan=await reload.getPlan();assert.equal(plan.items[0].status,'completed');assert.equal(plan.items[0].completedAt,stamp.completedAt);
});
test('double-tap, refresh and re-adding a completed place cannot create duplicate stamps',async()=>{
 const {repo}=setup();await repo.addToPlan('akihabara-electric-town');const [a,b]=await Promise.all([repo.completeExperience('akihabara-electric-town'),repo.completeExperience('akihabara-electric-town')]);assert.equal(a.id,b.id);assert.equal(a.completedAt,b.completedAt);await repo.removeFromPlan('akihabara-electric-town');await repo.addToPlan('akihabara-electric-town');await repo.completeExperience('akihabara-electric-town');assert.equal((await repo.getStamps()).length,1);assert.equal((await repo.getPlan()).items[0].status,'completed');
});
test('unplanned and unknown experiences cannot be stamped',async()=>{const {repo}=setup();await assert.rejects(repo.completeExperience('akihabara-electric-town'),/plan first/);await assert.rejects(repo.completeExperience('missing'),/not found/);assert.deepEqual(await repo.getStamps(),[]);});
test('photo and reflection update the same stamp; removing photos restores standard status',async()=>{
 const {repo,storage}=setup();await repo.addToPlan('akihabara-electric-town');const stamp=await repo.completeExperience('akihabara-electric-town');const photo={id:'p1',src:'data:image/jpeg;base64,AA==',alt:'Arcade'};
 const memory={rating:5,amountSpent:0,durationMinutes:180,tip:'  Great arcades  ',coverPhoto:null,photos:[photo]};const saved=await repo.saveStampMemory(stamp.id,memory);assert.equal(saved.id,stamp.id);assert.equal(saved.completedAt,stamp.completedAt);assert.equal(saved.evidenceStatus,'photo');assert.equal(saved.coverPhoto,'p1');assert.equal(saved.tip,'Great arcades');
 const reload=createLocalRepository(()=>storage,['akihabara-electric-town']);assert.deepEqual(await reload.getStamps(),[saved]);const standard=await repo.saveStampMemory(stamp.id,{...memory,photos:[]});assert.equal(standard.coverPhoto,null);assert.equal(standard.evidenceStatus,'standard');assert.equal((await repo.getStamps()).length,1);
});
test('invalid evidence leaves an earned stamp intact',async()=>{
 const {repo}=setup();await repo.addToPlan('akihabara-electric-town');const stamp=await repo.completeExperience('akihabara-electric-town');
 for(const update of [{rating:6},{amountSpent:-2},{durationMinutes:1.5},{tip:'x'.repeat(501)},{coverPhoto:'missing'},{photos:Array.from({length:6},(_,i)=>({id:String(i),src:'data:image/jpeg;base64,AA==',alt:'test'}))},{photos:[{id:'x',src:'https://example.com/a.png',alt:'x'}]}])await assert.rejects(repo.saveStampMemory(stamp.id,{...stamp,...update}));
 assert.deepEqual(await repo.getStamps(),[stamp]);
});
test('storage failure cannot partially complete a plan or overwrite existing evidence',async()=>{
 const {repo,storage}=setup();await repo.addToPlan('akihabara-electric-town');const failing=createLocalRepository(()=>({getItem:storage.getItem,setItem:()=>{throw new Error('Quota exceeded')}}),['akihabara-electric-town']);await assert.rejects(failing.completeExperience('akihabara-electric-town'));assert.equal((await repo.getPlan()).items[0].status,'planned');assert.equal((await repo.getStamps()).length,0);
 const stamp=await repo.completeExperience('akihabara-electric-town');await assert.rejects(failing.saveStampMemory(stamp.id,{...stamp,tip:'Changed'}));assert.equal((await repo.getStamps())[0].tip,'');
});
test('five photos, replacement cover and removal persist without changing completion identity',async()=>{
 const {repo}=setup();await repo.addToPlan('akihabara-electric-town');const stamp=await repo.completeExperience('akihabara-electric-town');const photos=Array.from({length:5},(_,i)=>({id:`p${i}`,src:'data:image/jpeg;base64,AA==',alt:`Photo ${i+1}`}));
 const saved=await repo.saveStampMemory(stamp.id,{...stamp,photos,coverPhoto:'p4'});assert.equal(saved.photos.length,5);assert.equal(saved.coverPhoto,'p4');
 const replaced={id:'replacement',src:'data:image/png;base64,AA==',alt:'New cover'};const next=await repo.saveStampMemory(stamp.id,{...saved,photos:[...photos.slice(0,4),replaced],coverPhoto:replaced.id});assert.equal(next.coverPhoto,'replacement');
 const removed=await repo.saveStampMemory(stamp.id,{...next,photos:[],coverPhoto:null});assert.equal(removed.evidenceStatus,'standard');assert.equal(removed.completedAt,stamp.completedAt);
});

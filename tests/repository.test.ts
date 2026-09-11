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

import type { Profile, Plan, PlanItem, Stamp, StampMemory } from '../types';
export interface StampedRepository {
 getStamps(): Promise<Stamp[]>;
 completeExperience(experienceId: string): Promise<Stamp>;
 saveStampMemory(stampId: string, memory: StampMemory, onProgress?: (percent:number)=>void): Promise<Stamp>;
 getProfile(): Promise<Profile | null>;
 saveProfile(profile: Profile): Promise<void>;
 getPlan(): Promise<Plan>;
 addToPlan(experienceId: string, day?: number | null): Promise<Plan>;
 setItemDay(experienceId: string, day: number | null): Promise<Plan>;
 moveItem(experienceId: string, direction: -1 | 1): Promise<Plan>;
 setDayCount(count: number): Promise<Plan>;
 removeFromPlan(experienceId: string): Promise<Plan>;
}
export const PROFILE_KEY = 'stamped.profile.v1';
export const STAMPS_KEY = 'stamped.stamps.v1';
export const PLAN_KEY = 'stamped.plan.v1';
const blankPlan = (): Plan => ({id:'local-plan',profileId:'local-traveller',items:[],dayCount:3});
function isPlanItem(value: unknown): value is PlanItem {
 if (!value || typeof value !== 'object') return false;
 const item = value as Record<string, unknown>;
 return typeof item.id === 'string' && typeof item.experienceId === 'string' && typeof item.addedAt === 'string';
}
export function createLocalRepository(getStorage: () => Pick<Storage,'getItem'|'setItem'>, validExperienceIds: string[], cityByExperience: Record<string,string> = {}): StampedRepository {
 function read(key: string): unknown { const raw = getStorage().getItem(key); if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } }
 function readStamps(): Stamp[] {
  const value=read(STAMPS_KEY);
  if(!Array.isArray(value)) return [];
  return value.filter((s):s is Stamp=>!!s && typeof s==='object' && typeof s.id==='string' && s.userId==='local-traveller' && validExperienceIds.includes(s.experienceId) && typeof s.cityId==='string' && Number.isFinite(Date.parse(s.completedAt)) && Array.isArray(s.photos) && s.photos.length<=5 && s.photos.every((p:unknown)=>!!p && typeof p==='object' && typeof (p as Stamp['photos'][number]).id==='string' && typeof (p as Stamp['photos'][number]).alt==='string' && typeof (p as Stamp['photos'][number]).src==='string' && /^data:image\/(jpeg|png|webp);base64,/.test((p as Stamp['photos'][number]).src)))
   .filter((s,i,all)=>all.findIndex(other=>other.experienceId===s.experienceId)===i)
   .map(s=>({...s,rating:Number.isInteger(s.rating)&&s.rating!>=1&&s.rating!<=5?s.rating:null,amountSpent:typeof s.amountSpent==='number'&&Number.isFinite(s.amountSpent)&&s.amountSpent>=0?s.amountSpent:null,durationMinutes:Number.isInteger(s.durationMinutes)&&s.durationMinutes!>0?s.durationMinutes:null,tip:typeof s.tip==='string'?s.tip.slice(0,500):'',currency:'GBP' as const,evidenceStatus:s.photos.length?'photo' as const:'standard' as const,coverPhoto:s.photos.some(p=>p.id===s.coverPhoto)?s.coverPhoto:s.photos[0]?.id??null}));
 }
 function writeStamps(stamps:Stamp[]) {
  const payload=JSON.stringify(stamps);
  if(payload.length>3_500_000) throw new Error('Memory storage is full. Try fewer photos.');
  getStorage().setItem(STAMPS_KEY,payload);
 }
 function readPlan(): Plan {
  const value = read(PLAN_KEY) as Partial<Plan> | null;
  if (!value || !Array.isArray(value.items)) return blankPlan();
  const stamps=readStamps();
  const dayCount=Number.isInteger(value.dayCount) && value.dayCount!>=1 && value.dayCount!<=30 ? value.dayCount! : 3;
  return {...blankPlan(),dayCount,items:value.items.filter(isPlanItem).filter((item,i,all)=>validExperienceIds.includes(item.experienceId) && all.findIndex(other=>other.experienceId===item.experienceId)===i).map(item=>({...item,completedAt:stamps.find(s=>s.experienceId===item.experienceId)?.completedAt,status:stamps.some(s=>s.experienceId===item.experienceId)?'completed':'planned',day:Number.isInteger(item.day)&&item.day!>=1&&item.day!<=dayCount?item.day:null}))};
 }
 function writePlan(plan: Plan) { getStorage().setItem(PLAN_KEY,JSON.stringify(plan)); return plan; }
 function validateDay(day:number|null,plan:Plan) {
  if(day!==null&&(!Number.isInteger(day)||day<1||day>plan.dayCount)) throw new Error('Choose a valid trip day.');
 }
 return {
  async getStamps(){return readStamps();},
  async completeExperience(experienceId){
   if(!validExperienceIds.includes(experienceId)) throw new Error('Experience not found.');
   const stamps=readStamps(),existing=stamps.find(s=>s.experienceId===experienceId);
   if(existing)return existing;
   if(!readPlan().items.some(i=>i.experienceId===experienceId)) throw new Error('Add this experience to your plan first.');
   const stamp:Stamp={id:`stamp-${experienceId}`,userId:'local-traveller',experienceId,cityId:cityByExperience[experienceId]??'tokyo',completedAt:new Date().toISOString(),rating:null,amountSpent:null,currency:'GBP',durationMinutes:null,tip:'',evidenceStatus:'standard',coverPhoto:null,photos:[]};
   // One atomic write is the completion transaction. Plan status is derived from it.
   writeStamps([...stamps,stamp]);return stamp;
  },
  async saveStampMemory(stampId,memory){
   const stamps=readStamps(),index=stamps.findIndex(s=>s.id===stampId);
   if(index<0)throw new Error('Stamp not found.');
   const {rating,amountSpent,durationMinutes,tip,photos,coverPhoto}=memory;
   if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))throw new Error('Choose a rating from 1 to 5.');
   if(amountSpent!==null&&(!Number.isFinite(amountSpent)||amountSpent<0||amountSpent>1000000))throw new Error('Enter a valid amount.');
   if(durationMinutes!==null&&(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>10080))throw new Error('Enter 1–10080 minutes.');
   if(typeof tip!=='string'||tip.length>500)throw new Error('Keep your tip under 500 characters.');
   if(!Array.isArray(photos)||photos.length>5||photos.some(p=>!p||typeof p.id!=='string'||typeof p.alt!=='string'||typeof p.src!=='string'||p.src.length>250000||!/^data:image\/(jpeg|png|webp);base64,/.test(p.src))||new Set(photos.map(p=>p.id)).size!==photos.length)throw new Error('Choose up to 5 supported photos.');
   if(coverPhoto!==null&&!photos.some(p=>p.id===coverPhoto))throw new Error('Choose a cover from your photos.');
   const updated:Stamp={...stamps[index],rating,amountSpent,durationMinutes,tip:tip.trim(),photos,coverPhoto:photos.length?(coverPhoto??photos[0].id):null,evidenceStatus:photos.length?'photo':'standard'};
   stamps[index]=updated;writeStamps(stamps);return updated;
  },
  async getProfile() {
   const profile = read(PROFILE_KEY) as Partial<Profile> | null;
   if (!profile || profile.id !== 'local-traveller' || typeof profile.homeCityId !== 'string' || !Array.isArray(profile.interestIds) || !profile.interestIds.every(i=>typeof i==='string') || !profile.travelIntent || typeof profile.travelIntent.cityId!=='string' || !['Definitely going','Probably going','Thinking about it'].includes(profile.travelIntent.status) || profile.onboardingComplete!==true) return null;
   return profile as Profile;
  },
  async saveProfile(profile) { getStorage().setItem(PROFILE_KEY,JSON.stringify(profile)); },
  async getPlan() { return readPlan(); },
  async addToPlan(experienceId,day=null) {
   if (!validExperienceIds.includes(experienceId)) throw new Error('Experience not found.');
   const plan = readPlan();
   validateDay(day,plan);
   if (!plan.items.some(item=>item.experienceId===experienceId)) plan.items.push({id:`item-${experienceId}`,experienceId,addedAt:new Date().toISOString(),day});
   return writePlan(plan);
  },
  async setItemDay(experienceId,day) {
   const plan=readPlan();validateDay(day,plan);
   const item=plan.items.find(item=>item.experienceId===experienceId);
   if(!item) throw new Error('Experience not in your plan.');
   // Append to the new day while keeping the order of every other day intact.
   if(item.day!==day){plan.items=plan.items.filter(other=>other!==item);plan.items.push({...item,day});}
   return writePlan(plan);
  },
  async moveItem(experienceId,direction) {
   if(direction!==-1&&direction!==1) throw new Error('Invalid direction.');
   const plan=readPlan(),index=plan.items.findIndex(item=>item.experienceId===experienceId);
   if(index<0) throw new Error('Experience not in your plan.');
   let target=index+direction;
   while(target>=0&&target<plan.items.length&&plan.items[target].day!==plan.items[index].day) target+=direction;
   if(target>=0&&target<plan.items.length) [plan.items[index],plan.items[target]]=[plan.items[target],plan.items[index]];
   return writePlan(plan);
  },
  async setDayCount(count) {
   if(!Number.isInteger(count)||count<1||count>30) throw new Error('Trips can have 1–30 days.');
   const plan=readPlan();plan.dayCount=count;
   plan.items=plan.items.map(item=>({...item,day:item.day&&item.day>count?null:item.day}));
   return writePlan(plan);
  },
  async removeFromPlan(experienceId) { const plan=readPlan();plan.items=plan.items.filter(item=>item.experienceId!==experienceId);return writePlan(plan); }
 };
}

import type { Profile, Plan, PlanItem } from '../types';
export interface StampedRepository {
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
export const PLAN_KEY = 'stamped.plan.v1';
const blankPlan = (): Plan => ({id:'local-plan',profileId:'local-traveller',items:[],dayCount:3});
function isPlanItem(value: unknown): value is PlanItem {
 if (!value || typeof value !== 'object') return false;
 const item = value as Record<string, unknown>;
 return typeof item.id === 'string' && typeof item.experienceId === 'string' && typeof item.addedAt === 'string';
}
export function createLocalRepository(getStorage: () => Pick<Storage,'getItem'|'setItem'>, validExperienceIds: string[]): StampedRepository {
 function read(key: string): unknown { const raw = getStorage().getItem(key); if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } }
 function readPlan(): Plan {
  const value = read(PLAN_KEY) as Partial<Plan> | null;
  if (!value || !Array.isArray(value.items)) return blankPlan();
  const dayCount=Number.isInteger(value.dayCount) && value.dayCount!>=1 && value.dayCount!<=30 ? value.dayCount! : 3;
  return {...blankPlan(),dayCount,items:value.items.filter(isPlanItem).filter((item,i,all)=>validExperienceIds.includes(item.experienceId) && all.findIndex(other=>other.experienceId===item.experienceId)===i).map(item=>({...item,day:Number.isInteger(item.day)&&item.day!>=1&&item.day!<=dayCount?item.day:null}))};
 }
 function writePlan(plan: Plan) { getStorage().setItem(PLAN_KEY,JSON.stringify(plan)); return plan; }
 function validateDay(day:number|null,plan:Plan) {
  if(day!==null&&(!Number.isInteger(day)||day<1||day>plan.dayCount)) throw new Error('Choose a valid trip day.');
 }
 return {
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

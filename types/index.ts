export interface Interest { id: string; name: string }
export type TravelIntentStatus = 'Definitely going' | 'Probably going' | 'Thinking about it';
export interface TravelIntent { cityId: string; status: TravelIntentStatus }
export interface Profile { id: string; homeCityId: string; interestIds: string[]; travelIntent: TravelIntent; travelIntents?: TravelIntent[]; onboardingComplete: boolean }
export interface City { id: string; name: string; country: string; coordinates: [number, number]; experienceCount: number; categories: string[] }
export interface Experience { id: string; cityId: string; title: string; category: string; duration: string; cost: string; completedCount: number; image: string; imageAlt: string; description: string; tips: { author: string; text: string }[] }
export interface PlanItem { id: string; experienceId: string; addedAt: string; day?: number | null }
export interface Plan { id: string; profileId: string; items: PlanItem[]; dayCount: number }
export interface Itinerary { id: string; cityId: string; planItemIds: string[]; date?: string }
// Prepared for later milestones; no stamp creation in this slice.
export interface Stamp { id: string; profileId: string; experienceId: string; completedAt: string }

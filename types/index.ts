export interface Interest { id: string; name: string }
export type TravelIntentStatus = 'Definitely going' | 'Probably going' | 'Thinking about it';
export interface TravelIntent { cityId: string; status: TravelIntentStatus }
export interface Profile { id: string; homeCityId: string; interestIds: string[]; travelIntent: TravelIntent; travelIntents?: TravelIntent[]; onboardingComplete: boolean }
export interface City { id: string; name: string; country: string; coordinates: [number, number]; experienceCount: number; categories: string[] }
export interface Experience { id: string; cityId: string; title: string; category: string; duration: string; cost: string; completedCount: number; image: string; imageAlt: string; description: string; tips: { author: string; text: string }[] }
export interface PlanItem { id: string; experienceId: string; addedAt: string; day?: number | null; completedAt?: string; status?: 'planned' | 'completed' }
export interface Plan { id: string; profileId: string; items: PlanItem[]; dayCount: number }
export interface Itinerary { id: string; cityId: string; planItemIds: string[]; date?: string }
export interface StampPhoto { id: string; src: string; alt: string }
export interface Stamp {
 id: string; userId: string; experienceId: string; cityId: string; completedAt: string;
 rating: number | null; amountSpent: number | null; currency: 'GBP'; durationMinutes: number | null;
 tip: string; evidenceStatus: 'standard' | 'photo'; coverPhoto: string | null; photos: StampPhoto[];
}
export type StampMemory = Pick<Stamp, 'rating' | 'amountSpent' | 'durationMinutes' | 'tip' | 'coverPhoto' | 'photos'>;

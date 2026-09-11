export const WORLD = { width: 1140, height: 760 };
export type RegionId = 'americas' | 'europe' | 'africa' | 'asia' | 'oceania';
export interface Region { id: RegionId; color: string; paths: string[]; fills?: string[] }
export interface MapLocation { id: string; name: string; country: string; count: number; x: number; y: number; landmark: 'liberty'|'eiffel'|'pagoda'|'pyramids'|'christ'|'opera'; color: string; region: RegionId; offset?: [number, number] }
export const locations: MapLocation[] = [
 {id:'new-york',name:'New York',country:'United States',count:98,x:347.982,y:227.862,landmark:'liberty',color:'#ff46a8',region:'americas'},
 {id:'paris',name:'Paris',country:'France',count:72,x:577.057,y:203.43,landmark:'eiffel',color:'#ffe343',region:'europe',offset:[0,-52]},
 {id:'tokyo',name:'Tokyo',country:'Japan',count:126,x:989.075,y:242.931,landmark:'pagoda',color:'#ff733f',region:'asia'},
 {id:'cairo',name:'Cairo',country:'Egypt',count:24,x:663.707,y:259.867,landmark:'pyramids',color:'#ffe343',region:'africa',offset:[0,43]},
 {id:'rio',name:'Rio',country:'Brazil',count:36,x:440.481,y:418.72,landmark:'christ',color:'#32da94',region:'americas',offset:[-5,36]},
 {id:'sydney',name:'Sydney',country:'Australia',count:31,x:1023.628,y:451.606,landmark:'opera',color:'#b686fa',region:'oceania',offset:[0,42]},
];
export const regionIds:RegionId[]=['asia','europe','americas','africa','oceania'];
export const spring = { stiffness: 340, damping: 31, mass: .8 };

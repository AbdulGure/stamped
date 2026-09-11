'use client';
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { MapLocation } from '@/features/map/model';
import { spring } from '@/features/map/model';
import { BadgeArt } from './landmark-art';
/** LAYER 4 — screen-sharp SVG badges anchored to canvas coordinates. Their
 * positions follow the camera but glyph size does not raster-scale with land. */
export function LocationBadge({location,camera,size,selected,reduced,onSelect}:{location:MapLocation;camera:{x:MotionValue<number>;y:MotionValue<number>;scale:MotionValue<number>};size:{width:number;height:number};selected:boolean;reduced:boolean;onSelect:(location:MapLocation,button:HTMLButtonElement)=>void}){
 const x=useTransform(()=>camera.x.get()+location.x*camera.scale.get()-42);
 const y=useTransform(()=>camera.y.get()+location.y*camera.scale.get()-61);
 // The continuous 1 → 1.05 ramp avoids an IntersectionObserver firing on every frame.
 const emphasis=useTransform(()=>{if(reduced)return 1;const dx=camera.x.get()+location.x*camera.scale.get()-size.width/2,dy=camera.y.get()+location.y*camera.scale.get()-size.height/2;return 1+.05*Math.max(0,1-Math.hypot(dx,dy)/(Math.min(size.width,size.height)*.4));});
 const [dx,dy]=location.offset??[0,0];
 return <motion.div className="vector-pin-anchor" style={{x,y}}><svg className="pin-anchor-line" width="84" height="102" aria-hidden="true"><path d={`M42 61L${42+dx} ${61+dy}`} stroke="#273c31" strokeWidth="1" strokeDasharray="2 3"/><circle cx="42" cy="61" r="2.5" fill="#192c22" stroke="#fffcf0" strokeWidth="1"/></svg><motion.button type="button" className="vector-pin" aria-label={`${location.name}, ${location.count} experiences`} aria-haspopup="dialog" aria-expanded={selected} style={{scale:emphasis,x:dx,y:dy}} whileTap={{scale:.975}} whileHover={{scale:1.05}} transition={spring} onClick={e=>onSelect(location,e.currentTarget)}><motion.div layoutId={`landmark-${location.id}`} transition={spring} style={{opacity:selected?0:1}}><BadgeArt location={location}/></motion.div></motion.button></motion.div>;
}

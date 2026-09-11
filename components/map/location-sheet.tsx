'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { X, ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { BadgeArt } from './landmark-art';
import { spring, type MapLocation } from '@/features/map/model';
import { useSheetFocus } from '@/features/map/use-sheet-focus';
import { AddToPlan } from '@/features/plan-actions';
import { experiences } from '@/lib/data';
export function LocationSheet({location,reduced,onClose}:{location:MapLocation;reduced:boolean;onClose:()=>void}){
 const ref=useRef<HTMLElement>(null);useSheetFocus(ref,onClose);
 const tokyo=location.id==='tokyo';const experience=experiences[0];
 return <motion.div className="map-modal-root" initial="hidden" animate="visible" exit="exit">
  <motion.div className="map-sheet-backdrop" aria-hidden="true" onClick={onClose} variants={{hidden:{opacity:0},visible:{opacity:1},exit:{opacity:0}}} transition={{duration:reduced?0:.18}}/>
  <motion.section ref={ref} role="dialog" aria-modal="true" aria-labelledby="location-sheet-title" tabIndex={-1} className="location-sheet" variants={{hidden:{y:reduced?0:'100%',opacity:reduced?0:1},visible:{y:0,opacity:1},exit:{y:reduced?0:'100%',opacity:0}}} transition={reduced?{duration:0}:spring}>
   <div className="sheet-handle" aria-hidden="true"/>
   <button type="button" data-sheet-close className="sheet-close" onClick={onClose} aria-label="Close location details"><X size={21}/></button>
   <header className="location-sheet-header">
    {/* Shared element: same layoutId as Layer 4, preserving the actual SVG glyph. */}
    <motion.div layoutId={`landmark-${location.id}`} className="sheet-landmark" transition={reduced?{duration:0}:spring}><BadgeArt location={location}/></motion.div>
    <div><p className="sheet-overline">{location.country}</p><h2 id="location-sheet-title">{location.name}</h2><span className="sheet-count">{location.count} experiences · demo collection</span></div>
   </header>
   <motion.div className="sheet-content" variants={{hidden:{},visible:{transition:{staggerChildren:reduced?0:.055,delayChildren:reduced?0:.07}},exit:{}}}>
    {tokyo?<>
     <motion.div className="sheet-interests" variants={item(reduced)}>{['Gaming','Food','Fashion','Music'].map(label=><span key={label}>{label}</span>)}</motion.div>
     <motion.article className="featured-venue" variants={item(reduced)}><div className="venue-photo-wrap"><img src={experience.image} alt={experience.imageAlt} width="600" height="320" loading="lazy" decoding="async"/><span>Gaming</span></div><h3>{experience.title}</h3><p>Neon arcades, retro games, and the good kind of getting lost.</p><div className="venue-facts"><span><Clock size={16}/>2–4 hours</span><span><MapPin size={16}/>Tokyo</span><span>Free to explore</span></div></motion.article>
     <motion.div className="sheet-plan-action" variants={item(reduced)}><AddToPlan experienceId={experience.id}/></motion.div>
     <motion.div className="sheet-links" variants={item(reduced)}><Link href="/experience/akihabara-electric-town">Experience details <ArrowUpRight size={18}/></Link><Link href="/city/tokyo">Explore Tokyo <ArrowUpRight size={18}/></Link></motion.div>
    </>:<motion.div className="city-coming-next" variants={item(reduced)}><h3>One for the wish list.</h3><p>{location.name} is part of the illustrated preview. Tokyo’s first collection is ready to explore.</p><Link href="/city/tokyo">Discover Tokyo <ArrowUpRight size={18}/></Link></motion.div>}
   </motion.div>
  </motion.section>
 </motion.div>;
}
function item(reduced:boolean){return{hidden:{opacity:0,y:reduced?0:10},visible:{opacity:1,y:0,transition:reduced?{duration:0}:{...spring}},exit:{opacity:0}};}

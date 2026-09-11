'use client';
import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useTransform } from 'motion/react';
import { Plus, Minus, LocateFixed, RefreshCw } from 'lucide-react';
import { Header, BottomNav } from '@/components/ui';
import { PaperBase, LandmassLayer, AccentLayer } from '@/components/map/layers';
import { LocationBadge } from '@/components/map/location-badge';
import { LocationSheet } from '@/components/map/location-sheet';
import { useMapCamera } from './map/use-map-camera';
import { useRegions } from './map/use-regions';
import { locations, WORLD, spring, type MapLocation } from './map/model';
import './map/home-map.css';
/** STAMPED's home working surface. The raster reference is no longer rendered.
 * Four independently composited map layers are labeled below and in layers.tsx. */
export default function ExploreMap(){
 const [selected,setSelected]=useState<MapLocation|null>(null);
 const trigger=useRef<HTMLButtonElement|null>(null);
 const viewportRef=useRef<HTMLDivElement>(null);
 const camera=useMapCamera(viewportRef,!!selected);
 const strokeWidth=useTransform(camera.scale,value=>2/value);
 const {regions,failed,loading,retry}=useRegions();
 const close=useCallback(()=>setSelected(null),[]);
 const select=useCallback((location:MapLocation,button:HTMLButtonElement)=>{trigger.current=button;setSelected(location)},[]);
 return <MotionConfig reducedMotion="user" transition={spring}><LayoutGroup id="stamped-world"><main className="vector-home">
  <div className="vector-home-content" inert={selected?true:undefined}>
   <Header/>
   <h1 className="sr-only">Explore your next experience</h1>
   <div className="vector-map-viewport" ref={viewportRef} role="region" aria-label="World experience map" aria-describedby="map-instructions" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget)return;const directions:Record<string,[number,number]>={ArrowLeft:[45,0],ArrowRight:[-45,0],ArrowUp:[0,45],ArrowDown:[0,-45]};if(directions[e.key]){e.preventDefault();camera.panBy(...directions[e.key]);}else if(e.key==='+'||e.key==='='){e.preventDefault();camera.zoomBy(1.25);}else if(e.key==='-'){e.preventDefault();camera.zoomBy(.8);}else if(e.key==='Home'){e.preventDefault();camera.reset();}}}>
    {/* Layer 1: isolated, tileable, desaturated procedural paper grain. */}
    <PaperBase/>
    {/* Layer 2 + 3: an accelerated world plane containing only vector path data.
        Scale origin is explicit; compensated stroke width stays 2 CSS px. */}
    <motion.div className="vector-world-plane" style={{x:camera.x,y:camera.y,scale:camera.scale,width:WORLD.width,height:WORLD.height}} transformTemplate={({x,y,scale})=>`translate3d(${typeof x==='number'?`${x}px`:x}, ${typeof y==='number'?`${y}px`:y}, 0) scale(${scale})`}>
     <motion.svg style={{strokeWidth}} viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} width={WORLD.width} height={WORLD.height} aria-hidden="true" shapeRendering="geometricPrecision"><LandmassLayer regions={regions} reduced={camera.reduced}/><AccentLayer/></motion.svg>
    </motion.div>
    {/* Layer 4: accessible vector badges, absolutely anchored in canvas space.
        Glyphs stay screen-sized and never become a scaled bitmap snapshot. */}
    <div className="vector-badge-layer" data-map-layer="interactive">{locations.map(location=><LocationBadge key={location.id} location={location} camera={camera} size={camera.size} selected={selected?.id===location.id} reduced={camera.reduced} onSelect={select}/>)}</div>
    <div className="vector-map-controls" role="group" aria-label="Map controls">{[{label:'Zoom in',Icon:Plus,action:()=>camera.zoomBy(1.25)},{label:'Zoom out',Icon:Minus,action:()=>camera.zoomBy(.8)},{label:'Reset map',Icon:LocateFixed,action:camera.reset}].map(({label,Icon,action})=><motion.button key={label} type="button" aria-label={label} onClick={action} whileTap={{scale:.975}} whileHover={{scale:1.04}}><Icon size={19}/></motion.button>)}</div>
    <p id="map-instructions" className="map-gesture-hint">Drag or scroll to explore · pinch to zoom<span className="sr-only">. Shift + scroll pans sideways. Keyboard: arrow keys pan, plus and minus zoom, Home resets.</span></p>
    <span className="sr-only" role="status">{loading?'Loading illustrated regions':'All map regions loaded'}</span>
    {failed.length>0&&<div className="map-load-error" role="status"><span>Some regions couldn’t load.</span><button onClick={retry}><RefreshCw size={15}/>Retry</button></div>}
   </div>
   <BottomNav/>
  </div>
  {/* LayoutGroup + layoutId carry the vector pin into the sheet header.
      AnimatePresence retains the modal through its spring exit. */}
  <AnimatePresence onExitComplete={()=>trigger.current?.focus({preventScroll:true})}>{selected&&<LocationSheet key={selected.id} location={selected} reduced={camera.reduced} onClose={close}/>}</AnimatePresence>
 </main></LayoutGroup></MotionConfig>;
}

'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useSpring, useReducedMotion } from 'motion/react';
import { WORLD, spring } from './model';
import { axisBounds, clamp, constrain, coverScale, initialCamera, rubberBand, zoomAt, type Camera } from './physics';
/** Motion values mutate transforms without a React render on every gesture frame. */
export function useMapCamera(viewport:RefObject<HTMLDivElement|null>,locked:boolean){
 const [size,setSize]=useState({width:390,height:650});
 const reduced=useReducedMotion();
 const x=useSpring(0,spring),y=useSpring(0,spring),scale=useSpring(.5,spring);
 const dimensions=useRef(size);
 const minimum=()=>coverScale(dimensions.current,WORLD);
 const read=():Camera=>({x:x.get(),y:y.get(),scale:scale.get()});
 function apply(camera:Camera,immediate=false){for(const [value,next] of [[x,camera.x],[y,camera.y],[scale,camera.scale]] as const){if(immediate||reduced)value.jump(next);else value.set(next);}}
 function reset(){apply(initialCamera(dimensions.current,WORLD));}
 function zoomBy(factor:number){const v=dimensions.current;apply(constrain(zoomAt(read(),clamp(scale.get()*factor,minimum(),minimum()*3.5),{x:v.width/2,y:v.height/2}),v,WORLD));}
 function panBy(dx:number,dy:number){apply(constrain({...read(),x:x.get()+dx,y:y.get()+dy},dimensions.current,WORLD));}
 useEffect(()=>{
  const el=viewport.current;if(!el)return;
  const observer=new ResizeObserver(([entry])=>{const next={width:entry.contentRect.width,height:entry.contentRect.height};if(!next.width||!next.height)return;dimensions.current=next;setSize(next);const camera=initialCamera(next,WORLD);x.jump(camera.x);y.jump(camera.y);scale.jump(camera.scale);});observer.observe(el);return()=>observer.disconnect();
 },[viewport,x,y,scale]);
 useEffect(()=>{
  const el=viewport.current;if(!el||locked)return;
  const pointers=new Map<number,{x:number;y:number}>();
  const local=(e:{clientX:number;clientY:number})=>{const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
  const current=()=>({x:x.get(),y:y.get(),scale:scale.get()});
  const fit=()=>coverScale(dimensions.current,WORLD);
  const set=(c:Camera,direct:boolean)=>{for(const [v,n] of [[x,c.x],[y,c.y],[scale,c.scale]] as const){if(direct||reduced)v.jump(n);else v.set(n);}};
  const elastic=(c:Camera)=>{const bx=axisBounds(dimensions.current.width,WORLD.width*c.scale),by=axisBounds(dimensions.current.height,WORLD.height*c.scale);return {...c,x:rubberBand(c.x,...bx),y:rubberBand(c.y,...by)}};
  const down=(e:PointerEvent)=>{if(e.button!==0||(e.target as Element).closest('button,a'))return;pointers.set(e.pointerId,local(e));el.setPointerCapture(e.pointerId);x.jump(x.get());y.jump(y.get());scale.jump(scale.get());el.dataset.dragging='true';};
  const move=(e:PointerEvent)=>{const old=pointers.get(e.pointerId);if(!old)return;const before=[...pointers.values()];const next=local(e);pointers.set(e.pointerId,next);let camera=current();if(pointers.size===2){const after=[...pointers.values()];const distance=(p:typeof before)=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);const mid=(p:typeof before)=>({x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2});const a=mid(before),b=mid(after);camera=zoomAt(camera,clamp(camera.scale*distance(after)/Math.max(1,distance(before)),fit(),fit()*3.5),a);camera.x+=b.x-a.x;camera.y+=b.y-a.y;}else if(pointers.size===1){camera.x+=next.x-old.x;camera.y+=next.y-old.y;}set(elastic(camera),true);};
  const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);if(!pointers.size){el.dataset.dragging='false';set(constrain(current(),dimensions.current,WORLD),false);}};
  const wheel=(e:WheelEvent)=>{
   if((e.target as Element).closest('button,a'))return;
   e.preventDefault();
   const view=dimensions.current;
   const unit=e.deltaMode===1?16:e.deltaMode===2?view.height:1;
   if(e.ctrlKey||e.metaKey){
    // Trackpad pinch emits Ctrl+wheel; preserve zoom around the pointer.
    const next=zoomAt(current(),clamp(scale.get()*Math.exp(-e.deltaY*unit*.002),fit(),fit()*3.5),local(e));
    set(constrain(next,view,WORLD),false);
   }else{
    // Direct tracking avoids spring lag swallowing consecutive scroll deltas.
    const dx=(e.shiftKey&&!e.deltaX?e.deltaY:e.deltaX)*unit;
    const dy=(e.shiftKey?0:e.deltaY)*unit;
    set(constrain({...current(),x:x.get()-dx,y:y.get()-dy},view,WORLD),true);
   }
  };
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);el.addEventListener('wheel',wheel,{passive:false});
  return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('lostpointercapture',up);el.removeEventListener('wheel',wheel);pointers.clear();};
 },[viewport,locked,reduced,x,y,scale]);
 return {size,x,y,scale,reset,zoomBy,panBy,reduced:!!reduced};
}

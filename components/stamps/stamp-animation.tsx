'use client';
import { useEffect, useRef } from 'react';
import { CityStamp } from './city-stamp';
export function StampAnimation({date,onFinish}:{date:string;onFinish:()=>void}){
 const done=useRef(false);
 // Timer also completes the journey if the browser suppresses animation events.
 useEffect(()=>{const finish=()=>{if(!done.current){done.current=true;onFinish();}};const delay=window.matchMedia('(prefers-reduced-motion: reduce)').matches?150:1350;const timer=setTimeout(finish,delay);return()=>clearTimeout(timer);},[onFinish]);
 return <div className="stamp-impact-stage"><div className="stamp-impact-ring" aria-hidden="true"/><div className="stamp-impression"><CityStamp date={date}/></div><div className="stamp-tool" aria-hidden="true"><span className="stamp-handle"/><span className="stamp-block">STAMPED</span></div><p className="stamp-reward">+1 STAMP</p></div>;
}

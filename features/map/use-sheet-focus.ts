'use client';
import { useEffect, type RefObject } from 'react';
/** Modal keyboard scope and scroll lock; trigger restoration happens after exit. */
export function useSheetFocus(ref:RefObject<HTMLElement|null>,onClose:()=>void){useEffect(()=>{
 const sheet=ref.current;if(!sheet)return;
 const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 sheet.querySelector<HTMLButtonElement>('[data-sheet-close]')?.focus({preventScroll:true});
 const handle=(event:KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();onClose();}
  if(event.key!=='Tab')return;
  const controls=Array.from(sheet.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input,select,[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
  const first=controls[0],last=controls.at(-1);if(!first){event.preventDefault();sheet.focus();return;}
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 };
 sheet.addEventListener('keydown',handle);return()=>{sheet.removeEventListener('keydown',handle);document.body.style.overflow=previousOverflow;};
 },[ref,onClose]);}

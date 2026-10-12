'use client';
import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { StampPhoto } from '@/types';
import { preparePhoto } from '@/lib/photos';
export function EvidenceUploader({photos,cover,onChange,onBusy,disabled}:{photos:StampPhoto[];cover:string|null;onChange:(photos:StampPhoto[],cover:string|null)=>void;onBusy:(busy:boolean)=>void;disabled:boolean}){
 const [error,setError]=useState(''),[processing,setProcessing]=useState(false);const pending=useRef(false);
 async function upload(files:FileList|null,replace?:string){
  if(!files?.length||pending.current)return;
  const limit=replace?1:5-photos.length;if(files.length>limit){setError(`Choose ${limit} ${limit===1?'photo':'photos'} at most.`);return;}
  pending.current=true;setProcessing(true);onBusy(true);setError('');
  try{const prepared=await Promise.all(Array.from(files).map(preparePhoto));const next=replace?photos.map(p=>p.id===replace?prepared[0]:p):[...photos,...prepared];onChange(next,replace===cover?prepared[0].id:cover??next[0]?.id??null);}
  catch(err){setError(err instanceof Error?err.message:'Could not open that photo. Try another.');}
  finally{pending.current=false;setProcessing(false);onBusy(false);}
 }
 return <section className="evidence-uploader"><div className="memory-section-title"><h2>A LITTLE PROOF OF JOY.</h2><span>{photos.length}/5</span></div><p>Up to five photos. Your first becomes the cover.</p><div className="memory-photo-grid">{photos.map((photo,i)=><figure className="memory-polaroid" key={photo.id}><img src={photo.src} alt={`Memory photo ${i+1}: ${photo.alt}`}/><figcaption><button type="button" disabled={disabled||processing} aria-pressed={cover===photo.id} onClick={()=>onChange(photos,photo.id)}>{cover===photo.id?'★ Cover':'Make cover'}</button><label className="replace-photo">Replace<input disabled={disabled||processing} aria-label={`Replace photo ${i+1}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{void upload(e.target.files,photo.id);e.target.value='';}}/></label></figcaption><button className="remove-photo" type="button" disabled={disabled||processing} aria-label={`Remove photo ${i+1}`} onClick={()=>{const next=photos.filter(p=>p.id!==photo.id);onChange(next,cover===photo.id?next[0]?.id??null:cover);}}><X size={16}/></button></figure>)}</div>
  {photos.length<5&&<label className="photo-upload"><Plus size={22}/><span>{processing?'Preparing photos…':'Add photographs'}</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Add memory photographs" disabled={disabled||processing} onChange={e=>{void upload(e.target.files);e.target.value='';}}/></label>}
  {processing&&<p role="status">Making your photos ready for the scrapbook…</p>}{error&&<p className="error" role="alert">{error}</p>}
 </section>;
}

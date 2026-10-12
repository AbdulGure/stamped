import type { StampPhoto } from '@/types';
/** Downsize before persistence: localStorage is intentionally only a prototype album. */
export async function preparePhoto(file:File):Promise<StampPhoto>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose JPG, PNG or WebP photos. Convert HEIC photos to JPG first.');
 if(file.size>20*1024*1024)throw new Error('Choose photos smaller than 20 MB each.');
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;await img.decode();
  const ratio=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('This browser could not prepare your photo.');
  ctx.fillStyle='#fffaf1';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let quality=.78,src=canvas.toDataURL('image/jpeg',quality);
  while(src.length>240000&&quality>.25){quality-=.1;src=canvas.toDataURL('image/jpeg',quality);}
  if(src.length>240000)throw new Error('This photo is too detailed for local storage. Try a smaller image.');
  return {id:typeof crypto.randomUUID==='function'?crypto.randomUUID():`photo-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-')}`,src,alt:file.name.replace(/\.[^.]+$/,'').slice(0,100)||'My Tokyo memory'};
 }finally{URL.revokeObjectURL(url);}
}

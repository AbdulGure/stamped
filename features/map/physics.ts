export interface Size { width: number; height: number }
export interface Camera { x: number; y: number; scale: number }
export const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export function axisBounds(view:number,content:number):[number,number] {
 return content<=view?[(view-content)/2,(view-content)/2]:[view-content,0];
}
export function constrain(camera:Camera,view:Size,world:Size):Camera {
 const [minX,maxX]=axisBounds(view.width,world.width*camera.scale);
 const [minY,maxY]=axisBounds(view.height,world.height*camera.scale);
 return {...camera,x:clamp(camera.x,minX,maxX),y:clamp(camera.y,minY,maxY)};
}
// Overscroll never exceeds 28 CSS px; release springs back to the rigid bounds.
export function rubberBand(value:number,min:number,max:number):number {
 const bound=clamp(value,min,max),delta=value-bound;
 return bound+Math.sign(delta)*28*(1-Math.exp(-Math.abs(delta)/100));
}
export function zoomAt(camera:Camera,nextScale:number,point:{x:number;y:number}):Camera {
 return {scale:nextScale,x:point.x-(point.x-camera.x)*nextScale/camera.scale,y:point.y-(point.y-camera.y)*nextScale/camera.scale};
}

// Cover the viewport, then add breathing room for a deliberately oversized atlas.
export function coverScale(view:Size,world:Size):number {
 return Math.max(view.width/world.width,view.height/world.height);
}
export function initialCamera(view:Size,world:Size):Camera {
 const scale=coverScale(view,world)*1.15;
 return {scale,x:(view.width-world.width*scale)/2,y:(view.height-world.height*scale)/2};
}

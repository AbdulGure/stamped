import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Native Node TypeScript tests require an explicit extension.
import { axisBounds, constrain, coverScale, initialCamera, rubberBand, zoomAt } from '../features/map/physics.ts';
const world={width:760,height:920},view={width:390,height:650};
test('small canvas is centered and cannot be dragged beyond its fixed center',()=>{assert.deepEqual(axisBounds(390,300),[45,45]);const c=constrain({x:-900,y:900,scale:.4},view,world);assert.equal(c.x,(390-304)/2);assert.equal(c.y,(650-368)/2);});
test('large canvas clamps to all four edges after release',()=>{assert.deepEqual(constrain({x:100,y:-9999,scale:1},view,world),{x:0,y:-270,scale:1});assert.deepEqual(constrain({x:-9999,y:100,scale:1},view,world),{x:-370,y:0,scale:1});});
test('elastic overscroll is continuous and never exceeds 28 CSS px',()=>{assert.equal(rubberBand(0,-100,0),0);assert.equal(rubberBand(-50,-100,0),-50);for(const n of [1,50,1000,1e6]){assert.ok(rubberBand(n,-100,0)<=28);assert.ok(rubberBand(-100-n,-100,0)>=-128);}assert.ok(rubberBand(.001,-100,0)<.001);});
test('pinch focal point stays on the same canvas coordinate',()=>{const before={x:-100,y:-55,scale:.7},point={x:192,y:327};const after=zoomAt(before,1.4,point);assert.ok(Math.abs((point.x-before.x)/before.scale-(point.x-after.x)/after.scale)<1e-8);assert.ok(Math.abs((point.y-before.y)/before.scale-(point.y-after.y)/after.scale)<1e-8);});

test('minimum zoom covers portrait and landscape viewports without gutters',()=>{
 const atlas={width:1140,height:760};
 for(const viewport of [{width:390,height:650},{width:900,height:420}]){
  const scale=coverScale(viewport,atlas);
  assert.ok(atlas.width*scale>=viewport.width);
  assert.ok(atlas.height*scale>=viewport.height);
 }
});
test('starting atlas overflows both axes and centers with room to pan either way',()=>{
 const atlas={width:1140,height:760};
 for(const viewport of [{width:390,height:650},{width:900,height:420}]){
  const camera=initialCamera(viewport,atlas);
  assert.ok(camera.x<0 && camera.y<0);
  assert.deepEqual(constrain(camera,viewport,atlas),camera);
  assert.ok(Math.abs(camera.x+atlas.width*camera.scale/2-viewport.width/2)<1e-8);
  assert.ok(Math.abs(camera.y+atlas.height*camera.scale/2-viewport.height/2)<1e-8);
 }
});

"""Project Natural Earth 110m coastlines to the app's plate-carree canvas.
Usage: python3 scripts/build-collage-geography.py /path/to/ne_110m_land.geojson
Color clipping divides print panels; it does not move or rotate geography.
"""
import json, sys
from pathlib import Path
source=json.loads(Path(sys.argv[1]).read_text())
def clip(ring, bounds):
    points=ring[:-1] if ring[0]==ring[-1] else ring[:]
    for axis,bound,keep_high in [(0,bounds[0],True),(0,bounds[2],False),(1,bounds[1],True),(1,bounds[3],False)]:
        if not points:return []
        result=[];previous=points[-1]
        for current in points:
            a=previous[axis]>=bound if keep_high else previous[axis]<=bound
            b=current[axis]>=bound if keep_high else current[axis]<=bound
            if a!=b:
                t=(bound-previous[axis])/(current[axis]-previous[axis])
                result.append([previous[0]+t*(current[0]-previous[0]),previous[1]+t*(current[1]-previous[1])])
            if b:result.append(current)
            previous=current
        points=result
    return points if len(points)>=3 else []
def path(points):
    return 'M'+'L'.join(f'{30+(lon+180)*3:.2f},{80+(90-lat)*3:.2f}' for lon,lat,*_ in points)+'Z'
# Every coordinate uses the identical x/y projection, including city anchors.
panels={
 'americas':[((-180,12,-30,90),'#ff52a1'),((-180,-60,-30,12),'#2fd399')],
 'europe':[((-30,36,60,90),'#ffde43')],
 'africa':[((-30,-60,60,36),'#ff9144')],
 'asia':[((60,-10,180,90),'#719aec')],
 'oceania':[((60,-60,180,-10),'#b28aec'),((-180,-90,180,-60),'#ece9d9')],
}
polygons=[]
for feature in source['features']:
    g=feature['geometry'];polygons.extend(g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']])
for id,clips in panels.items():
    paths=[];fills=[]
    for bounds,color in clips:
        for polygon in polygons:
            rings=[clip(r,bounds) for r in polygon]
            if not rings[0]:continue
            paths.append(' '.join(path(r) for r in rings if r));fills.append(color)
    Path(f'public/map-regions/{id}.json').write_text(json.dumps({'id':id,'color':clips[0][1],'paths':paths,'fills':fills},separators=(',',':')))
print('Built five accurate coastline segments.')

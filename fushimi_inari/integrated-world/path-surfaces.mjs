import {pathWidth,isRestricted} from '../geography/geo-core.mjs';
import {pathSampler} from './spatial.mjs';
import {stairProfile,inferredTreads,mappedTreads,sampledStairAlignment} from './stair-profile.mjs?v=13';

export function makePathSurfaces(features,ground){
  const segments=[],cells=new Map(),size=16,stats={paths:0,stairWays:0,treads:0,sourceStepCounts:0,unresolvedStairProfiles:[],profileReview:[],correctedStairProfiles:[]};
  for(const path of features.paths){
    if(path.tags.tunnel==='yes'||path.tags.bridge==='yes')continue;
    const sampler=pathSampler(path.points),length=sampler.total;
    if(length<.01)continue;
    const stair=path.tags.highway==='steps',width=pathWidth(path.tags);
    const sourceCount=Number(path.tags.step_count);
    const h0=ground(...[path.points[0][0],path.points[0][2]]),last=path.points.at(-1),h1=ground(last[0],last[2]);
    const profile=stair?stairProfile(length,h0,h1,sourceCount):null;
    const mapped=stair&&profile.mapped!==null&&!profile.conflict?mappedTreads(path.points,ground,profile.mapped):null;
    if(stair&&profile.mapped!==null&&!mapped){
      profile.conflict=true;profile.unresolved=true;profile.status='inferred-count-source-dem-conflict';
    }
    const resolved=stair?(mapped??inferredTreads(sampledStairAlignment(path.points),ground)):null;
    const count=resolved?.length??(stair?profile.count:Math.ceil(length/1.5));
    if(stair){
      const maxRise=Math.max(...resolved.map(t=>t.rise)),minimumRun=Math.min(...resolved.map(t=>Math.hypot(t.b[0]-t.a[0],t.b[2]-t.a[2])));
      const reasons=[];
      if(Math.abs(h1-h0)<.1)reasons.push('ground profile cannot resolve endpoint rise');
      if(profile.conflict)reasons.push('mapped count incompatible with intermediate DEM profile');
      if(maxRise>.24)reasons.push('insufficient horizontal run for safe inferred risers');
      if(minimumRun<.18)reasons.push('tread shorter than 18 cm');
      if(reasons.length){
        profile.unresolved=true;
        stats.profileReview.push({id:path.id,source:`https://www.openstreetmap.org/${path.id}`,reasons,length,startHeight:h0,endHeight:h1,mappedCount:profile.mapped,renderedCount:count,maxRise,minimumRun,center:sampler.at(.5).point});
      }
    }
    if(stair){stats.stairWays++;stats.treads+=count;if(sourceCount>0)stats.sourceStepCounts++;}
    if(profile?.unresolved)stats.unresolvedStairProfiles.push(path.id);
    if(profile?.conflict)stats.correctedStairProfiles.push({id:path.id,sourceCount:profile.mapped,renderedCount:count,rise:profile.rise,status:profile.status});
    stats.paths++;
    const kind=isRestricted(path.tags)?'restricted':['dirt','ground','earth','unpaved','gravel'].includes(path.tags.surface)?'earth':['footway','steps','pedestrian','path'].includes(path.tags.highway)?'stone':'street';
    for(let i=0;i<count;i++){
      const tread=resolved?.[i],a=tread?.a??sampler.at(i/count).point,b=tread?.b??sampler.at((i+1)/count).point;
      let ya=ground(a[0],a[2])+.14,yb=ground(b[0],b[2])+.14;
      if(stair){
        // A single tread has one level. Endpoint levels remain tied to the DEM;
        // intermediate step geometry is inferred, never labelled measured.
        const level=h1>=h0?(i+1)/count:i/count;
        ya=yb=(tread?.level??h0+(h1-h0)*level)+.14;
      }
      const rise=stair?(tread?.rise??Math.abs(h1-h0)/count):0;
      const segment={a,b,ya,yb,width,kind,stair,rise,
        riserAt:tread?.riserAt??(stair?(h1>=h0?'a':'b'):null),
        id:path.id,profileStatus:profile?.status,distance:tread?.distance??i*length/count,handrail:stair&&path.tags.handrail==='yes'};
      segments.push(segment);
      const pad=width/2+.3;
      for(let x=Math.floor((Math.min(a[0],b[0])-pad)/size);x<=Math.floor((Math.max(a[0],b[0])+pad)/size);x++)
        for(let z=Math.floor((Math.min(a[2],b[2])-pad)/size);z<=Math.floor((Math.max(a[2],b[2])+pad)/size);z++){
          const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(segment);
        }
    }
  }
  function sample(x,z){
    let best=null;
    for(const s of cells.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)??[]){
      const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz)));
      const d=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t);
      if(d<=s.width/2+.08&&(!best||d<best.distance))best={height:s.ya+(s.yb-s.ya)*t,distance:d,segment:s};
    }
    return best;
  }
  return {segments,stats,sample,height:(x,z)=>sample(x,z)?.height??ground(x,z),
    terrainHeight(x,z){
      const road=sample(x,z),base=ground(x,z);
      // Cut a shallow roadbed so a coarse cross-slope cannot cover the treads.
      return road?Math.min(base,road.height-.22):base;
    }};
}

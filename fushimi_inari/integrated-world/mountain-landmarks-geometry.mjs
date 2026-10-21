import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Small static batches. All details share materials; no update loop, lights,
// transparency layers, network textures or per-object render callbacks.
export function stonePalette(materials){
  const stone=(materials.entryStoneMat??materials.stoneMat??new THREE.MeshStandardMaterial({color:'#a2a094'})).clone();
  stone.color.set('#b4b3a6');stone.roughness=.98;
  const shaded=stone.clone();shaded.color.set('#81877a');
  return {
    stone,shaded,
    wood:new THREE.MeshStandardMaterial({color:'#51473a',roughness:.93}),
    dark:new THREE.MeshStandardMaterial({color:'#242923',roughness:.98}),
    straw:new THREE.MeshStandardMaterial({color:'#b7a176',roughness:1,side:THREE.DoubleSide}),
    paper:new THREE.MeshStandardMaterial({color:'#e4e0d3',roughness:.97,side:THREE.DoubleSide}),
    red:new THREE.MeshStandardMaterial({color:'#b73125',roughness:.92,side:THREE.DoubleSide}),
    roof:new THREE.MeshStandardMaterial({color:'#737a70',metalness:.12,roughness:.83,side:THREE.DoubleSide}),
    floor:materials.entryStoneMat??stone,
    metal:materials.goldMat??new THREE.MeshStandardMaterial({color:'#ad9156',metalness:.45,roughness:.58})
  };
}

export function staticParts(group){
  const batches=new Map();let primitiveCount=0;
  function put(geometry,material,metricUV=true){
    if(geometry.index){const indexed=geometry;geometry=indexed.toNonIndexed();indexed.dispose();}
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    const p=geometry.attributes.position,n=geometry.attributes.normal;
    if(!geometry.attributes.uv)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(p.count*2),2));
    if(metricUV){
      const uv=geometry.attributes.uv;
      for(let i=0;i<p.count;i++){
        const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
        if(ny>=nx&&ny>=nz)uv.setXY(i,p.getX(i)/1.5,p.getZ(i)/1.5);
        else if(nx>=nz)uv.setXY(i,p.getZ(i)/1.5,p.getY(i)/1.5);
        else uv.setXY(i,p.getX(i)/1.5,p.getY(i)/1.5);
      }
    }
    if(!batches.has(material))batches.set(material,[]);
    batches.get(material).push(geometry);primitiveCount++;return geometry;
  }
  const box=(w,h,d,x,y,z,material)=>put(new THREE.BoxGeometry(w,h,d).translate(x,y,z),material);
  const beam=(a,b,r,material,topRadius=r,radialSegments=10)=>{
    const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);
    const geometry=new THREE.CylinderGeometry(topRadius,r,delta.length(),radialSegments);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
    return put(geometry.translate(...p.add(q).multiplyScalar(.5).toArray()),material);
  };
  const sheet=(vertices,material)=>{
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    return put(geometry,material);
  };
  const flush=()=>{
    let triangles=0;
    for(const [material,parts]of batches){
      const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
      if(!geometry)throw Error('Mountain landmark static batch failed');
      triangles+=geometry.attributes.position.count/3;
      const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
    }
    const result={batches:batches.size,primitives:primitiveCount,triangles};batches.clear();return result;
  };
  return {put,box,beam,sheet,flush};
}

export function curvedLintel(parts,width,height,depth,x,y,z,material,lift=.13){
  const geometry=new THREE.BoxGeometry(width,height,depth,22,1,1),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+lift*Math.pow(Math.abs(p.getX(i)/(width/2)),3));
  geometry.computeVertexNormals();parts.put(geometry.translate(x,y,z),material);
}

export function shide(parts,x,y,z,scale,material,face='z'){
  // Folded strips, with alternating overlapping paper faces rather than one
  // billboard. Geometric folds also catch light without an alpha texture.
  const outline=[[0,0],[.16,-.08],[.07,-.22],[.23,-.31],[.12,-.46],[.26,-.55],[.15,-.69]];
  for(let i=1;i<outline.length;i++){
    const a=outline[i-1],b=outline[i],w=.10,offset=i%2?.018:-.018;
    const vertex=(u,v)=>face==='z'?[x+u*scale,y+v*scale,z+offset]:[x+offset,y+v*scale,z+u*scale];
    parts.sheet([...vertex(a[0]-w/2,a[1]),...vertex(a[0]+w/2,a[1]),...vertex(b[0]-w/2,b[1]),
      ...vertex(b[0]-w/2,b[1]),...vertex(a[0]+w/2,a[1]),...vertex(b[0]+w/2,b[1])],material);
  }
}

export function stoneLantern(parts,u,v,seat,palette){
  const {stone,shaded,dark}=palette;
  parts.box(.58,.13,.58,u,seat+.065,v,stone);
  parts.box(.39,.16,.39,u,seat+.21,v,shaded);
  parts.box(.20,.71,.20,u,seat+.645,v,stone);
  parts.box(.43,.12,.43,u,seat+1.06,v,stone);
  parts.box(.36,.36,.36,u,seat+1.30,v,shaded);
  for(const side of [-1,1]){
    parts.box(.17,.21,.012,u,seat+1.30,v+side*.185,dark);
    parts.box(.012,.21,.17,u+side*.185,seat+1.30,v,dark);
  }
  parts.box(.46,.065,.46,u,seat+1.515,v,stone);
  const top=seat+1.79,eave=seat+1.55,half=.37;
  const corners=[[-half,-half],[half,-half],[half,half],[-half,half]];
  for(let i=0;i<4;i++){
    const a=corners[i],b=corners[(i+1)%4];
    parts.sheet([u+a[0],eave,v+a[1],u,top,v,u+b[0],eave,v+b[1]],stone);
  }
  parts.box(.75,.05,.75,u,eave-.025,v,stone);
  parts.put(new THREE.SphereGeometry(.09,10,6).translate(u,top+.075,v),stone);
  parts.beam([u,top+.09,v],[u,top+.20,v],.055,stone,.022);
}

export function simpleOfferingTorii(parts,x,y,z,scale,red,dark){
  for(const side of [-1,1])parts.box(.035*scale,.33*scale,.04*scale,x+side*.11*scale,y+.165*scale,z,red);
  parts.box(.31*scale,.035*scale,.05*scale,x,y+.27*scale,z,red);
  parts.box(.36*scale,.04*scale,.055*scale,x,y+.35*scale,z,dark);
  parts.box(.025*scale,.06*scale,.04*scale,x,y+.30*scale,z,red);
}

/**
 * Small original geometric interpretation of the paired rice sheaves visible
 * on Ainomine's curtain (Zen Mind Kyoto, Google Maps panorama, September 2018).
 * Both curtain halves reuse this template and the existing paper material.
 * No donor/deity lettering or photographic pixels are included.
 */
export function riceSheafCrestGeometry(radius=.205){
  const vertices=[];
  const put=(...points)=>{for(const p of points)vertices.push(p[0]*radius,p[1]*radius,0);};
  const ribbon=(points,width)=>{
    const normal=points.map((p,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
      return [-dy/length*width/2,dx/length*width/2];
    });
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],na=normal[i-1],nb=normal[i];
      const al=[a[0]+na[0],a[1]+na[1]],ar=[a[0]-na[0],a[1]-na[1]],bl=[b[0]+nb[0],b[1]+nb[1]],br=[b[0]-nb[0],b[1]-nb[1]];
      put(al,ar,bl,bl,ar,br);
    }
  };
  const bezier=(a,b,c,d)=>Array.from({length:10},(_,i)=>{
    const t=i/9,u=1-t;
    return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];
  });
  for(const side of [-1,1]){
    const outline=[[.055,.96],[.35,.94],[.68,.77],[.90,.48],[.98,.06],[.88,-.38],[.55,-.73],[.16,-.86]];
    for(const scale of [1,.89])ribbon(outline.map(([x,y])=>[x*side*scale,y*scale]),.038);
    for(let i=0;i<4;i++)ribbon(bezier([side*.10,-.84],[side*(.18+i*.06),-.68],
      [side*(.98-i*.11),-.30],[side*(.76-i*.13),.38+i*.12]),.026);
    for(const r of [.53,.69])for(let i=0;i<7;i++){
      const theta=.20+i*.17,x=side*r*Math.sin(theta),y=.12+r*Math.cos(theta),angle=side*(.25+theta*.8),c=Math.cos(angle),s=Math.sin(angle);
      const grain=[[0,-.075],[.040,0],[.025,.055],[0,.09],[-.025,.055],[-.040,0]]
        .map(([u,v])=>[x+u*c-v*s,y+u*s+v*c]);
      for(let j=1;j<grain.length-1;j++)put(grain[0],grain[j],grain[j+1]);
    }
  }
  ribbon(Array.from({length:12},(_,i)=>{
    const t=-2.3+i*4.6/11;return [Math.sin(t)*.31,-.42+Math.cos(t)*.31];
  }),.045);
  put([-.17,-.88],[.17,-.88],[-.17,-.80],[-.17,-.80],[.17,-.88],[.17,-.80]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  return geometry;
}

import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Hand tool rests on its ink plate at local y=0. The caller animates the
// entire tool, keeping its plate in contact with the commemorative paper.
export function createStampHandleGeometry(){
 const profile=[[0,.009],[.017,.009],[.014,.025],[.012,.045],[.017,.071],[.027,.091],[.028,.11],[.020,.127],[0,.132]];
 const handle=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),14).toNonIndexed();
 const plate=new THREE.BoxGeometry(.065,.009,.065).translate(0,.0045,0).toNonIndexed();
 const colors=geometry=>{const color=new Float32Array(geometry.attributes.position.count*3);const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const bottom=p.getY(i)<.0095,tint=new THREE.Color(bottom?'#372e2b':'#865439');tint.multiplyScalar(1+.035*Math.sin(p.getY(i)*420));color.set([tint.r,tint.g,tint.b],i*3);}geometry.setAttribute('color',new THREE.BufferAttribute(color,3));};
 colors(handle);colors(plate);const merged=mergeGeometries([plate,handle]);plate.dispose();handle.dispose();return merged;
}

export function createCommemorativeInkGeometry(){
 const pieces=[],line=(x,z,w,d)=>pieces.push(new THREE.PlaneGeometry(w,d).rotateX(-Math.PI/2).translate(x,0,z));
 // A carved border has deliberate small breaks, rather than a filled red box.
 for(const side of [-1,1]){line(side*.030,0,.002,.056);line(-.003,side*.029,.052,.002);}
 line(0,-.014,.039,.003);line(0,-.008,.032,.0025);
 for(const side of [-1,1]){line(side*.011,.004,.003,.025);line(side*.018,-.013,.003,.009);}
 line(0,0,.023,.0025);line(.006,.020,.020,.002);line(-.019,.018,.004,.008);
 const merged=mergeGeometries(pieces);pieces.forEach(p=>p.dispose());return merged;
}

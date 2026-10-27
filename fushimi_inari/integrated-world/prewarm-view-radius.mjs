import {Vector3,WebGPUCoordinateSystem} from 'three';
// The far plane is axial, not a radial distance. Its four corners bound the
// complete perspective frustum, including wide views and photo-mode zoom.
export function prewarmViewRadius(camera){
 const point=new Vector3();let radiusSq=0;
 const farDepth=camera.reversedDepth?(camera.coordinateSystem===WebGPUCoordinateSystem?0:-1):1;
 for(const x of [-1,1])for(const y of [-1,1])radiusSq=Math.max(radiusSq,point.set(x,y,farDepth).applyMatrix4(camera.projectionMatrixInverse).lengthSq());
 return Math.sqrt(radiusSq);
}

import {float,materialColor,positionWorld,sin,smoothstep,uniform} from 'three/tsl';

export const CLOUD_SHADE_MAX=.10;

// Approximate projected cloud shade on terrain only. World coordinates keep the
// broad, soft patches fixed to the land as the camera moves; two travelling
// waves break up their edges. This does not change lights or other materials.
export function attachCloudShade(material){
  const elapsed=uniform(0),strength=uniform(CLOUD_SHADE_MAX);
  const x=positionWorld.x.mul(.017).add(elapsed.mul(.010));
  const z=positionWorld.z.mul(.023).add(elapsed.mul(.006));
  const bank=sin(x).mul(sin(z)).mul(.5).add(.5);
  const detail=sin(x.mul(1.9).add(z.mul(.7))).mul(.09);
  const coverage=smoothstep(.57,.88,bank.add(detail));
  material.colorNode=(material.colorNode??materialColor).rgb.mul(float(1).sub(coverage.mul(strength)));
  return {update(seconds,mode){
    elapsed.value=Number.isFinite(seconds)?seconds:0;
    strength.value=mode==='night'?0:CLOUD_SHADE_MAX;
  }};
}

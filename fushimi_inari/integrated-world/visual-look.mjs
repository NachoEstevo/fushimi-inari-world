export function normalizeVisualLook(value){
 if(value==='dreamcore')return 'soft-light';
 return value==='sakura'||value==='soft-light'||value==='aozora'?value:'natural';
}

// Keep one post graph; look changes only update its existing bloom uniforms.
export const LOOK_BLOOM=Object.freeze({
 natural:Object.freeze({strength:.12,radius:.35,threshold:1.2}),
 sakura:Object.freeze({strength:.30,radius:.5,threshold:1.05}),
 'soft-light':Object.freeze({strength:.36,radius:.68,threshold:1.05}),
 aozora:Object.freeze({strength:.20,radius:.42,threshold:1.15})
});

// Linear-light grading shares the existing output pass and stable uniforms.
export const LOOK_GRADE=Object.freeze({
 natural:Object.freeze({saturation:1,tint:Object.freeze([1,1,1])}),
 sakura:Object.freeze({saturation:1.06,tint:Object.freeze([1.015,1,1.02])}),
 'soft-light':Object.freeze({saturation:1,tint:Object.freeze([1,1,1])}),
 aozora:Object.freeze({saturation:1.10,tint:Object.freeze([.985,1.01,1.035])})
});

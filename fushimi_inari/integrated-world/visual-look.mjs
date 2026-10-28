export function normalizeVisualLook(value){
 if(value==='dreamcore')return 'soft-light';
 return value==='sakura'||value==='soft-light'?value:'natural';
}

// Keep one post graph; look changes only update its existing bloom uniforms.
export const LOOK_BLOOM=Object.freeze({
 natural:Object.freeze({strength:.12,radius:.35,threshold:1.2}),
 sakura:Object.freeze({strength:.30,radius:.5,threshold:1.05}),
 'soft-light':Object.freeze({strength:.36,radius:.68,threshold:1.05})
});

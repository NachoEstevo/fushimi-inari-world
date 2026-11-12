// Inspection diagnostics on <body data-*> exist only under explicit audit URLs.
// Ordinary visits neither serialize nor write them; audit tools read the same keys.
export const AUDIT_PARAMS=Object.freeze(['audit','textureAudit','loadAudit','gpuAudit','pipelineAudit','shadowAudit','shaftAudit','frameAudit','debugCamera','showcase']);
export function auditRequested(search=''){
  const query=new URLSearchParams(search);
  return AUDIT_PARAMS.some(name=>query.has(name)&&query.get(name)!=='0');
}
export function createTelemetry({enabled=false,target=()=>globalThis.document?.body?.dataset}={}){
  const write=(key,text)=>{const dataset=enabled?target():null;if(dataset)dataset[key]=text;};
  return {
    enabled,
    // Values are serialized only while auditing. Guard costly report objects
    // with telemetry.enabled at the call site so ordinary visits skip them.
    report(key,value){if(enabled)write(key,JSON.stringify(value));},
    // Plain strings/numbers keep their existing unquoted attribute form.
    text(key,value){if(enabled)write(key,String(value));}
  };
}
export const telemetry=createTelemetry({enabled:auditRequested(globalThis.location?.search??'')});

// Only generated, content-addressed precinct PNGs participate. Cache source
// promises, not material textures: each parser owns sampler and color-space state.
const sources=new Map();
export function sharePrecinctImageSources(parser){
 const load=parser.loadImageSource.bind(parser);
 parser.loadImageSource=(index,loader)=>{
  const image=parser.json.images[index],uri=image.uri;
  if(!/^\.\.\/assets\/textures\/precinct-shared\/[a-f0-9]{64}\.png$/.test(uri??''))return load(index,loader);
  const key=new URL(uri,parser.options.path).href;
  let source=sources.get(key);
  if(!source){source=load(index,loader);sources.set(key,source);source.catch(()=>{if(sources.get(key)===source)sources.delete(key);});}
  return source.then(texture=>texture.clone());
 };
 return {name:'PrecinctSharedImageSources'};
}

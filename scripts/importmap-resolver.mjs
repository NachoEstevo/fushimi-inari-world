// Emulates the browser's import-map resolution for the static build, so the
// bundle loads exactly the files the unbundled page loads in development.
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Origin used only to compute URLs; nothing is fetched from it.
export const SITE_ORIGIN='https://site.invalid/';

export function readImportMap(html){
  const blocks=[...html.matchAll(/<script\s+type=["']importmap["']\s*>([\s\S]*?)<\/script>/gi)];
  if(blocks.length>1)throw Error('More than one import map');
  if(!blocks.length)return {imports:{}};
  const map=JSON.parse(blocks[0][1]);
  if(map.scopes&&Object.keys(map.scopes).length)throw Error('Import map scopes are not supported by the static build');
  return map;
}

export function stripImportMap(html){
  return html.replace(/[ \t]*<script\s+type=["']importmap["']\s*>[\s\S]*?<\/script>\n?/gi,'');
}

const urlLike=specifier=>/^(\/|\.\/|\.\.\/)/.test(specifier);
function parseUrlLike(specifier,base){
  if(urlLike(specifier))return new URL(specifier,base);
  try{return new URL(specifier);}catch{return null;}
}

/**
 * @param {object} options
 * @param {object} options.importMap parsed import map
 * @param {string} options.documentUrl URL of the page that declares the map
 * @param {{url:string,dir:string}[]} options.roots URL prefixes and the local directory that serves each one
 */
export function createImportMapResolver({importMap,documentUrl,roots}){
  const imports=[];
  for(const [key,value] of Object.entries(importMap.imports??{})){
    const normalizedKey=parseUrlLike(key,documentUrl)?.href??key;
    imports.push([normalizedKey,new URL(value,documentUrl)]);
  }
  // Spec: longest (code-unit descending) key wins among prefix matches.
  imports.sort((a,b)=>a[0]<b[0]?1:a[0]>b[0]?-1:0);
  const sortedRoots=[...roots].sort((a,b)=>b.url.length-a.url.length);

  function resolveUrl(specifier,referrerUrl){
    const asURL=parseUrlLike(specifier,referrerUrl);
    const normalized=asURL?.href??specifier;
    for(const [key,target] of imports){
      if(key===normalized)return {url:target.href,mapped:true};
      if(key.endsWith('/')&&normalized.startsWith(key))return {url:new URL(normalized.slice(key.length),target).href,mapped:true};
    }
    if(!asURL)throw Error(`Bare specifier "${specifier}" is not in the import map (from ${referrerUrl})`);
    return {url:asURL.href,mapped:false};
  }
  function urlToFile(url){
    const u=new URL(url);u.search='';u.hash='';
    const clean=u.href;
    for(const root of sortedRoots)if(clean.startsWith(root.url))return path.join(root.dir,...decodeURIComponent(clean.slice(root.url.length)).split('/'));
    throw Error(`No local source for ${url}`);
  }
  function fileToUrl(file){
    const fileHref=pathToFileURL(file).href;
    for(const root of sortedRoots){
      const dirHref=pathToFileURL(root.dir).href.replace(/\/?$/,'/');
      if(fileHref.startsWith(dirHref))return root.url+fileHref.slice(dirHref.length);
    }
    throw Error(`File outside every known root: ${file}`);
  }
  return {resolveUrl,urlToFile,fileToUrl,
    resolve(specifier,referrerUrl){const r=resolveUrl(specifier,referrerUrl);return {...r,file:urlToFile(r.url)};}};
}

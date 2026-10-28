import {createZenCat} from './zen-cat.mjs';
import {createZenTeaTable} from './zen-tea-table.mjs';
import {createZenPaperMoments} from './zen-paper-moments.mjs';
import {createZenStoryPeople} from './zen-story-people.mjs';

// All construction happens before the viewer's preparation snapshot. Update
// uses a fixed list of owners; no scene traversal, requests or mesh creation.
export function createZenWorldMoments({scene,camera,assembly,shop,visitors,journey,loadCatAsset,onAction=()=>{},onSeat=()=>{},onReturn=()=>{},document:doc=globalThis.document}){
 const existing=assembly.root.userData.zenWorldMoments;if(existing)return existing;
 let disposed=false;
 const tea=createZenTeaTable({assembly,shop,camera,onAction,onSeat,document:doc});
 const cat=createZenCat({assembly,camera,journey,onAction,loadAsset:loadCatAsset});
 const paper=createZenPaperMoments({assembly,camera,journey,onAction,document:doc});
 const people=createZenStoryPeople({assembly,camera,visitors,journey,onAction,document:doc});
 const owners=[tea,cat,paper,people],interactionRoots=owners.flatMap(owner=>owner.interactionRoots);
 const stats={tea:tea.stats,cat:cat.stats,paper:paper.stats,people:people.stats,interactionRoots:interactionRoots.length,extraLights:0,get loadedModels(){return people.stats.loadedModels+cat.stats.loadedModels;}};
 const style=doc?.createElement?.('link');if(style){style.rel='stylesheet';style.href=new URL('./zen-world-moments.css',import.meta.url).href;doc.head.append(style);}
 const runtime={interactionRoots,stats,ready:Promise.all([people.ready,cat.ready]),get active(){return paper.active||people.active;},setSeated:value=>tea.setSeated(value),performTeaAction:()=>tea.performTeaAction(),
  update(dt,time,state={}){if(disposed)return;for(const owner of owners)owner.update(dt,time,state);},
  dispose(){if(disposed)return;disposed=true;for(const owner of owners)owner.dispose();style?.remove();if(assembly.root.userData.zenWorldMoments===runtime)delete assembly.root.userData.zenWorldMoments;}
 };
 assembly.root.userData.zenWorldMoments=runtime;return runtime;
}

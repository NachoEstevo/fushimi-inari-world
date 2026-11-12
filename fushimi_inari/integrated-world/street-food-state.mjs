export const STREET_FOOD_MENUS=Object.freeze({
 senbei:Object.freeze([{id:'fox-senbei',name:'Fox senbei'}]),
 'soft-serve':Object.freeze([{id:'tofu',name:'Tofu soft serve'},{id:'matcha',name:'Matcha soft serve'}]),
 grill:Object.freeze([{id:'dango',name:'Grilled dango'}])
});
export function createStreetFoodOrder(kind){
 const menu=STREET_FOOD_MENUS[kind]??[];let phase='ready',item=null,elapsed=0,collected=0;
 return {menu,get phase(){return phase;},get item(){return item;},get elapsed(){return elapsed;},get collected(){return collected;},
  order(id){const next=menu.find(value=>value.id===id);if(phase!=='ready'||!next)return false;item=next;elapsed=0;phase='preparing';return true;},
  update(dt,{paused=false}={}){if(paused||phase!=='preparing'||!Number.isFinite(dt)||dt<=0)return;elapsed=Math.min(1.1,elapsed+Math.min(.1,dt));if(elapsed>=1.1-1e-9)phase='served';},
  collect(){if(phase!=='served')return null;const value=item;item=null;phase='ready';elapsed=0;collected++;return value;}
 };
}

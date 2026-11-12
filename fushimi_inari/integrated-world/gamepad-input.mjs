// Standard-mapping gamepad input for the walker. Polling happens only when the
// caller asks and a pad has announced itself; results reuse one state object.
export const GAMEPAD_DEAD_ZONE=.15,GAMEPAD_LOOK_EXPONENT=1.7,GAMEPAD_LOOK_RADIANS=2.2;
// Standard mapping: 0 A/Cross, 1 B/Circle, 4/5 shoulders, 6/7 triggers, 9 Start/Options, 10 L3.
export const GAMEPAD_BUTTONS={interact:0,back:1,menu:9,sprint:[4,5,6,7,10]};

// Radial dead zone, rescaled so motion starts smoothly from zero, then a power
// curve so small deflections allow fine control. Writes into `out`.
export function stickResponse(x,y,deadZone=GAMEPAD_DEAD_ZONE,exponent=1,out={x:0,y:0}){
  x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;
  const length=Math.hypot(x,y);
  if(length<=deadZone){out.x=0;out.y=0;return out;}
  const magnitude=Math.pow(Math.min(1,(length-deadZone)/(1-deadZone)),exponent),scale=magnitude/length;
  out.x=x*scale;out.y=y*scale;return out;
}
const pressed=(pad,index)=>{const b=pad.buttons?.[index];return !!b&&(b.pressed||b.value>.5);};

export function createGamepadInput({getGamepads=()=>globalThis.navigator?.getGamepads?.()??null,events=globalThis}={}){
  let connected=0,primed=false,previousInteract=false,previousMenu=false,previousBack=false;
  const move={x:0,y:0},look={x:0,y:0};
  const state={connected:false,moveX:0,moveY:0,lookX:0,lookY:0,sprint:false,interact:false,menu:false,back:false};
  function clear(){state.moveX=state.moveY=state.lookX=state.lookY=0;state.sprint=state.interact=state.menu=state.back=false;}
  events?.addEventListener?.('gamepadconnected',()=>{connected++;});
  events?.addEventListener?.('gamepaddisconnected',()=>{connected=Math.max(0,connected-1);if(!connected){clear();primed=false;}});
  function firstPad(){
    let pads;try{pads=getGamepads();}catch{return null;}
    if(!pads)return null;
    for(let i=0;i<pads.length;i++){const pad=pads[i];if(pad&&pad.connected!==false)return pad;}
    return null;
  }
  return {
    state,
    get connected(){return connected>0;},
    // The next poll records held buttons without reporting presses, so a Start
    // press that opened the menu cannot immediately close it or retrigger.
    reset(){primed=false;clear();},
    poll(){
      clear();state.connected=connected>0;
      if(!state.connected)return state;
      const pad=firstPad();
      if(!pad){state.connected=false;return state;}
      const axes=pad.axes??[];
      stickResponse(axes[0],axes[1],GAMEPAD_DEAD_ZONE,1,move);stickResponse(axes[2],axes[3],GAMEPAD_DEAD_ZONE,GAMEPAD_LOOK_EXPONENT,look);
      state.moveX=move.x;state.moveY=move.y;state.lookX=look.x;state.lookY=look.y;
      for(let i=0;i<GAMEPAD_BUTTONS.sprint.length;i++)if(pressed(pad,GAMEPAD_BUTTONS.sprint[i])){state.sprint=true;break;}
      const interact=pressed(pad,GAMEPAD_BUTTONS.interact),menu=pressed(pad,GAMEPAD_BUTTONS.menu),back=pressed(pad,GAMEPAD_BUTTONS.back);
      if(primed){state.interact=interact&&!previousInteract;state.menu=menu&&!previousMenu;state.back=back&&!previousBack;}
      previousInteract=interact;previousMenu=menu;previousBack=back;primed=true;
      return state;
    }
  };
}

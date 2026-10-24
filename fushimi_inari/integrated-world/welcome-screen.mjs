// The welcome sheet is static HTML so it appears before the scene modules load.
// Its Enter button is the user gesture that lets sound start on by default.
export function installWelcomeScreen({skip=new URLSearchParams(location.search).get('intro')==='0'}={}){
  const root=document.getElementById('welcome'),enter=document.getElementById('welcome-enter');
  function close(){
    document.body.classList.remove('welcome-open');
    root.classList.add('leaving');
    const remove=()=>root.remove();
    root.addEventListener('transitionend',remove,{once:true});setTimeout(remove,900);
  }
  return {
    // Resolves with {gesture:true} after Enter, or {gesture:false} when ?intro=0 skips it.
    ready(){
      root.classList.add('ready');
      if(skip){close();return Promise.resolve({gesture:false});}
      enter.hidden=false;enter.focus({preventScroll:true});
      return new Promise(resolve=>{enter.onclick=()=>{enter.disabled=true;resolve({gesture:true});close();};});
    }
  };
}

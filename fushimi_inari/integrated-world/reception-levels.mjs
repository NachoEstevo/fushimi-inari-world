// Reception spans the lower court and the upper Naihaiden terrace.
// Keep the goshuin wing at the original datum; seat the eastern body at the
// highest final ground sample, with a continuous solid foundation below it.
export function receptionLevels(a,yaw,ground){
 const c=Math.cos(yaw),s=Math.sin(yaw),sample=(x,z)=>ground(a[0]+c*x+s*z,a[2]-s*x+c*z);
 const base=sample(0,0),upper=Math.max(...[12,20,29.32].flatMap(x=>[0,3.9,7.8].map(z=>sample(x,z))));
 const rise=Math.max(0,upper-base);
 if(!Number.isFinite(rise))throw Error('Invalid reception terrace level');
 return {base,rise,split:11.6};
}

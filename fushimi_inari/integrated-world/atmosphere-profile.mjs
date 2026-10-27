// One world-space sun direction keeps the visible disc, lighting and projected
// canopy shade aligned. Gold is 3.49 degrees above the horizontal plane.
export const SUN_DIRECTIONS=Object.freeze({
 day:Object.freeze([-45,65,35]),
 gold:Object.freeze([-65,4.5,35]),
 night:Object.freeze([-45,65,35])
});

export const GOLDEN_ATMOSPHERE=Object.freeze({
 light:0xff8a55,sky:0xe4ac8e,ground:0x735047,disc:'#ff623b',horizon:'#e99568',
 skyPalette:Object.freeze(['#6b6688','#d58c75','#e99568','#ffce9e','#a16f7e'])
});

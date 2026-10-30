// One world-space sun direction keeps the visible disc, lighting and projected
// canopy shade aligned. Gold is 3.49 degrees above the horizontal plane.
export const SUN_DIRECTIONS=Object.freeze({
 day:Object.freeze([-45,65,35]),
 gold:Object.freeze([-65,4.5,35]),
 night:Object.freeze([-45,65,35])
});

export const GOLDEN_ATMOSPHERE=Object.freeze({
 light:0xff9662,sky:0x9daecf,ground:0x65555b,disc:'#ff623b',horizon:'#ec9a74',
 skyPalette:Object.freeze(['#555e9d','#b17d9f','#ec9a74','#ffe5b9','#937b9b'])
});

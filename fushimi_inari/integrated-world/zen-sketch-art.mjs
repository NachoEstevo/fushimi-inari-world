// Journal illustrations are fetched only when an earned sketch is opened.
// Keep the original observational titles available to assistive technology.
const artwork=(id,title,description,file)=>`<svg viewBox="0 0 640 400" role="img" aria-labelledby="zen-ink-${id}-title zen-ink-${id}-desc" xmlns="http://www.w3.org/2000/svg"><title id="zen-ink-${id}-title">${title}</title><desc id="zen-ink-${id}-desc">An authored ink drawing: ${description}</desc><image href="${new URL('../assets/illustrations/sketches/'+file+'.webp',import.meta.url).href}" x="0" y="0" width="640" height="400" preserveAspectRatio="xMidYMid meet"/></svg>`;
export const ZEN_SKETCH_ART=Object.freeze({
 'sketch-canal':artwork('canal','Two banks, one ribbon','a narrow Kyoto canal, weathered stone retaining walls, modest railings, tiled eaves and pale reflections, observed in ink and translucent watercolor.','canal'),
 'sketch-gates':artwork('gates','The space between','curved vermilion torii, black bases and a stone passage receding through forest light, with broken ink lines and warm watercolor washes.','gates'),
 'sketch-city':artwork('city','A city in layers','Kyoto rooftops fading into layers of hills from a wooded mountain lookout, with a weathered foreground railing and open luminous sky.','city')
});

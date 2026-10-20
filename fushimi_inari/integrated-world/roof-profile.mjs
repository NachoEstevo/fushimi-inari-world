// Inferred silhouette, not measured roof dimensions. Normalized ridge to eave.
export function roofHeight(t,rise){
  const u=Math.min(1,Math.abs(t));
  return rise*(1-u)+rise*.28*u**5;
}

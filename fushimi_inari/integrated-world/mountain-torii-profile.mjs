// Reference-informed size cohorts, not a survey or a monotonic altitude rule.
export function mountainToriiProfile(section,index){
  const cohort=(Math.floor(index/7)*5+section*3)%11;
  const large=cohort>=7,medium=cohort>=3;
  return {width:large?1.16:medium?1.07:1,height:large?1.29:medium?1.13:1,
    thickness:large?1.45:medium?1.22:1};
}
// Interpretive dedication variants. These are not attributed to actual donors.
export const dedicationTexts=['崇敬者一同','有志一同','氏子一同','講中一同',
  '平成二十年奉納','平成二十五年奉納','令和元年奉納','令和五年奉納'];
export function inscriptionVariant(seed,index){return ((seed+index*5)%4+4)%4;}
export function inscriptionDate(seed,index){return 4+((seed+Math.floor(index/4))%4+4)%4;}

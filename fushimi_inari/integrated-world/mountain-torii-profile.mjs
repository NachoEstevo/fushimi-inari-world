import {toriiInscriptionRecords} from './torii-inscription-records.mjs';

// Reference-informed size cohorts, not a survey or a monotonic altitude rule.
export function mountainToriiProfile(section,index){
  const cohort=(Math.floor(index/7)*5+section*3)%11;
  const large=cohort>=7,medium=cohort>=3;
  return {width:large?1.16:medium?1.07:1,height:large?1.29:medium?1.13:1,
    thickness:large?1.45:medium?1.22:1};
}
// Observed text excerpts are reused; individual gate placement is inferred.
// Keep a complete record together, never combine an unrelated donor and date.
export const toriiInscriptionVariantCount=toriiInscriptionRecords.length;
export function inscriptionVariant(seed,index){
  const count=toriiInscriptionVariantCount;
  return ((seed*11+index*5+Math.floor(index/count)*7)%count+count)%count;
}
export function toriiInscriptionProfile(seed,index){
  return {recordIndex:inscriptionVariant(seed,index),inkStyle:((seed*3+index*7)%8+8)%8};
}

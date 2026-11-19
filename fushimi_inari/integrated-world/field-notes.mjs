export const FIELD_WALK_ID = 'steps-fade';
export const FIELD_WALK_TITLE = 'Where the steps fade';
export const FIELD_OBSERVATIONS = Object.freeze([
  Object.freeze({
    id: 'field-pond', place: 'Shin-ike', prompt: 'Observe Shin-ike', observe: 'Watch the ripples · Save note',
    note: 'The ripples carried on after my steps stopped.',
    share: 'Show the pond note', reply: '“I lingered by those ripples too.”'
  }),
  Object.freeze({
    id: 'field-steps', place: 'Mitsutsuji', prompt: 'Observe the stone steps', observe: 'Look back down the steps · Save note',
    note: 'The steps disappeared beneath the trees.',
    share: 'Show the steps note', reply: '“From that landing the steps almost vanish into the trees.”'
  })
]);

export function hasFieldObservation(moments) {
  return FIELD_OBSERVATIONS.some(({id}) => !!moments?.[id]);
}

export function describeFieldSheet(moments) {
  if (!hasFieldObservation(moments)) return null;
  const notes = FIELD_OBSERVATIONS.filter(({id}) => moments[id])
    .sort((a,b) => moments[a.id] - moments[b.id])
    .map(({id,place,note}) => ({id,place,note}));
  return {id: FIELD_WALK_ID, title: FIELD_WALK_TITLE, notes};
}

export const FIELD_NOTE_REACH = 1.8;

export function atFieldObservation(position, point) {
  if (!position || !point) return false;
  return Math.abs(position[1] - point[1] - 1.7) <= .9 &&
    Math.hypot(position[0] - point[0], position[2] - point[2]) < FIELD_NOTE_REACH;
}

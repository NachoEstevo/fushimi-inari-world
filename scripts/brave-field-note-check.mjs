import assert from 'node:assert/strict';
import {FIELD_OBSERVATIONS,FIELD_WALK_TITLE} from '../fushimi_inari/integrated-world/field-notes.mjs';
import {ZEN_JOURNEY_KEY} from '../fushimi_inari/integrated-world/zen-journey-state.mjs';
import {JOURNAL_KEY} from '../fushimi_inari/integrated-world/journey-journal.mjs';

const [pond,steps] = FIELD_OBSERVATIONS;

// Runs after the frame recordings, in the caller's dedicated release-test
// browser. Uses public controls plus the two review destinations and audit data.
export async function verifyFieldNoteWalk(page,{capture=async()=>{},checkAki=true,checkTouch=false,timeout=120000}={}) {
  const url = new URL(page.url());
  url.search = '?audit=1';
  const canvas = page.locator('#world canvas');
  const journal = page.locator('#journey-journal');
  const hint = page.locator('#interaction-hint span');
  const touch = page.locator('#zen-interact');

  const state = () => page.evaluate(({journeyKey,sealsKey})=>({
    journey:JSON.parse(localStorage.getItem(journeyKey)??'{}'),
    seals:localStorage.getItem(sealsKey)
  }),{journeyKey:ZEN_JOURNEY_KEY,sealsKey:JOURNAL_KEY});
  const savedNotes = async () => {
    const {journey} = await state();
    return FIELD_OBSERVATIONS.filter(({id})=>journey.moments?.[id]).map(({id})=>id);
  };
  const ready = async (fn,arg,limit=timeout) => {
    const handle=await page.waitForFunction(fn,arg,{timeout:limit});
    await handle.dispose();
  };
  const pending = id => ready(expected=>{
    const value=JSON.parse(document.body.dataset.zenExperience??'{}').world?.fieldNotes;
    return !!value&&value.pending===expected;
  },id);
  const checkpoint = id => ready(expected=>document.body.dataset.checkpoint===expected,id);
  const activate = async tab => {
    if (!await page.locator('#exploration-menu').isVisible()) await page.locator('#menu-open').click({timeout});
    await page.getByRole('tab',{name:tab}).click({timeout});
  };
  async function go(destination) {
    await activate('Explore');
    const places=page.locator('details.more-places');
    if (await places.getAttribute('open')===null) await places.locator('summary').click({timeout});
    const select=page.locator('#checkpoint-select');
    const [id]=await select.selectOption(destination,{timeout});
    await page.locator('#checkpoint-go').click({timeout});
    await checkpoint(id);
    await page.locator('#checkpoint-status').waitFor({state:'hidden',timeout});
    await canvas.focus({timeout});
  }
  async function enter(reload=false) {
    if (reload) await page.reload({waitUntil:'domcontentloaded',timeout});
    else await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout});
    await page.locator('#welcome-enter').click({timeout});
    await ready(()=>document.body.classList.contains('train-arriving')||document.body.classList.contains('walking'));
    const skip=page.locator('#arrival-skip');
    if (await skip.isVisible()) await skip.click({timeout});
    await ready(()=>document.body.dataset.movementMode==='walk');
    if (await page.locator('body').getAttribute('data-sound')!=='off') await page.locator('#sound-toggle').click({timeout});
    assert.equal(await page.locator('body').getAttribute('data-sound'),'off');
  }
  async function prompt(text,role=checkTouch?touch:hint) {
    await ready(({text,mobile})=>{
      const node=document.getElementById(mobile?'zen-interact':'interaction-hint');
      return node&&!node.hidden&&(mobile?node.textContent:node.querySelector('span').textContent)===text;
    },{text,mobile:role===touch});
    await role.waitFor({state:'visible',timeout});
  }
  async function press() {
    if (checkTouch) await touch.tap({timeout});
    else await page.keyboard.press('KeyE');
  }
  async function observe(note) {
    await prompt(note.prompt);
    await press();
    await pending(note.id);
    await prompt(note.observe);
  }
  async function save(note) {
    await observe(note);
    await press();
    await pending(null);
    await ready(({id,key})=>!!JSON.parse(localStorage.getItem(key)??'{}').moments?.[id],{id:note.id,key:ZEN_JOURNEY_KEY});
  }
  const openJournal = () => page.locator('#journal-open').click({timeout});
  async function closeJournal() {
    await journal.getByRole('button',{name:'Close journal'}).click({timeout});
    await journal.waitFor({state:'hidden',timeout});
    await canvas.focus({timeout});
  }

  await enter();
  const before=await state();
  assert.deepEqual(await savedNotes(),[],'Run with a fresh test browser profile');
  await openJournal();
  await journal.getByText('Quiet walks',{exact:true}).click({timeout});
  await journal.getByRole('button',{name:FIELD_WALK_TITLE,exact:true}).click({timeout});
  await journal.getByText('Stop by the pond, or follow the stone steps to the landing.',{exact:true}).waitFor({timeout});
  await closeJournal();
  await activate('Settings');
  await page.locator('#light').selectOption('night',{timeout});
  await go(`audit_${pond.id}`);
  await prompt(pond.prompt);
  await capture('field-pond-night');
  await canvas.focus({timeout});

  if (!checkTouch) {
    await page.keyboard.down('KeyE');
    try {
      await pending(pond.id);
      await page.keyboard.down('KeyE');
      assert.deepEqual(await savedNotes(),[],'Holding E must leave the observation pending');
    } finally {await page.keyboard.up('KeyE');}
  } else await observe(pond);

  // The arrival faces the water. Left sidesteps uphill along the public path.
  const origin=(await page.locator('body').getAttribute('data-camera')).split(',').map(Number);
  await page.keyboard.down('KeyA');
  try {
    await ready(([x,,z])=>{
      const values=document.body.dataset.camera?.split(',').map(Number);
      return values&&Math.hypot(values[0]-x,values[2]-z)>2;
    },origin,20000);
  } finally {await page.keyboard.up('KeyA');}
  await pending(null);
  assert.deepEqual(await savedNotes(),[],'Walking away must discard the unsaved note');

  await go(`audit_${pond.id}`);
  await observe(pond);
  await openJournal();
  await pending(null);
  assert.equal(await journal.locator('.zen-field-sheet').isVisible(),false);
  await closeJournal();
  await save(pond);
  assert.deepEqual(await savedNotes(),[pond.id]);

  await go(`audit_${steps.id}`);
  await observe(steps);
  await enter(true);
  await pending(null);
  assert.deepEqual(await savedNotes(),[pond.id],'Reload keeps the first note and discards the second pending observation');
  await go(`audit_${steps.id}`);
  await prompt(steps.prompt);
  await capture('field-steps');
  await canvas.focus({timeout});
  await save(steps);
  assert.deepEqual(await savedNotes(),[pond.id,steps.id]);
  await openJournal();
  const sheet=journal.locator('article.zen-field-sheet');
  await sheet.waitFor({state:'visible',timeout});
  assert.equal(await sheet.count(),1);
  assert.deepEqual(await sheet.locator('dd').allTextContents(),[pond.note,steps.note]);
  const after=await state();
  assert.equal(after.journey.version,2);
  assert.deepEqual(after.journey.photos,before.journey.photos??[]);
  assert.equal(after.seals,before.seals);
  await closeJournal();

  const akiReplies=[];
  if (checkAki) {
    await go({label:'Review · Aki'});
    const aki=page.locator('#zen-aki');
    await ready(()=>JSON.parse(document.body.dataset.zenExperience??'{}').world?.people.stage==='return');
    for (const note of FIELD_OBSERVATIONS) {
      await ready(mobile=>{
        const node=document.getElementById(mobile?'zen-interact':'interaction-hint');
        return node&&!node.hidden&&node.textContent.includes('Talk with Aki');
      },checkTouch);
      await press();
      await aki.getByRole('button',{name:note.share,exact:true}).click({timeout});
      const reply=await aki.locator('[data-aki-words]').textContent();
      assert.equal(reply,note.reply);
      akiReplies.push(reply);
      await aki.getByRole('button',{name:'Have a good trip.'}).click({timeout});
      await aki.waitFor({state:'hidden',timeout});
      await canvas.focus({timeout});
    }
  }
  return {input:checkTouch?'touch':'keyboard',muted:true,night:true,walkedAway:true,reloaded:true,sheetCount:1,notes:[pond.note,steps.note],akiReplies};
}

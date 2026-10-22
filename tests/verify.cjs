const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
const nodes = new Map();
const node = () => ({ value: '', textContent: '', innerHTML: '', hidden: false, open: false,
  classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, focus() {}, select() {},
  addEventListener() {}, append() {}, remove() {}, showModal() { this.open = true; }, close() { this.open = false; },
  getContext() { return null; }, offsetWidth: 375 });
const store = new Map();
const context = vm.createContext({ assert, console, TextEncoder, TextDecoder, Date, performance,
  setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  btoa: v => Buffer.from(v, 'binary').toString('base64'), atob: v => Buffer.from(v, 'base64').toString('binary'),
  window: { matchMedia: () => ({ matches: true }), innerWidth: 375, scrollTo() {}, addEventListener() {} },
  document: { querySelector(s) { if (!nodes.has(s)) nodes.set(s, node()); return nodes.get(s); },
    querySelectorAll: () => [], addEventListener() {}, createElement: node, body: node() },
  localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v) },
});
vm.runInContext(script, context);
vm.runInContext(`
let checks=0;
function ok(v,message){assert.ok(v,message);checks++;}
function eq(a,b,message){assert.equal(a,b,message);checks++;}
renderExercise=()=>{};header=()=>{};navigate=v=>{view=v;};confetti=()=>{};sound=()=>{};toast=()=>{};
function resetTest(){state=fresh();wordSelection=[];$('#answer').value='';}
function answerTest(correct=true){const a=state.active,q=BY_ID[a.ids[a.i]],answer=correct?q.answers[0]:'deliberately incorrect answer';if(q.type==='choice')a.choice=answer;else if(q.type==='order'){a.bank=answer.split(' ');wordSelection=a.bank.map((_,i)=>i);a.selected=wordSelection.slice();}else{$('#answer').value=answer;a.draft=answer;}submit();validateState(state);}
function completeRun(numberCorrect){const count=state.active.ids.length;for(let i=0;i<count;i++){answerTest(i<numberCorrect);advance();}validateState(state);}
eq(UNITS.length,18,'18 units');eq(ALL.length,144,'144 original items');eq(new Set(ALL.map(q=>q.id)).size,144,'unique IDs');
for(const u of UNITS){eq(u.items.length,8,'8 items/unit');ok(u.canDo&&u.lesson&&u.example,'complete teaching content');for(const q of u.items){ok(q.why&&q.rule&&q.prompt,'complete item');for(const answer of q.answers)ok(checkAnswer(q,answer),'canonical accepted '+q.id);ok(checkAnswer(q,q.answers[0].toUpperCase()+'!!!'),'case and punctuation '+q.id);ok(!checkAnswer(q,'unrelated answer'),'reject unrelated '+q.id);if(q.type==='choice')ok(q.options.some(o=>checkAnswer(q,o)),'correct choice present');}}
ok(checkAnswer(BY_ID.u0q0,"I'm Brazilian."),'contraction');ok(checkAnswer(BY_ID.u2q0,'Could I have some water, please?'),'alternate valid answer');ok(checkAnswer(BY_ID.u6q6,'I saw that movie yesterday.'),'film/movie');ok(checkAnswer(BY_ID.u9q0,'The flight was canceled yesterday.'),'US spelling');ok(checkAnswer(BY_ID.u3q6,"I didn't have time yesterday"),'negative contraction');ok(!checkAnswer(BY_ID.u0q1,'I have 20 years'),'Brazilian age error rejected');ok(!checkAnswer(BY_ID.u6q0,'I work here since 2020'),'since error rejected');
ok(checkAnswer({answers:['She has sent the email']},"She's sent the email"),'has contraction');ok(checkAnswer({answers:['I would have called']},"I'd have called"),'would contraction');ok(checkAnswer({answers:['I had known']},"I'd known"),'had contraction');
for(let target=0;target<=5;target++){resetTest();start('placement');let guard=0;while(state.active){const a=state.active;answerTest(a.level<target||target===5);advance();ok(++guard<=15,'placement bounded at 15');}eq(state.placement,target,'placement at '+target);eq(state.passes.filter(n=>n===2).length,target*3,'lower units completed');eq(nextTask().level,target,'next task at placement level');eq(state.bosses.filter(Boolean).length,0,'placement does not award boss stamps');validateState(state);}
resetTest();start('placement');answerTest(true);advance();answerTest(true);advance();answerTest(false);advance();eq(state.active.level,1,'2/3 advances');
resetTest();state.placement=0;for(let i=0;i<100;i++){const ids=pick(UNITS[0].items,6,1);eq(ids.length,6,'session length');ok(ids.filter(id=>BY_ID[id].type==='choice').length<=1,'MC below 30%');}
start('session',0);completeRun(3);eq(state.passes[0],0,'3/6 fails');start('session',0);completeRun(4);eq(state.passes[0],1,'4/6 passes');ok(!unitUnlocked(1),'one pass does not unlock');start('session',0);completeRun(4);ok(unitUnlocked(1),'two passes unlock');eq(state.attempts[0],3,'attempts counted');
resetTest();state.placement=0;start('session',0);answerTest(true);eq(state.active.feedback.xp,10,'first 10 XP');const xpOnce=state.xp;submit();eq(state.xp,xpOnce,'double submission idempotent');advance();answerTest(true);eq(state.active.feedback.xp,10,'second 10 XP');advance();answerTest(true);eq(state.active.feedback.xp,15,'third combo 15 XP');advance();answerTest(false);eq(state.active.combo,0,'wrong answer resets combo');eq(state.active.feedback.xp,0,'wrong answer no XP');advance();submit(true);eq(state.active.feedback.xp,0,'skip no XP');
const activeRestored=decodeProgress(encodeProgress());eq(activeRestored.active.i,state.active.i,'resume index');eq(activeRestored.active.feedback.skip,true,'resume feedback');eq(activeRestored.xp,state.xp,'resume XP');
resetTest();state.placement=0;for(let ui=0;ui<18;ui++){ok(unitUnlocked(ui),'unit '+ui+' unlocked sequentially');for(let s=0;s<2;s++){start('session',ui);completeRun(6);}if(ui%3===2){const li=Math.floor(ui/3);start('boss',li*3,li);eq(state.active.ids.length,10,'10 boss items');ok(state.active.ids.filter(id=>BY_ID[id].type==='choice').length<=3,'boss MC max 30%');completeRun(7);ok(!state.bosses[li],'7/10 boss fails');if(li<5)ok(!unlocked(li+1),'failed boss keeps next locked');start('boss',li*3,li);completeRun(8);ok(state.bosses[li],'8/10 passes boss');eq(state.lastResult.xp,160,'8 consecutive + combo + 50 bonus');if(li<5)ok(unlocked(li+1),'boss unlocks next level');start('boss',li*3,li);completeRun(8);eq(state.lastResult.xp,110,'bonus awarded only once');}}
eq(nextTask().mode,'practice','C2 completion offers maintenance');
resetTest();state.placement=0;state.errors.u0q0={count:2,answer:'Eu sou brasileiro',date:dayKey()};start('review');completeRun(1);eq(state.errors.u0q0.count,1,'review decrements');start('review');completeRun(1);ok(!state.errors.u0q0,'review removes zero-count item');
state.errors.u0q0={count:1,answer:'ação <script>alert(1)</script>',date:dayKey()};const encoded=encodeProgress();eq(decodeProgress(encoded).errors.u0q0.answer,state.errors.u0q0.answer,'Unicode export roundtrip');ok(esc(state.errors.u0q0.answer).includes('&lt;script&gt;'),'escape untrusted imported answer');
for(const bad of ['','junk','FLUENT1.bad','FLUENT1.'+btoa('{}')]){assert.throws(()=>decodeProgress(bad));checks++;}
resetTest();state.days[pastDay(1)]=true;state.days[pastDay(2)]=true;eq(streak(),2,'streak remains before practice today');state.days[pastDay(0)]=true;eq(streak(),3,'streak includes today');delete state.days[pastDay(1)];eq(streak(),1,'gap breaks streak');delete state.days[pastDay(0)];eq(streak(),0,'two-day gap clears streak');
console.log('PASS: '+checks+' assertions; full A1–C2 progression, placement thresholds, sessions, bosses, XP, review, streak, save/import, and all 144 items.');
`,context,{timeout:10000});
if (process.argv.includes('--fixtures')) {
  const fixtures = vm.runInContext(`(()=>{state=fresh();const clean=encodeProgress();state.placement=0;state.passes[0]=state.passes[1]=state.passes[2]=2;return JSON.stringify({clean,bossReady:encodeProgress(),items:ALL});})()`,context);
  fs.writeFileSync(require('node:path').join(__dirname,'fixtures.json'),fixtures);
}

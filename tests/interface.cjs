// Exercise the real app scripts with a small DOM adapter; no browser/layout claims.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const nodes=new Map(),storage=new Map(),listeners=new Map();
let doc;
function node(selector=''){
 const classes=new Set(),properties=new Map();
 let markup='';
 return {selector,value:'',textContent:'',hidden:false,open:false,disabled:false,dataset:{},offsetWidth:390,
  get innerHTML(){return markup;},set innerHTML(value){markup=value;if(selector==='#app'){const match=value.match(/<textarea[^>]*id="answer"[^>]*>([\s\S]*?)<\/textarea>/);if(match)query('#answer').value=match[1];}},
  classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},contains(n){return classes.has(n);},toggle(n,on){if(on===undefined)on=!classes.has(n);on?classes.add(n):classes.delete(n);return on;}},
  style:{setProperty(k,v){properties.set(k,v);},getPropertyValue(k){return properties.get(k);}},
  focus(){doc.activeElement=this;},matches(s){return selector==='#answer'&&s.includes('textarea');},
  setAttribute(){},removeAttribute(){},select(){},addEventListener(){},append(){},remove(){},scrollIntoView(){},
  insertAdjacentHTML(position,value){this.innerHTML=position==='afterbegin'?value+markup:markup+value;},
  getBoundingClientRect(){return {left:0,top:0,width:390,height:90};},getContext(){return null;},querySelector:query,querySelectorAll(){return [];},contains(){return true;},showModal(){this.open=true;},close(){this.open=false;}
 };
}
function query(selector){if(!nodes.has(selector))nodes.set(selector,node(selector));return nodes.get(selector);}
doc={activeElement:null,hidden:false,body:node('body'),documentElement:node('html'),querySelector:query,querySelectorAll:()=>[],createElement:()=>node(),addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);}};
const viewport={height:844,offsetTop:0,addEventListener(){}};
const context=vm.createContext({console,assert,TextEncoder,TextDecoder,Date,performance,
 setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},
 btoa:v=>Buffer.from(v,'binary').toString('base64'),atob:v=>Buffer.from(v,'base64').toString('binary'),
 document:doc,window:{innerWidth:390,innerHeight:844,visualViewport:viewport,matchMedia:()=>({matches:true}),scrollTo(){},addEventListener(){}},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}
});
for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(script[1],context);
vm.runInContext(`
 const screen=()=>$('#app').innerHTML;
 function solve(){
  let guard=0;
  while(!state.active.feedback){
   assert.ok(++guard<30,'activity terminates');
   if(state.active.mini.feedback){advance();continue;}
   const game=currentGame(),mini=state.active.mini;
   if(game.type==='story')pickStory(currentItem().correct);
   else if(game.type==='surgery'){mini.slot=game.slot;submit();}
   else {
    if(game.type==='redpen')mini.target=game.items.findIndex(q=>!mini.results.some(r=>r.key===q.key));
    mini.draft=currentItem().answers[0];$('#answer').value=mini.draft;submit();
   }
   validateState(state);
  }
 }
 assert.equal(view,'home');
 assert.equal(document.body.classList.contains('activity-focus'),false);
 assert.ok(screen().includes('journey-onboarding'));
 navigate('path');assert.equal((screen().match(/<details class="map-level/g)||[]).length,6);
 assert.equal((screen().match(/" open>/g)||[]).length,1,'only current level expanded');

 // All seven formats enter focus mode and accept real answers through the engine.
 for(const type of LINEAR_TYPES){
  state=fresh();state.placement=0;start('session');
  const game=GAMES.find(g=>g.unit===0&&g.scope==='unit'&&g.type===type);
  state.active.ids=[game.id,...selectGames(0).filter(id=>resolveGame(id).type!==type)].slice(0,6);
  if(state.active.ids.length<6)state.active.ids.push(GAMES.find(g=>g.unit===0&&g.scope==='unit'&&LINEAR_TYPES.includes(g.type)&&!state.active.ids.includes(g.id)).id);
  prepareQuestion();renderExercise();
  assert.equal(document.body.classList.contains('activity-focus'),true,type+' is focused');
  assert.equal((screen().match(/class="focus-header"/g)||[]).length,1,'one progress header');
  assert.ok(screen().includes('data-action="pause"'),'save and exit is available');
  assert.ok(!screen().includes('assessment-strip')&&!screen().includes('linear-session-strip'),'no duplicate progress');
  assert.ok(!screen().includes('data-nav='),'no general menus during exercise');
  if(type==='chat'){
   state.active.mini.draft='My saved draft';save();
   const imported=decodeProgress(encodeProgress());
   assert.equal(imported.active.mini.draft,'My saved draft');
   navigate('home');assert.equal(document.body.classList.contains('activity-focus'),false);
   next();assert.ok(screen().includes('My saved draft'),'resume keeps draft');
  }
  solve();assert.equal(state.active.feedback.ratio,1,type+' still grades correctly');
  assert.ok(screen().includes('focus-feedback')&&screen().includes('id="primary-action"'),'feedback and next action remain available');
 }

 // Complete the adaptive assessment, including saved checkpoint exits.
 state=fresh();start('placement');let rounds=0,checkpoints=0;
 while(state.active){
  if(state.active.mini.checkpoint){
   checkpoints++;assert.ok(screen().includes('data-action="pause"'),'checkpoint has exit');
   state=decodeProgress(encodeProgress());navigate('home');next();
   assert.ok(screen().includes('assessment-continue'),'checkpoint resumes');advance();continue;
  }
  solve();rounds++;advance();assert.ok(rounds<=18);
 }
 assert.equal(rounds,18);assert.equal(checkpoints,5);assert.equal(state.placement,5);
 assert.equal(view,'summary');assert.equal(document.body.classList.contains('activity-focus'),true);
 assert.ok(screen().includes('Voltar ao início'));
 navigate('home');assert.equal(document.body.classList.contains('activity-focus'),false);

 // Finishing a unit restores the next-step flow without losing focus on results.
 state=fresh();state.placement=0;start('session');
 while(state.active){solve();advance();}
 assert.equal(state.passes[0],1);assert.equal(nextTask().unit,1);assert.equal(view,'summary');
 navigate('settings');assert.equal(document.body.classList.contains('activity-focus'),false);

 // The dock follows the visible viewport while typing and resets on exit.
 next();document.activeElement=$('#answer');window.visualViewport.height=500;
 syncActivityKeyboard();assert.equal(document.documentElement.style.getPropertyValue('--keyboard-offset'),'344px');
 assert.equal(document.body.classList.contains('keyboard-open'),true);
 navigate('home');assert.equal(document.documentElement.style.getPropertyValue('--keyboard-offset'),'0px');
 assert.equal(document.body.classList.contains('keyboard-open'),false);
`,context);
console.log('PASS: seven written activity formats, focus lifecycle, saved drafts, all six placement levels, checkpoint resume, unit progression and keyboard offset. Layout is not covered by this DOM adapter.');

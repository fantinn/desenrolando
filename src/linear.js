// One guided path: discover a level, then move through the CEFR units in order.
const LINEAR_TYPES=['chat','redpen','story','tone','reading','surgery','trap'];
const LINEAR_LEVEL_COPY=[
 'frases simples e informações do dia a dia',
 'situações comuns com mais autonomia',
 'conversas e opiniões com confiança',
 'ideias conectadas e argumentos claros',
 'precisão, registro e intenção',
 'nuance, síntese e domínio do idioma'
];

const previousLinearHeader=header;
header=function(){
 previousLinearHeader();
 const nav=[['home','home','Minha trilha'],['path','map','Percurso completo'],['settings','settings','Preferências']];
 $('#nav').innerHTML=nav.map(([viewId,iconId,label])=>`<button data-nav="${viewId}" class="${view===viewId?'active':''}" ${view===viewId?'aria-current="page"':''}>${icon(iconId)}<span>${label}</span></button>`).join('');
 $('#crumb').textContent='/ '+(nav.find(item=>item[0]===view)?.[2]||'Aprendizado');
};

const previousLinearNavigate=navigate;
navigate=function(destination){
 if(['arcade','daily','review'].includes(destination))destination='path';
 return previousLinearNavigate(destination);
};

mastered=function(ui){return (state.passes[ui]||0)>=1;};
levelComplete=function(li){return state.placement!==null&&li>=0&&li<6&&UNITS.slice(li*3,li*3+3).every(unit=>mastered(unit.id));};
unlocked=function(li){return state.placement!==null&&Number.isInteger(li)&&li>=0&&li<6&&(li===0||UNITS.slice(0,li*3).every(unit=>mastered(unit.id)));};
unitUnlocked=function(ui){return state.placement!==null&&Number.isInteger(ui)&&ui>=0&&ui<18&&(ui===0||UNITS.slice(0,ui).every(unit=>mastered(unit.id)));};
nextTask=function(){
 if(state.active)return {mode:'resume',unit:state.active.unit,level:state.active.level};
 if(state.placement===null)return {mode:'placement',unit:0,level:0};
 for(let ui=0;ui<UNITS.length;ui++)if(!mastered(ui))return {mode:'session',unit:ui,level:Math.floor(ui/3)};
 return {mode:'complete',unit:17,level:5};
};

selectGames=function(ui,n=6){
 const pool=shuffle(GAMES.filter(game=>game.scope==='unit'&&game.unit===ui&&LINEAR_TYPES.includes(game.type)));
 pool.sort((a,b)=>{
  const errors=g=>g.items.reduce((sum,q)=>sum+(state.errors[q.key]?.count||0),0);
  return errors(b)-errors(a)||(state.seen[a.id]||0)-(state.seen[b.id]||0);
 });
 const selected=[];
 for(const game of pool){if(selected.some(item=>item.type===game.type))continue;selected.push(game);if(selected.length===n)break;}
 return selected.map(game=>game.id);
};

placementBlock=function(li){
 const pool=shuffle(GAMES.filter(game=>game.scope==='unit'&&game.level===LEVELS[li]&&LINEAR_TYPES.includes(game.type)));
 const selected=[];
 for(const game of pool){if(selected.some(item=>item.type===game.type))continue;selected.push(game);if(selected.length===3)break;}
 return selected.map(game=>game.id);
};

const previousLinearStart=start;
start=function(mode,ui=0,li=Math.floor(ui/3)){
 if(state.active){navigate('exercise');return;}
 const task=nextTask();
 if(task.mode==='complete'){navigate('home');return;}
 if(task.mode==='resume'){navigate('exercise');return;}
 if(task.mode==='placement')return previousLinearStart('placement');
 return previousLinearStart('session',task.unit,task.level);
};

next=function(){
 const task=nextTask();
 if(task.mode==='resume')navigate('exercise');
 else if(task.mode==='complete')navigate('home');
 else start(task.mode,task.unit,task.level);
};

const previousLinearAdvance=advance;
advance=function(){
 const active=state.active;
 if(active?.mode==='placement'&&active.mini?.checkpoint){
  const level=active.level,passed=active.answers.slice(-3).filter(answer=>answer.ratio>=.7).length>=2;
  active.mini.checkpoint=false;
  if(!passed||level===5){finish(passed?5:level);return;}
  active.feedback=null;active.level=level+1;active.unit=active.level*3;
  active.ids.push(...placementBlock(active.level));active.i++;
  prepareQuestion();save();renderExercise();return;
 }
 if(active?.mode==='placement'&&active.feedback&&(active.i+1)%3===0){
  const passed=active.answers.slice(-3).filter(answer=>answer.ratio>=.7).length>=2;
  if(passed&&active.level<5){active.mini.checkpoint=true;save();renderExercise();return;}
  finish(passed?5:active.level);return;
 }
 return previousLinearAdvance();
};

const previousLinearRenderExercise=renderExercise;
function assessmentCheckpoint(){
 const active=state.active,level=active.level,results=active.answers.slice(-3),correct=results.filter(answer=>answer.ratio>=.7).length;
 return `<section class="level-reveal" aria-live="polite"><div class="level-reveal-art"><span class="reveal-ring"></span><img src="assets/papagaio-azul.png" alt="Papagaio Azul comemorando seu progresso"></div><div class="eyebrow">SINAL DE PROGRESSO · ${LEVELS[level]}</div><h1>${correct===3?'Que salto!':correct===2?'Temos uma pista.':'Cada resposta ajudou a ajustar o próximo passo.'}</h1><p>Você concluiu esta etapa de leitura e escrita. Vamos conferir como se sente no próximo nível.</p><div class="reveal-evidence" aria-label="Resultado das três atividades">${results.map((answer,index)=>`<span class="evidence-dot ${answer.ratio>=.7?'is-correct':'needs-practice'}" title="Atividade ${index+1}: ${Math.round(answer.ratio*100)}%"></span>`).join('')}<strong>${correct}/3</strong></div><div class="assessment-levels">${LEVELS.map((name,index)=>`<span class="assessment-level ${index<level?'passed':index===level?'current':''}">${name}</span>`).join('')}</div><button class="btn" id="assessment-continue" data-action="advance">Continuar descoberta ${icon('arrow')}</button><p class="tiny muted">Sem cronômetro. Você pode parar e retomar quando quiser.</p></section>`;
}
renderExercise=function(){
 previousLinearRenderExercise();
 const active=state.active;if(!active)return;
 if(active.mode==='placement'){
  if(active.mini.checkpoint){$('#app').innerHTML=assessmentCheckpoint();$('#assessment-continue')?.focus({preventScroll:true});return;}
  const step=active.i+1,bandStep=active.i%3+1,level=LEVELS[active.level];
  const strip=`<div class="assessment-strip"><div class="assessment-strip-top"><span class="eyebrow">DESCOBERTA DO SEU NÍVEL</span><span class="assessment-counter">${String(step).padStart(2,'0')} <span>/ até 18</span></span></div><div class="assessment-band">${LEVELS.map((name,index)=>`<span class="assessment-level ${index<active.level?'passed':index===active.level?'current':''}">${name}</span>`).join('')}</div><div class="assessment-note"><span class="assessment-pulse"></span><span>Investigando <strong>${level}</strong> · etapa ${bandStep} de 3 · ${LINEAR_LEVEL_COPY[active.level]}</span></div></div>`;
  const section=$('#question-card');
  if(section?.insertAdjacentHTML)section.insertAdjacentHTML('beforebegin',strip);
  else $('#app').innerHTML=$('#app').innerHTML.replace('<section class="question-card game-stage"',strip+'<section class="question-card game-stage"');
  return;
 }
 if(active.mode==='session'){
  const completed=UNITS.filter(unit=>mastered(unit.id)).length-(state.placement||0)*3;
  const pathStrip=`<div class="linear-session-strip"><div><span class="eyebrow">${LEVELS[active.level]} · UNIDADE ${(active.unit%3)+1} DE 3</span><strong>${esc(UNITS[active.unit].title)}</strong></div><span>${Math.max(0,completed)} / ${18-(state.placement||0)*3} unidades</span></div>`;
  const section=$('#question-card');if(section?.insertAdjacentHTML)section.insertAdjacentHTML('beforebegin',pathStrip);
 }
};

function learningMapHTML(){
 const task=nextTask(),startUnit=state.placement===null?0:state.placement*3;
 return `<section class="learning-map" aria-label="Percurso linear do A1 ao C2">${LEVELS.map((level,li)=>{
  const units=UNITS.slice(li*3,li*3+3),available=state.placement!==null&&units.some(unit=>unitUnlocked(unit.id)),levelDone=units.every(unit=>mastered(unit.id));
  return `<section class="map-level ${available?'is-open':''} ${levelDone?'is-done':''}"><div class="map-level-head"><span class="map-level-mark">${levelDone?icon('check'):String(li+1).padStart(2,'0')}</span><div><span class="eyebrow">NÍVEL ${level}</span><h2>${LEVEL_NAMES[li]}</h2></div><span class="map-level-status">${state.placement===null?'a descobrir':levelDone?'concluído':available?'em andamento':'a seguir'}</span></div><p class="map-level-focus">${LINEAR_LEVEL_COPY[li]}</p><div class="map-units">${units.map((unit,index)=>{
   const below=state.placement!==null&&unit.id<startUnit,done=mastered(unit.id)&&!below,current=state.placement!==null&&task.unit===unit.id&&!state.active,locked=state.placement===null||(!below&&!done&&!current&&unit.id>task.unit);
   const status=below?'abaixo do ponto de entrada':done?'concluída':current?'próxima etapa':'bloqueada';
   return `<div class="map-unit ${done?'is-done':''} ${current?'is-current':''} ${locked?'is-locked':''} ${below?'is-assessed':''}"><span class="map-unit-node">${done?icon('check'):below?'↗':String(index+1).padStart(2,'0')}</span><div class="map-unit-copy"><strong>${esc(unit.title)}</strong><span>${esc(unit.canDo)}</span></div><span class="map-unit-status">${status}</span></div>`;
  }).join('')}</div></section>`;
 }).join('')}</section>`;
}

function progressHeadline(task){
 if(task.mode==='placement')return {tag:'UMA DESCOBERTA, SEIS NÍVEIS',title:'Onde seu inglês começa?',description:'Um percurso rápido e adaptativo, feito só de leitura e escrita. Suas respostas mostram por onde seguir.'};
 if(task.mode==='resume')return state.active.mode==='placement'?{tag:'SUA DESCOBERTA ESTÁ SALVA',title:'Vamos continuar de onde paramos?',description:'O papagaio guardou seu progresso. Retome sem perder as respostas anteriores.'}:{tag:'SUA TRILHA CONTINUA',title:'Mais um passo no seu inglês.',description:UNITS[task.unit].canDo};
 if(task.mode==='complete')return {tag:'PERCURSO CONCLUÍDO',title:'Você chegou ao C2.',description:'Você percorreu todas as etapas do A1 ao C2, com prática de leitura e escrita em situações reais.'};
 return {tag:`${LEVELS[task.level]} · UNIDADE ${(task.unit%3)+1}`,title:UNITS[task.unit].title,description:UNITS[task.unit].canDo};
}
function learningHero(){
 const task=nextTask(),copy=progressHeadline(task),button=task.mode==='placement'?'Descobrir meu nível':task.mode==='resume'?'Retomar percurso':task.mode==='complete'?'Ver percurso completo':'Continuar aprendendo';
 const progress=state.placement===null?0:Math.round((UNITS.filter(unit=>mastered(unit.id)).length/18)*100);
 return `<section class="linear-hero ${task.mode==='placement'?'discovery-hero':''}"><div class="linear-hero-copy"><span class="eyebrow">${copy.tag}</span><h1>${copy.title}</h1><p>${copy.description}</p>${task.mode==='placement'?'<div class="discovery-promise"><span>LEITURA</span><i></i><span>ESCRITA</span><i></i><span>A1 → C2</span></div>':`<div class="journey-progress"><div class="journey-progress-copy"><span>SEU PERCURSO</span><strong>${progress}%</strong></div><div class="journey-meter" role="progressbar" aria-label="Progresso do percurso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="--journey-progress:${progress}%"></span></div></div>`}<button class="btn linear-cta" data-action="next">${button} ${icon('arrow')}</button><p class="linear-reassurance">${task.mode==='placement'?'Sem áudio, sem microfone e sem cronômetro.':'Uma etapa de cada vez. Seu progresso fica salvo neste dispositivo.'}</p></div><div class="linear-hero-art" aria-hidden="true"><span class="parrot-sun"></span><img src="assets/papagaio-azul.png" alt=""><span class="parrot-speech">${task.mode==='placement'?'Oi! Vamos descobrir?':'Vamos juntos!'}</span><span class="parrot-star">✦</span></div></section>`;
}

renderHome=function(){
 const task=nextTask(),copy=progressHeadline(task);
 $('#app').innerHTML=`${learningHero()}<div class="learning-home-heading"><div><span class="eyebrow">A LINHA DO SEU APRENDIZADO</span><h2>${state.placement===null?'O percurso completo, em ordem.':'Sua próxima conquista está no caminho.'}</h2></div><span>${state.placement===null?'6 níveis · 18 unidades':`${LEVELS[state.placement]} a C2 · 18 unidades`}</span></div>${learningMapHTML()}<div class="learning-footnote">${icon('shield')} A avaliação indica um ponto de partida em leitura e escrita; não é uma certificação oficial de nível.</div>`;
};
renderPath=function(){
 const task=nextTask();
 $('#app').innerHTML=`<div class="path-page-heading"><span class="eyebrow">SEU PERCURSO · A1 → C2</span><h1>Uma linha clara até o domínio.</h1><p>As etapas são liberadas em sequência. Cada unidade mistura leitura, escrita e situações diferentes.</p></div>${learningHero()}${learningMapHTML()}`;
};
renderArcade=function(){renderPath();};
renderDaily=function(){renderPath();};
renderNotebook=function(){renderPath();};

renderSummary=function(){
 const result=state.lastResult;if(!result){navigate('home');return;}
 const task=nextTask(),placement=result.mode==='placement',complete=task.mode==='complete';
 const title=placement?`Seu ponto de partida é ${LEVELS[result.level]}.`:result.passed?complete?'Percurso completo.':'Unidade concluída.':`Seu próximo passo continua em ${LEVELS[Math.floor(result.unit/3)]}.`;
 const description=placement?`Nas atividades de leitura e escrita, seu desempenho indica ${LEVELS[result.level]} como ponto de partida. Os níveis anteriores foram considerados na avaliação.`:result.passed?complete?'Você concluiu todas as 18 unidades do A1 ao C2.':'O próximo trecho da trilha já está liberado. Vamos avançar.':'Você já identificou o que precisa de mais prática. A trilha continua nesta unidade, com outros formatos e questões.';
 const mascotLine=placement?result.level>=4?'Você já navega por estruturas avançadas. Agora vamos lapidar precisão e nuance.':result.level>=2?'Você já consegue lidar com várias situações reais. Vamos consolidar sua próxima etapa.':'Todo começo conta. Agora você tem um ponto de partida feito para você.':result.passed?'Mais uma etapa virou conhecimento seu.': 'Errar apontou o próximo ajuste. Vamos usá-lo no caminho.';
 $('#app').innerHTML=`<section class="learning-result ${placement?'placement-result':''} ${result.passed?'result-success':'result-practice'}"><div class="result-mascot"><img src="assets/papagaio-azul.png" alt="Papagaio Azul acompanhando seu percurso"></div><span class="eyebrow">${placement?'DESCOBERTA CONCLUÍDA':result.passed?'ETAPA CONCLUÍDA':'UM PASSO DE APRENDIZADO'}</span><h1>${title}</h1><p class="result-description">${description}</p>${placement?`<div class="level-result-orbit"><span class="orbit-glow"></span><strong>${LEVELS[result.level]}</strong><span>PONTO DE PARTIDA</span></div><div class="result-level-row">${LEVELS.map((level,index)=>`<span class="assessment-level ${index<result.level?'passed':index===result.level?'current':''}">${level}</span>`).join('')}</div>`:`<div class="unit-result"><span class="unit-result-number">${String(result.unit+1).padStart(2,'0')}</span><div><strong>${esc(UNITS[result.unit].title)}</strong><span>${Math.round(result.ratio*100)}% de precisão · ${result.correct} de ${result.total} atividades</span></div><span class="unit-result-xp">+${result.xp} XP</span></div>`}<div class="mascot-message"><span class="mascot-message-mark">✦</span><p>${mascotLine}</p></div><button class="btn linear-cta" data-action="next">${placement?`Começar por ${LEVELS[result.level]}`:complete?'Ver percurso completo':result.passed?'Seguir para a próxima unidade':'Continuar nesta unidade'} ${icon('arrow')}</button><p class="result-note">${placement?'Estimativa de entrada baseada somente em leitura e escrita.':`Seu próximo passo: ${task.mode==='complete'?'fim do percurso':task.mode==='session'?`unidade ${task.unit+1} · ${LEVELS[task.level]}`:'retomar sua sessão'}.`}</p></section>`;
 if(!placement){const xp=$('.unit-result-xp');if(xp)xp.setAttribute('aria-label',`${result.xp} XP conquistados`);}
};

renderSettings=function(){
 $('#app').innerHTML=`<div class="path-page-heading"><span class="eyebrow">PREFERÊNCIAS</span><h1>Seu progresso, no seu dispositivo.</h1><p>Salve uma cópia ou leve a trilha para outro navegador.</p></div><section class="settings linear-settings"><section class="card"><h2>Progresso de aprendizado</h2><p>Gere um código para guardar uma cópia. Importar um código substitui o progresso atual após confirmação.</p><div class="button-row"><button class="btn secondary" data-action="export">${icon('download')}Gerar código</button><button class="btn secondary" data-action="copy">Copiar código</button></div><label for="save-code" class="question-label">Código de progresso</label><textarea id="save-code" class="code" placeholder="Gere seu código ou cole um código FLUENT2…" spellcheck="false"></textarea><button class="btn" data-action="import">Importar progresso ${icon('arrow')}</button><p id="import-status" role="status" style="margin:12px 0 0"></p></section><section class="card"><h2>Como funciona sua trilha</h2><p>O nivelamento e as unidades medem leitura e escrita. O percurso segue do seu ponto de entrada até o C2, uma unidade por vez. Não há tarefas de fala ou escuta.</p><div class="source-links"><a href="https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors" target="_blank" rel="noopener noreferrer">Descritores CEFR do Conselho da Europa ↗</a></div></section></section>`;
};

function clearOutOfPathSession(){
 const active=state.active;if(!active)return;
 const usesVoice=active.ids.some(id=>['dictation','speak'].includes(resolveGame(id)?.type));
 if(!usesVoice&&!['daily','review','boss','practice'].includes(active.mode))return;
 cleanupGame();state.active=null;save();
 toast(usesVoice?'A atividade salva foi retomada pela trilha de leitura e escrita.':'A trilha agora segue em sequência. Seu progresso concluído foi mantido.');
}

const previousLinearStorageReady=()=>{};
clearOutOfPathSession();
header();renderHome();

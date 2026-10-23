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
 document.body.classList.toggle('activity-focus',view==='exercise'||view==='summary');
 document.body.classList.toggle('exercise-focus',view==='exercise');
 const nav=[['home','home','Início'],['path','map','Trilha'],['settings','settings','Ajustes']];
 $('#nav').innerHTML=nav.map(([viewId,iconId,label])=>`<button data-nav="${viewId}" class="${view===viewId?'active':''}" ${view===viewId?'aria-current="page"':''}>${icon(iconId)}<span>${label}</span></button>`).join('');
 $('#crumb').textContent='/ '+(nav.find(item=>item[0]===view)?.[2]||'Aprendizado');
};

const previousLinearNavigate=navigate;
navigate=function(destination){
 if(['arcade','daily','review'].includes(destination))destination='path';
 const result=previousLinearNavigate(destination);
 if(destination!=='exercise'){activityActionObserver?.disconnect();syncActivityKeyboard();}
 return result;
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

function focusHeaderHTML(active){
 const placement=active.mode==='placement',completed=active.i+(active.feedback?1:0),total=placement?18:active.ids.length;
 const label=placement?'Descobrindo seu nível':UNITS[active.unit].title;
 return `<header class="focus-header"><button class="focus-exit icon-btn" data-action="pause" aria-label="Salvar e sair da atividade" title="Salvar e sair">${icon('close')}</button><div class="focus-progress"><div class="focus-progress-label"><span>${esc(label)}</span><span>${placement?`${LEVELS[active.level]} · ${active.i%3+1} de 3`:`${active.i+1} de ${total}`}</span></div><div class="focus-meter" role="progressbar" aria-label="${placement?'Progresso da descoberta, até 18 atividades':'Progresso da unidade'}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${completed}"><span style="width:${completed/total*100}%"></span></div></div></header>`;
}
function assessmentCheckpoint(){
 const active=state.active,level=active.level,results=active.answers.slice(-3),correct=results.filter(answer=>answer.ratio>=.7).length;
 return `<section class="level-reveal" aria-live="polite"><div class="level-reveal-art"><span class="reveal-ring"></span><img src="assets/papagaio-azul.png" alt="Papagaio Azul comemorando seu progresso"></div><div class="eyebrow">SINAL DE PROGRESSO · ${LEVELS[level]}</div><h1>${correct===3?'Que salto!':correct===2?'Temos uma pista.':'Cada resposta ajudou a ajustar o próximo passo.'}</h1><p>Você concluiu esta etapa de leitura e escrita. Vamos conferir como se sente no próximo nível.</p><div class="reveal-evidence" aria-label="Resultado das três atividades">${results.map((answer,index)=>`<span class="evidence-dot ${answer.ratio>=.7?'is-correct':'needs-practice'}" title="Atividade ${index+1}: ${Math.round(answer.ratio*100)}%"></span>`).join('')}<strong>${correct}/3</strong></div><div class="assessment-levels">${LEVELS.map((name,index)=>`<span class="assessment-level ${index<level?'passed':index===level?'current':''}">${name}</span>`).join('')}</div><button class="btn" id="assessment-continue" data-action="advance">Continuar descoberta ${icon('arrow')}</button><p class="tiny muted">Sem cronômetro. Você pode parar e retomar quando quiser.</p></section>`;
}
renderExercise=function(){
 const active=state.active;if(!active){navigate('home');return;}
 header();
 if(active.mode==='placement'&&active.mini.checkpoint){
  $('#app').innerHTML=`<div class="exercise-wrap focus-checkpoint">${focusHeaderHTML(active)}${assessmentCheckpoint()}</div>`;
  $('#assessment-continue')?.focus({preventScroll:true});observeActivityActions();return;
 }
 const game=currentGame(),mini=active.mini,type=GAME_TYPES[game.type],feedback=mini.feedback;
 const answered=Boolean(active.feedback||feedback),canSubmit=['chat','tone','trap','reading','surgery'].includes(game.type)||(game.type==='redpen'&&mini.target!==null);
 const focused=document.activeElement,slotFocus=focused?.dataset?.slot;
 const helper=game.type==='story'?'Escolha uma resposta para continuar.':game.type==='redpen'?'Toque no trecho que precisa de correção.':'Escolha onde a palavra se encaixa.';
 const lesson=active.mode==='session'&&active.i===0?`<details class="focus-lesson"><summary>${icon('book')}Uma dica para esta unidade <span>+</span></summary><p>${esc(UNITS[active.unit].lesson)}</p><p lang="en">${esc(UNITS[active.unit].example)}</p></details>`:'';
 const action=answered?`<button class="btn ${(active.feedback?.correct??feedback?.correct)?'correct':''}" data-action="advance" id="primary-action">${active.feedback&&active.i===active.ids.length-1&&active.mode!=='placement'?'Ver resultado':'Continuar'}${icon('arrow')}</button>`:canSubmit?'<button class="btn" data-action="submit" id="primary-action" disabled>Verificar resposta</button>':`<span class="focus-action-hint">${helper}</span>`;
 $('#app').innerHTML=`<div class="exercise-wrap">${focusHeaderHTML(active)}<section class="question-card game-stage" id="question-card"><div class="focus-activity-label"><span>${icon(type[1])}${type[0]}</span><span>${game.level}</span></div><h1 id="activity-title" tabindex="-1">${esc(game.title)}</h1><div class="focus-stage">${stageHTML(game)}</div>${feedback?`<div class="focus-feedback" tabindex="-1">${feedbackBlock(feedback)}</div>`:''}${lesson}</section><footer class="focus-actions ${answered?'has-feedback':''}"><div class="focus-actions-inner">${answered?'':`<button class="btn ghost" data-action="skip">Pular</button>`}${action}</div></footer></div>`;
 updateSubmit();observeActivityActions();
 if(answered){$('#primary-action')?.focus({preventScroll:true});requestAnimationFrame(()=>{if(view==='exercise'&&state.active===active&&state.active.mini===mini)$('.focus-feedback')?.scrollIntoView({block:'nearest',behavior:'instant'});});}
 else if(slotFocus!==undefined&&/^\d+$/.test(slotFocus))$(`[data-slot="${slotFocus}"]`)?.focus({preventScroll:true});
 else if(game.type==='redpen'&&mini.target!==null&&focused?.dataset?.red!==undefined)$('#answer')?.focus();
 else $('#activity-title')?.focus({preventScroll:true});
};

// Reserve the actual action-bar height so large text never covers an answer.
let activityActionObserver;
function observeActivityActions(){
 activityActionObserver?.disconnect();
 const actions=$('.focus-actions');
 const measure=()=>document.documentElement.style.setProperty('--activity-actions-height',`${actions?.getBoundingClientRect().height||0}px`);
 measure();
 if(actions&&typeof ResizeObserver!=='undefined'){activityActionObserver=new ResizeObserver(measure);activityActionObserver.observe(actions);}
}
function syncActivityKeyboard(){
 const viewport=window.visualViewport,typing=view==='exercise'&&document.activeElement?.matches?.('input,textarea');
 const offset=viewport&&typing?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
 document.documentElement.style.setProperty('--keyboard-offset',`${Math.round(offset)}px`);
 document.body.classList.toggle('keyboard-open',Boolean(typing&&offset>80));
}
window.visualViewport?.addEventListener('resize',syncActivityKeyboard);
window.visualViewport?.addEventListener('scroll',syncActivityKeyboard);
document.addEventListener('focusin',syncActivityKeyboard);
document.addEventListener('focusout',()=>requestAnimationFrame(syncActivityKeyboard));

function learningMapHTML(compact=false){
 const task=nextTask(),startUnit=state.placement===null?0:state.placement*3;
 return `<section class="learning-map" aria-label="Percurso linear do A1 ao C2">${LEVELS.map((level,li)=>{
  if(compact&&li!==task.level)return '';
  const units=UNITS.slice(li*3,li*3+3),available=state.placement!==null&&units.some(unit=>unitUnlocked(unit.id)),levelDone=units.every(unit=>mastered(unit.id));
  return `<details class="map-level ${available?'is-open':''} ${levelDone?'is-done':''}" ${compact||li===task.level?'open':''}><summary class="map-level-head"><span class="map-level-mark">${levelDone?icon('check'):level}</span><span class="map-level-heading"><span class="eyebrow">NÍVEL ${level}</span><strong>${LEVEL_NAMES[li]}</strong></span><span class="map-level-status">${state.placement===null?'a descobrir':levelDone?'concluído':li===task.level?'atual':'a seguir'}</span><span class="map-chevron">${icon('arrow')}</span></summary><p class="map-level-focus">${LINEAR_LEVEL_COPY[li]}</p><div class="map-units">${units.map((unit,index)=>{
   const below=state.placement!==null&&unit.id<startUnit,done=mastered(unit.id)&&!below,current=state.placement!==null&&task.unit===unit.id&&!done,locked=state.placement===null||(!below&&!done&&!current&&unit.id>task.unit);
   const status=below?'avaliada':done?'concluída':current?(state.active?'em andamento':'próxima etapa'):'a seguir';
   return `<div class="map-unit ${done?'is-done':''} ${current?'is-current':''} ${locked?'is-locked':''} ${below?'is-assessed':''}"><span class="map-unit-node">${done?icon('check'):below?'↗':String(index+1).padStart(2,'0')}</span><div class="map-unit-copy"><strong>${esc(unit.title)}</strong><span>${esc(unit.canDo)}</span></div><span class="map-unit-status">${status}</span></div>`;
  }).join('')}</div></details>`;
 }).join('')}</section>`;
}

function progressHeadline(task){
 if(task.mode==='placement')return {tag:'SEU PRIMEIRO PASSO',title:'Seu inglês tem um ponto de partida.',description:'Descubra o seu com situações de leitura e escrita que se adaptam às suas respostas.'};
 if(task.mode==='resume')return state.active.mode==='placement'?{tag:'DESCOBERTA EM ANDAMENTO',title:'Vamos de onde você parou.',description:'Suas respostas estão salvas. Continue descobrindo seu ponto de partida.'}:{tag:'SUA PRÓXIMA ETAPA',title:UNITS[task.unit].title,description:UNITS[task.unit].canDo};
 if(task.mode==='complete')return {tag:'PERCURSO CONCLUÍDO',title:'Um caminho inteiro de conquistas.',description:'Você concluiu a trilha de leitura e escrita até o C2. Veja as etapas do seu percurso.'};
 return {tag:`${LEVELS[task.level]} · UNIDADE ${(task.unit%3)+1}`,title:UNITS[task.unit].title,description:UNITS[task.unit].canDo};
}
function learningHero(){
 const task=nextTask(),copy=progressHeadline(task),button=task.mode==='placement'?'Descobrir meu nível':task.mode==='resume'?'Retomar percurso':task.mode==='complete'?'Ver percurso completo':'Continuar aprendendo';
 const progress=state.placement===null?0:Math.round((UNITS.filter(unit=>mastered(unit.id)).length/18)*100);
 return `<section class="linear-hero ${task.mode==='placement'?'discovery-hero':''}"><div class="linear-hero-copy"><span class="eyebrow">${copy.tag}</span><h1>${copy.title}</h1><p>${copy.description}</p>${task.mode==='placement'?'<div class="discovery-promise"><span>LEITURA</span><i></i><span>ESCRITA</span><i></i><span>A1 → C2</span></div>':`<div class="journey-progress"><div class="journey-progress-copy"><span>SEU PERCURSO</span><strong>${progress}%</strong></div><div class="journey-meter" role="progressbar" aria-label="Progresso do percurso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="--journey-progress:${progress}%"></span></div></div>`}<button class="btn linear-cta" ${task.mode==='complete'?'data-nav="path"':'data-action="next"'}>${button} ${icon('arrow')}</button><p class="linear-reassurance">${task.mode==='placement'?'No seu ritmo. Só leitura e escrita.':'Seu progresso é salvo automaticamente.'}</p></div><div class="linear-hero-art" aria-hidden="true"><span class="parrot-sun"></span><img src="assets/papagaio-azul.png" alt=""><span class="parrot-star">✦</span></div></section>`;
}

renderHome=function(){
 const discovering=state.placement===null;
 $('#app').innerHTML=`<div class="home-intro"><div><span class="eyebrow">SEU ESPAÇO DE APRENDIZADO</span><h2>Um passo de cada vez.</h2></div><span class="home-level-pill">${discovering?'A1 → C2':LEVELS[nextTask().level]}</span></div>${learningHero()}<div class="learning-home-heading"><h2>${discovering?'Uma trilha feita para você':'Seu capítulo atual'}</h2><button class="text-btn" data-nav="path">Ver trilha ${icon('arrow')}</button></div>${discovering?`<ol class="journey-onboarding"><li><span>01</span><div><strong>Encontre seu ponto de partida</strong><p>As perguntas se ajustam ao seu inglês.</p></div></li><li><span>02</span><div><strong>Aprenda em situações reais</strong><p>Leia, traduza, escreva e faça escolhas.</p></div></li><li><span>03</span><div><strong>Avance uma etapa por vez</strong><p>Cada unidade prepara a próxima.</p></div></li></ol>`:learningMapHTML(true)}<div class="learning-footnote">${icon('shield')}${discovering?'A avaliação estima seu ponto de entrada em leitura e escrita.':'Seu percurso fica salvo neste navegador.'}</div>`;
};
renderPath=function(){
 const task=nextTask();
 $('#app').innerHTML=`<div class="path-page-heading"><span class="eyebrow">6 NÍVEIS · 18 UNIDADES</span><h1>Seu inglês, etapa por etapa.</h1><p>Um percurso de leitura e escrita, do seu ponto de partida até o C2.</p></div><div class="path-continue"><span>${task.mode==='placement'?'Comece descobrindo seu nível.':task.mode==='complete'?'Todas as etapas concluídas.':'Sua próxima etapa está pronta.'}</span>${task.mode==='complete'?'':`<button class="btn" data-action="next">${task.mode==='placement'?'Descobrir nível':'Continuar'}${icon('arrow')}</button>`}</div>${learningMapHTML()}`;
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
 $('#app').insertAdjacentHTML('afterbegin',`<div class="result-top"><button class="text-btn" data-nav="home">${icon('close')}Voltar ao início</button></div>`);
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

clearOutOfPathSession();
header();renderHome();

// Browse practice activities without changing the saved learning session.
const CATALOG_PAGE_SIZE=12;
const catalogFilters={level:null,type:'',query:'',limit:CATALOG_PAGE_SIZE};

function catalogNormalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}

function catalogSearchText(g){
 const u=UNITS[g.unit],type=GAME_TYPES[g.type];
 return catalogNormalize([g.title,g.level,type[0],type[2],`Unidade ${g.unit+1}`,u.title,u.canDo,u.lesson,g.scene,g.docTitle,g.artifactTitle,g.artifact,g.clues,...(g.messages||[]),...g.items.flatMap(q=>[q.prompt,q.context])].filter(Boolean).join(' '));
}
const catalogSearchIndex=new Map(GAMES.filter(g=>g.scope==='unit').map(g=>[g.id,catalogSearchText(g)]));

// Public helpers remain independent of DOM rendering for filtering checks.
function catalogGames(filters=catalogFilters){
 if(state.placement===null)return [];
 const words=catalogNormalize(String(filters.query||'').slice(0,100)).split(' ').filter(Boolean);
 return GAMES.filter(g=>g.scope==='unit'&&unlocked(Math.floor(g.unit/3))&&(!filters.level||g.level===filters.level)&&(!filters.type||g.type===filters.type)&&words.every(word=>catalogSearchIndex.get(g.id).includes(word))).sort((a,b)=>a.unit-b.unit||Object.keys(GAME_TYPES).indexOf(a.type)-Object.keys(GAME_TYPES).indexOf(b.type));
}

function catalogCard(g){
 const u=UNITS[g.unit],[name,ic]=GAME_TYPES[g.type],played=(state.seen[g.id]||0)>0;
 const label=`Jogar ${g.title}. ${name}. Nível ${g.level}. Unidade ${g.unit+1}: ${u.title}.`;
 return `<li><button type="button" class="catalog-game" data-catalog-play="${esc(g.id)}" aria-label="${esc(label)}"><span class="catalog-card-top"><span class="type-icon">${icon(ic)}</span><span class="catalog-level">${esc(g.level)}</span></span><span class="catalog-type">${esc(name)}</span><span class="catalog-title">${esc(g.title)}</span><span class="catalog-description">${esc(g.scene||u.canDo)}</span><span class="catalog-unit">Unidade ${g.unit+1} · ${esc(u.title)}</span><span class="catalog-card-bottom"><span class="catalog-played ${played?'is-played':''}">${played?icon('check')+'Praticado':'Novo para você'}</span><span class="catalog-play">Praticar ${icon('arrow')}</span></span></button></li>`;
}

function catalogResultsHTML(games,limit=catalogFilters.limit){
 if(!games.length)return `<div class="catalog-empty"><span class="type-icon">${icon('search')}</span><h2>Nenhuma atividade por aqui.</h2><p>Tente outra palavra ou limpe os filtros para explorar os níveis liberados.</p><button type="button" class="btn secondary" data-catalog-action="clear">Limpar filtros</button></div>`;
 const shown=games.slice(0,limit),remaining=games.length-shown.length;
 return `<ul class="catalog-grid" aria-label="Atividades para praticar">${shown.map(catalogCard).join('')}</ul>${remaining>0?`<div class="catalog-more"><button type="button" class="btn secondary" data-catalog-action="more" aria-controls="catalog-results">Mostrar mais ${Math.min(CATALOG_PAGE_SIZE,remaining)} atividades ${icon('arrow')}</button><span>${remaining} ${remaining===1?'atividade restante':'atividades restantes'}</span></div>`:''}`;
}

function renderCatalogResults(focusIndex=null){
 const results=$('#catalog-results');if(!results)return;
 const games=catalogGames(),shown=Math.min(games.length,catalogFilters.limit);
 results.innerHTML=catalogResultsHTML(games);
 $('#catalog-count').textContent=games.length?`${games.length} ${games.length===1?'atividade encontrada':'atividades encontradas'} · ${shown} ${shown===1?'exibida':'exibidas'}`:'Nenhuma atividade encontrada';
 if(focusIndex!==null)results.querySelectorAll('[data-catalog-play]')[focusIndex]?.focus({preventScroll:true});
}

renderArcade=function(){
 const introHTML=intro('Encontre sua próxima história.','Explore situações dos seus níveis liberados. A prática rende XP e ajuda a revisar, sem substituir as sessões da trilha.','SEU CATÁLOGO DE MINIJOGOS');
 if(state.placement===null){
  $('#app').innerHTML=introHTML+`<section id="arcade-catalog" class="card catalog-welcome"><span class="type-icon">${icon('grid')}</span><h2>12 jeitos de praticar. Um ponto de partida para você.</h2><p>Descubra seu nível para liberar atividades de conversa, leitura, voz, memória e muito mais.</p><button type="button" class="btn" data-catalog-action="placement">${state.active?'Retomar nivelamento':'Descobrir meu nível'} ${icon('arrow')}</button><p class="tiny muted">Até 15 atividades · seu progresso fica salvo</p></section>`;
  return;
 }
 const available=LEVELS.filter((level,li)=>unlocked(li));
 if(catalogFilters.level===null)catalogFilters.level=LEVELS[nextTask().level];
 if(catalogFilters.level&&!available.includes(catalogFilters.level))catalogFilters.level='';
 const nextLevel=available.length<LEVELS.length?' Os demais níveis são liberados na sua trilha.':'';
 $('#app').innerHTML=introHTML+`<section id="arcade-catalog" aria-label="Catálogo de atividades">${state.active?`<aside class="catalog-resume"><div><strong>Sua atividade está salva.</strong><p>Retome de onde parou antes de começar uma nova história.</p></div><button type="button" class="btn secondary" data-catalog-action="resume">Retomar atividade ${icon('arrow')}</button></aside>`:''}<div class="card catalog-filters"><div class="catalog-fields"><div class="catalog-field catalog-search"><label for="catalog-search">Buscar atividade</label><div class="catalog-search-box">${icon('search')}<input id="catalog-search" type="search" maxlength="100" placeholder="Título, unidade ou situação…" value="${esc(catalogFilters.query)}" data-catalog-filter="query" aria-controls="catalog-results" autocomplete="off"></div></div><div class="catalog-field"><label for="catalog-level">Nível CEFR</label><select id="catalog-level" data-catalog-filter="level" aria-controls="catalog-results"><option value="" ${!catalogFilters.level?'selected':''}>Todos os liberados</option>${LEVELS.map((level,li)=>`<option value="${level}" ${catalogFilters.level===level?'selected':''} ${unlocked(li)?'':'disabled'}>${level}${unlocked(li)?'':' · bloqueado'}</option>`).join('')}</select></div><div class="catalog-field"><label for="catalog-type">Tipo de minijogo</label><select id="catalog-type" data-catalog-filter="type" aria-controls="catalog-results"><option value="">Todos os tipos</option>${Object.entries(GAME_TYPES).map(([type,[name]])=>`<option value="${type}" ${catalogFilters.type===type?'selected':''}>${esc(name)}</option>`).join('')}</select></div></div><p class="catalog-filter-note">Níveis disponíveis: ${available.join(', ')}.${nextLevel}</p></div><div class="catalog-results-bar"><p id="catalog-count" role="status" aria-live="polite" aria-atomic="true"></p><button type="button" class="catalog-clear" data-catalog-action="clear">Limpar filtros</button></div><div id="catalog-results"></div></section>`;
 renderCatalogResults();
};

function changeCatalogFilter(control){
 const key=control.dataset.catalogFilter;
 if(!['query','level','type'].includes(key))return;
 catalogFilters[key]=key==='query'?control.value.slice(0,100):control.value;
 catalogFilters.limit=CATALOG_PAGE_SIZE;
 renderCatalogResults();
}

document.addEventListener('input',e=>{if(view==='arcade'&&e.target.dataset.catalogFilter==='query')changeCatalogFilter(e.target);});
document.addEventListener('change',e=>{if(view==='arcade'&&['level','type'].includes(e.target.dataset.catalogFilter))changeCatalogFilter(e.target);});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-catalog-action],[data-catalog-play]');
 if(!button||!button.closest('#arcade-catalog')||view!=='arcade')return;
 if(button.dataset.catalogPlay){
  const g=GAME_BY_ID[button.dataset.catalogPlay];
  if(!g||g.scope!=='unit')return;
  if(state.placement===null){start('placement');return;}
  start('practice',g.unit,Math.floor(g.unit/3),g.id);return;
 }
 const action=button.dataset.catalogAction;
 if(action==='placement')start('placement');
 else if(action==='resume')navigate('exercise');
 else if(action==='more'){
  const previousLimit=catalogFilters.limit;catalogFilters.limit+=CATALOG_PAGE_SIZE;
  renderCatalogResults(previousLimit);
 }else if(action==='clear'){
  Object.assign(catalogFilters,{level:'',type:'',query:'',limit:CATALOG_PAGE_SIZE});
  for(const key of ['query','level','type']){const control=$(`[data-catalog-filter="${key}"]`);if(control)control.value='';}
  renderCatalogResults();
  $('#catalog-search')?.focus({preventScroll:true});
 }
});

// Keep the last valid save recoverable and prevent stale tabs from overwriting it.
const BACKUP_KEY=STORAGE_KEY+'.backup',DAMAGED_KEY=STORAGE_KEY+'.damaged';
let storedSnapshot=null,backupSnapshot=null,storageConflict=false,damagedSnapshot=null,recoveredSave=false;

function storageNotice(message,conflict=false){
 const warning=$('#storage-warning');
 if(!warning)return;
 warning.hidden=storageOK;
 warning.innerHTML=esc(message)+(conflict?' <button class="btn secondary" data-storage-reload>Carregar progresso atualizado</button>':'');
}

load=function(){
 storageConflict=false;damagedSnapshot=null;recoveredSave=false;loadFailed=false;
 try{
  storedSnapshot=localStorage.getItem(STORAGE_KEY);
  backupSnapshot=localStorage.getItem(BACKUP_KEY);
  if(storedSnapshot){
   try{const loaded=validateState(JSON.parse(storedSnapshot));storageOK=true;return loaded;}
   catch{damagedSnapshot=storedSnapshot;}
  }
  if(backupSnapshot){
   try{const restored=validateState(JSON.parse(backupSnapshot));recoveredSave=true;storageOK=true;return restored;}
   catch{backupSnapshot=null;}
  }
  storageOK=!damagedSnapshot;loadFailed=!!damagedSnapshot;
 }catch{storageOK=false;loadFailed=true;}
 return fresh();
};

function markStorageConflict(){
 storageConflict=true;storageOK=false;
 if(clockInterval){clearInterval(clockInterval);clockInterval=null;}
 if(state.active?.mini)state.active.mini.running=false;
 stopMedia();
 storageNotice('O progresso mudou em outra aba. O salvamento desta aba está pausado. Carregue a versão atual ou exporte seu código em Preferências.',true);
}

save=function(){
 try{
  if(storageConflict||localStorage.getItem(STORAGE_KEY)!==storedSnapshot){markStorageConflict();return false;}
  const serialized=JSON.stringify(state);
  if(damagedSnapshot){
   // Do not replace unreadable data unless its original bytes are preserved.
   localStorage.setItem(DAMAGED_KEY,damagedSnapshot);
   damagedSnapshot=null;
  }
  if(serialized!==storedSnapshot){
   // An unreadable primary save must never replace a valid recovery copy.
   if(storedSnapshot){
    try{validateState(JSON.parse(storedSnapshot));
     if(backupSnapshot!==storedSnapshot){localStorage.setItem(BACKUP_KEY,storedSnapshot);backupSnapshot=storedSnapshot;}
    }catch{/* A backup failure must not prevent the primary save. */}
   }
   localStorage.setItem(STORAGE_KEY,serialized);storedSnapshot=serialized;
   // Seed recovery on the first save, including after recovery from corruption.
   if(!backupSnapshot){try{localStorage.setItem(BACKUP_KEY,serialized);backupSnapshot=serialized;}catch{}}
  }
  storageOK=true;loadFailed=false;storageNotice('');return true;
 }catch{
  storageOK=false;
  storageNotice('Não foi possível salvar no navegador. Seu avanço continua nesta aba; exporte um código em Preferências antes de fechar.');
  return false;
 }
};

replaceProgress=function(replacement,reset=false){
 const previous=state;
 state=replacement;
 if(!save()){state=previous;return false;}
 if(reset){
  try{localStorage.setItem(BACKUP_KEY,storedSnapshot);backupSnapshot=storedSnapshot;localStorage.removeItem(DAMAGED_KEY);}catch{}
 }
 return true;
};

handleProgressChange=function(event){
 if(event.key!==STORAGE_KEY&&event.key!==null)return;
 try{if(localStorage.getItem(STORAGE_KEY)!==storedSnapshot)markStorageConflict();}catch{storageOK=false;}
};

document.addEventListener('click',event=>{
 if(!event.target.closest('[data-storage-reload]'))return;
 state=load();selectedLevel=state.placement??0;
 navigate('home');
 if(loadFailed)storageNotice('Não foi possível ler o progresso. Importe uma cópia em Preferências.');
 else{if(recoveredSave)save();toast(recoveredSave?'Cópia de segurança recuperada.':'Progresso atualizado.');}
});

state=load();selectedLevel=state.placement??0;
if(recoveredSave){save();toast('Recuperamos seu progresso usando a última cópia válida deste navegador.');}
navigate('home');
if(loadFailed)storageNotice('Não foi possível ler o progresso salvo. Importe uma cópia em Preferências. Os dados anteriores serão preservados separadamente ao salvar.');

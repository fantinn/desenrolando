const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
let html=read('src/base.html');
// Defer loading v2 to the arcade validator; v1 still uses its original validator before migration.
html=html.replace('return raw?validateState(JSON.parse(raw)):fresh();','return raw?(JSON.parse(raw).version===2?fresh():validateState(JSON.parse(raw))):fresh();');
html=html.replace('</style>',['src/arcade.css','src/catalog.css','src/linear.css','src/interface.css'].map(read).join('\n')+'\n</style>');
html=html.replace('</body>','<script>\n'+['src/games.js','src/arcade.js','src/storage.js','src/catalog.js','src/linear.js'].map(read).join('\n')+'\n</script>\n</body>');
html=html.replace('<title>Fluent — Inglês em movimento</title>','<title>Fluent — Inglês do A1 ao C2</title>');
html=html.replace('Inglês para a vida real. Uma trilha de prática do A1 ao C2, com sessões curtas e progresso salvo no seu dispositivo.','Descubra seu nível de inglês e avance em uma trilha linear do A1 ao C2, com atividades de leitura e escrita.');
html=html.replace('12 minijogos, 228 atividades e situações reais do A1 ao C2. Inglês em português e inglês, com progresso salvo no dispositivo.','Descubra seu nível e avance do A1 ao C2 em uma trilha de leitura e escrita, com progresso salvo neste dispositivo.');
for(const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(s[1]);
fs.writeFileSync(path.join(__dirname,'index.html'),html);
console.log('Built self-contained index.html ('+Buffer.byteLength(html)+' bytes)');

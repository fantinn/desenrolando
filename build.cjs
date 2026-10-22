const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
let html=read('src/base.html');
// Defer loading v2 to the arcade validator; v1 still uses its original validator before migration.
html=html.replace('return raw?validateState(JSON.parse(raw)):fresh();','return raw?(JSON.parse(raw).version===2?fresh():validateState(JSON.parse(raw))):fresh();');
html=html.replace('</style>',read('src/arcade.css')+'\n</style>');
html=html.replace('</body>','<script>\n'+read('src/games.js')+'\n'+read('src/arcade.js')+'\n</script>\n</body>');
html=html.replace('<title>Fluent — Inglês em movimento</title>','<title>Fluent Arcade — Inglês em situações reais</title>');
html=html.replace('Inglês para a vida real. Uma trilha de prática do A1 ao C2, com sessões curtas e progresso salvo no seu dispositivo.','12 minijogos, 228 atividades e situações reais do A1 ao C2. Inglês em português e inglês, com progresso salvo no dispositivo.');
for(const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(s[1]);
fs.writeFileSync(path.join(__dirname,'index.html'),html);
console.log('Built self-contained index.html ('+Buffer.byteLength(html)+' bytes)');

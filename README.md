# Fluent Arcade

Trilha de inglês do A1 ao C2, com interface em português, nivelamento adaptativo e 18 unidades em sequência. As atividades trabalham leitura e escrita; não exigem fala, microfone ou áudio.

## Abrir localmente

Abra `index.html` no navegador. Mantenha a pasta `assets/` ao lado do arquivo para exibir as imagens e os ícones. O aplicativo não exige instalação, conta nem servidor.

Para desenvolver e executar as verificações, use Node.js 18 ou superior e npm. Não há dependências externas para instalar.

```sh
npm run build
npm test
```

Depois de editar os arquivos de `src/`, execute o build e atualize a página no navegador. `index.html` é um arquivo gerado: faça as mudanças nos arquivos de origem.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run build` | Gera `index.html` e verifica a sintaxe dos scripts incorporados. |
| `npm test` | Executa as suítes de lógica sobre o `index.html` existente. |
| `npm run check` | Gera uma versão atualizada e executa as suítes de lógica. |
| `npm run test:browser` | Verifica os fluxos no navegador, incluindo celular, retomada e duas abas. Requer Playwright. |
| `node tests/verify.cjs` | Verifica o motor original e seus 144 itens, preservados como base e para compatibilidade. |
| `node tests/arcade.cjs` | Verifica os 12 motores, as 228 atividades, a progressão e os recursos do Arcade. |

As suítes de lógica usam apenas módulos nativos do Node.js e um navegador simulado. Elas verificam as regras, os filtros, a integridade dos dados, a recuperação de salvamentos e eventos atrasados de voz. O teste opcional de navegador usa Playwright com Chromium e gera imagens do catálogo em desktop e celular. Para usar outro Chromium instalado, defina `PLAYWRIGHT_EXECUTABLE_PATH` com o caminho do executável. A qualidade das vozes e o microfone exigem conferência manual no dispositivo.

## Estrutura

```text
src/base.html       Estrutura da página, estilos base, conteúdo e motor original
src/arcade.css      Estilos dos minijogos e das telas do Arcade
src/games.js        Banco de atividades, personagens e tipos de minijogo
src/arcade.js       Regras do Arcade, interface, áudio e migração de progresso
src/catalog.js     Busca, filtros, paginação e retomada no catálogo
src/catalog.css    Apresentação responsiva do catálogo
src/storage.js     Recuperação de progresso e proteção entre abas
assets/            Imagens e ícones locais
build.cjs          Montagem do HTML com CSS e JavaScript incorporados
index.html         Aplicativo gerado, pronto para abrir ou servir
tests/verify.cjs   Verificações da base original
tests/arcade.cjs   Verificações do Arcade
tests/game-regressions.cjs  Contexto de revisão, relógios e eventos de voz
tests/catalog.cjs Filtros e navegação do catálogo
tests/storage.cjs  Recuperação, conflitos e falhas de armazenamento
tests/browser.cjs Fluxos reais em desktop e celular (opcional)
```

Para servir o aplicativo em uma hospedagem estática, mantenha `index.html` e `assets/` na mesma estrutura. Não há backend ou banco de dados remoto.

## Aprendizado e progressão

O nivelamento acompanha seis etapas, de A1 a C2, e usa somente leitura e escrita. Cada etapa mistura situações e formatos diferentes. O processo pode avançar até 18 atividades e termina no nível indicado pelas respostas. A estimativa define seu ponto de partida; não é uma certificação CEFR.

Depois do nivelamento, as 18 unidades seguem em linha reta. Uma sessão traz seis atividades variadas, sem cronômetro, e uma precisão média de 70% libera a próxima unidade. Se algo escapar, a atividade pode aparecer novamente no fluxo normal da trilha. Não há tarefas diárias, catálogo paralelo ou etapa de boss.

As atividades combinam conversa escrita, leitura contextual, edição de texto, construção de frases, tradução e escolhas de caminho. A correção aceita as variantes cadastradas; respostas livres fora dessas variantes podem exigir outra redação.

## Uso offline

Os exercícios, a correção e o progresso funcionam localmente. Com os arquivos disponíveis no dispositivo, o estudo funciona sem internet. Links externos de referência exigem conexão.

## Progresso e cópia de segurança

O progresso é salvo no `localStorage` do navegador, incluindo a sessão em andamento. Retome no mesmo navegador e no mesmo endereço. Outro navegador, perfil, endereço ou dispositivo possui armazenamento separado; não há sincronização em nuvem.

O aplicativo mantém uma cópia local do último salvamento válido e tenta recuperá-la se o principal ficar ilegível. Dados ilegíveis são preservados separadamente antes de serem substituídos. Se outra aba alterar o progresso, esta aba interrompe o salvamento e oferece **Carregar progresso atualizado**; você também pode exportar o código desta aba antes de carregar. Ao zerar o progresso, a cópia de recuperação também é reiniciada.

Em **Preferências**, use **Gerar código** e **Copiar código** para guardar uma cópia. Para restaurar, cole o código e escolha **Importar progresso**. A importação substitui o progresso local após confirmação. Códigos `FLUENT1` são migrados; novas exportações usam `FLUENT2`.

Se o navegador bloquear o armazenamento ou se seus dados forem apagados, uma cópia exportada permite restaurar o avanço. Guarde uma cópia antes de trocar de navegador ou mover os arquivos para outro endereço. Ao restaurar uma atividade com cronômetro, ela retorna pausada.

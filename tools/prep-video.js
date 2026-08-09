/*
  Prepara o video do hero. Roda uma vez; a saida estatica e commitada.
  Nao faz parte do site — o site nao tem build.

      node tools/prep-video.js

  A FONTE (_fontes/0805.mp4) e o reel da propria loja: 2560x1440 (16:9), 21,5s,
  27 MB, HEVC Main 10 com audio. Ele passeia pelas secoes da loja, com uma
  cartela de texto em cada uma:

      INTIMATTO -> Baby doll e Camisolas -> Lingeries -> Jeans
      -> Linha conforto -> Alfaiataria -> Moda praia -> E muito mais!

  ── DOIS MOLDES ───────────────────────────────────────────────────────────

  Saem dois arquivos, trocados por media query no <source>:

      vitrine.mp4     16:9   desktop
      vitrine-43.mp4   4:3   celular

  O 4:3 existe porque um 16:9 num celular vira uma faixa de 211px de altura.
  Cortar pra 4:3 devolve 281px — 33% a mais de presenca na dobra.

  ── Por que 4:3 e nao 4:5 ──────────────────────────────────────────────────

  O pedido original era 4:5. Nao da, e o motivo e aritmetico: as legendas e o
  letreiro da loja ocupam ~75% da largura do quadro. Um 4:5 tirado de 1440 de
  altura so pode ter 1152 de largura — 45% do original. Medido nos frames:

      4:5  "INTIMATTO"             ->  "NTIMAT"
      4:5  "Baby doll e Camisolas" ->  "aby doll e Camisola"
      4:3  "Baby doll e Camisolas" ->  inteiro
      4:3  "INTIMATTO"             ->  raspa a ultima letra

  Nao ha ponto de corte que salve o 4:5; nao e escolha de enquadramento, e
  falta de largura na fonte. O 4:3 (1920 de largura, 75%) e o mais alto que
  ainda preserva os nomes das secoes. A perda aceita e a ultima letra do
  letreiro na cartela de abertura, decidida com o cliente.

  A saida definitiva seria o proprio reel em vertical — a loja e de Instagram
  e provavelmente tem a versao 9:16 de Stories, com o texto ja diagramado pra
  essa proporcao. Se ela aparecer, este corte deixa de ser necessario.

  ── Codec e tamanho ────────────────────────────────────────────────────────

  HEVC 10 bits NAO TOCA em Chrome nem Firefox; so em Safari. Converter pra
  H.264 8 bits (yuv420p, perfil high) nao e otimizacao, e requisito.

  Resolucoes medidas contra o mesmo conteudo, no 16:9:

      1280x720 crf31 ... 3,16 MB
      1024x576 crf30 ... 2,34 MB   <- escolhido
       854x480 crf29 ... 1,95 MB

  O criterio nao foi o peso, foi o TEXTO em script — a primeira coisa a
  derreter na compressao. A 854 os ornamentos em volta das palavras ficam
  moles; a 1024 continuam nitidos.

  O 4:3 sai em 800x600, MENOR em pixels que o 16:9 de proposito: quem baixa
  esse arquivo esta no celular, e a 375 CSS ele ainda da 2,1x de densidade.

  24 fps e nao 30: sao planos parados ou de movimento lento. Corta ~15% do
  arquivo sem diferenca visivel.

  O AUDIO SAI. O iOS so faz autoplay de video mudo, entao a faixa nunca
  tocaria — ficaria de peso morto no download.

  VP9/WebM foi testado e descartado: no mesmo alvo de qualidade saiu MAIOR que
  o H.264, e ainda custaria uma terceira <source> pra manter.
*/

const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const FONTE = path.join(RAIZ, '_fontes', '0805.mp4');
// site/ e a unica pasta publicada. Ferramenta e fonte ficam de fora dela.
const SAIDA = path.join(RAIZ, 'site', 'img', 'hero');

const FPS = '24';

/* O corte 4:3, centrado: 1920 de largura dos 2560, sobrando 320 de cada lado.
   Centrado e nao deslocado porque as legendas sao centralizadas no quadro —
   puxar pra um lado salvaria uma letra e comeria a do outro. */
const CORTE_43 = 'crop=1920:1440:320:0';

const MOLDES = [
  { nome: 'vitrine',    filtro: null,      largura: 1024, altura: 576, crf: '30' },
  { nome: 'vitrine-43', filtro: CORTE_43,  largura: 800,  altura: 600, crf: '30' },
];

/* A cartela de abertura, com o letreiro dourado da loja.

   Como poster ela e o melhor quadro possivel: e o frame 0 de verdade, entao
   nao ha salto quando o video comeca; e quem estiver em Modo de Baixo Consumo
   — onde o iOS bloqueia o autoplay e o poster e tudo que aparece — ve a marca
   da loja, e nao um quadro perdido do meio do reel. */
const POSTER_EM = '0';

const rodar = (args) => execFileSync(ffmpeg, ['-y', ...args], { stdio: 'ignore' });
const mb = (arq) => (fs.statSync(arq).size / 1024 / 1024).toFixed(2);
const kb = (arq) => Math.round(fs.statSync(arq).size / 1024);

(function main() {
  if (!fs.existsSync(FONTE)) {
    console.error(
      `\nFalhou: ${path.relative(RAIZ, FONTE)} nao existe.\n` +
      `A fonte mora em _fontes/, que e gitignored — num clone limpo do repo ` +
      `ela precisa ser reposta a mao.\n`
    );
    process.exit(1);
  }

  fs.mkdirSync(SAIDA, { recursive: true });

  for (const m of MOLDES) {
    const vf = [m.filtro, `scale=${m.largura}:${m.altura}`, `fps=${FPS}`]
      .filter(Boolean)
      .join(',');

    const video = path.join(SAIDA, `${m.nome}.mp4`);
    const poster = path.join(SAIDA, `${m.nome}-poster.webp`);

    /* +faststart move o indice (moov) pro comeco do arquivo. Sem ele o
       navegador baixa o video INTEIRO antes do primeiro quadro — num hero de
       2 MB e a diferenca entre comecar na hora e esperar. */
    rodar([
      '-i', FONTE,
      '-an',
      '-vf', vf,
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-pix_fmt', 'yuv420p',
      '-crf', m.crf,
      '-preset', 'slower',
      '-movflags', '+faststart',
      video,
    ]);

    // WebP e nao AVIF: poster= precisa ser formato universal.
    rodar([
      '-ss', POSTER_EM,
      '-i', FONTE,
      '-frames:v', '1',
      '-vf', vf.replace(`,fps=${FPS}`, ''),
      '-c:v', 'libwebp',
      '-quality', '82',
      poster,
    ]);

    console.log(
      `${(m.nome + '.mp4').padEnd(18)} ${m.largura}x${m.altura}  ${FPS}fps  mudo  ` +
      `${mb(video)} MB   (poster ${kb(poster)} KB)`
    );
  }
})();

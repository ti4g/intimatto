/*
  Recorta o loop do hero a partir do reel da campanha.
  Roda uma vez; a saida estatica e commitada. Nao faz parte do site.

      node tools/prep-video.js

  A fonte e 720x1280 (9:16), 54s, 11,6 MB, com audio e 16 planos.

  Plano escolhido: 22,43s -> 27,30s. Top e calca brancos, figura unica,
  movimento sutil, sem corte interno. Loopa sem solavanco.

  O plano do vestido vermelho (5,6s -> 8,73s) foi descartado: 3,1s e curto
  demais pra loop de hero, e a partir de 8,0s um flare magenta atravessa a
  modelo.

  Cor: o estudio inteiro tem dominante lavanda. Medido no fundo do poster, o
  desvio azul era +19 contra o verde; a correcao abaixo leva pra +6, que e o
  bastante pra nao brigar com o branco quente da pagina. Ver tools/medir-cor.js.
*/

const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const FONTE = path.join(RAIZ, '_fontes', 'campanha-essence.mp4');
const SAIDA = path.join(RAIZ, 'img', 'hero');

const INICIO = 22.43;
const DURACAO = 4.87;

// 6500K e neutro; abaixo aquece. mix=0.55 pra corrigir sem cozinhar a pele.
const GRADE = 'colortemperature=temperature=5400:mix=0.55,eq=saturation=0.97';

const ff = (args) => execFileSync(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
const kb = (p) => `${Math.round(fs.statSync(p).size / 1024)} KB`;

fs.mkdirSync(SAIDA, { recursive: true });

const mp4 = path.join(SAIDA, 'essence.mp4');
ff([
  '-ss', String(INICIO), '-t', String(DURACAO), '-i', FONTE,
  '-vf', GRADE,
  '-an',                     // mudo: o hero nao tem som e o iOS so faz autoplay de video mudo
  '-c:v', 'libx264',
  '-crf', '26',
  '-preset', 'slow',
  '-pix_fmt', 'yuv420p',     // sem isto o Safari nao decodifica
  '-movflags', '+faststart', // moov na frente: comeca a tocar sem baixar o arquivo inteiro
  '-y', mp4,
]);

// Poster: primeiro frame do proprio recorte, entao nao ha salto quando o
// video comeca. WebP e nao AVIF porque poster= precisa ser universal.
// Sai em 720 de largura, igual ao video: um poster mais nitido que o video
// so faria o play parecer que borrou a imagem.
const posterTmp = path.join(SAIDA, '_poster-tmp.png');
ff(['-ss', String(INICIO), '-i', FONTE, '-vf', GRADE, '-frames:v', '1', '-y', posterTmp]);

const sharp = require('sharp');
sharp(posterTmp)
  .webp({ quality: 82 })
  .toFile(path.join(SAIDA, 'essence-poster.webp'))
  .then(() => {
    fs.unlinkSync(posterTmp);
    console.log('essence.mp4         ', kb(mp4), '  720x1280, mudo, 4,87s');
    console.log('essence-poster.webp ', kb(path.join(SAIDA, 'essence-poster.webp')));
  });

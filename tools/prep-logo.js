/*
  Gera o logo com fundo transparente.

      node tools/prep-logo.js

  O logo veio dourado sobre preto, sem canal alfa. No rodape isso nao e
  problema — o bloco e #000000 exato e o mix-blend-mode: screen encaixa.
  Sobre o video do hero nao serve: o fundo do estudio e lavanda claro, e
  screen sobre fundo claro apaga o logo inteiro.

  A saida nao depende de pedir arquivo pra ninguem. Como o desenho e claro
  sobre preto puro, o proprio brilho serve de canal alfa: preto vira
  transparente, dourado fica opaco, e as bordas ganham meio-tom de graca
  (que e o que evita serrilhado).

  A fonte e o PNG que a loja mandou como "vetorizado". Nao e vetor — e raster
  1254x1254 sem alfa — mas e 19% maior que o JPG anterior e sem os artefatos
  de compressao do JPEG em volta das letras, que sujavam a borda translucida.
  Se um dia vier o SVG de verdade, este script deixa de ser necessario.
*/

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const FONTE = path.join(RAIZ, '_fontes', 'logo-vetorizado.png');
const SAIDA = path.join(RAIZ, 'site', 'img', 'logo');

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });

  const base = sharp(FONTE);
  const { width, height } = await base.metadata();

  // O brilho de cada pixel vira a opacidade dele.
  const alfa = await sharp(FONTE).greyscale().toColourspace('b-w').raw().toBuffer();
  const cor = await sharp(FONTE).ensureAlpha().raw().toBuffer();

  /* O brilho vira alfa, mas o dourado mais claro do desenho so chega a 236 de
     255 — entao o logo nunca era opaco de verdade e sempre misturava com o
     fundo. Medido sobre o video, na posicao real do hero, isso dava 3,57:1 de
     contraste medio: visivel, porem mole.

     A curva abaixo engrossa o alfa sem tocar na COR: 0,55 leva 236 pra 255 e
     puxa a barriga da distribuicao (a maioria dos pixels vive entre 192 e
     224) pra perto do opaco. O dourado da marca continua exatamente o mesmo —
     clarear a cor teria sido mais facil e teria mudado a identidade da loja.

     Com esta curva a media sobe pra 5,98:1. As bordas seguem em meio-tom
     porque a curva preserva a ordem dos valores; ela so redistribui.

     O PISO existe porque a curva sozinha levanta TAMBEM o fundo: o preto do
     JPG nao e zero exato (fica em 1 a 8 por causa da compressao), e 0,55
     transforma isso em 13 a 40 — um veu escuro cobrindo o video inteiro, e o
     trim() logo abaixo deixaria de achar borda pra cortar. Tudo abaixo do
     piso vira transparencia limpa antes da curva. */
  const CURVA_ALFA = 0.55;
  const PISO = 12;

  for (let i = 0; i < alfa.length; i++) {
    const a = alfa[i];
    const acima = Math.max(0, a - PISO) / (255 - PISO);
    cor[i * 4 + 3] = Math.round(255 * Math.pow(acima, CURVA_ALFA));
    /* Onde o alfa e baixo a cor original e quase preta, e um dourado
       escurecido misturado com o fundo claro do video daria cinza sujo nas
       bordas. Reacender o pixel pro dourado do proprio logo resolve: a borda
       fica dourada translucida em vez de cinza. */
    if (a > 0 && a < 200) {
      const f = 200 / Math.max(a, 1);
      cor[i * 4] = Math.min(255, cor[i * 4] * f);
      cor[i * 4 + 1] = Math.min(255, cor[i * 4 + 1] * f);
      cor[i * 4 + 2] = Math.min(255, cor[i * 4 + 2] * f);
    }
  }

  // trim() corta a moldura preta que sobrou em volta do desenho, entao o
  // arquivo passa a ser so o logo — da pra posicionar sem adivinhar margem.
  // .png() antes do toBuffer: sem formato declarado sharp devolve pixel cru,
  // que o proximo sharp() nao sabe ler.
  const recortado = await sharp(cor, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();

  /* 800px de largura e paleta de 128 cores.

     O logo exibe no maximo a 192px CSS (rodape) — 576px numa tela 3x. Sair
     em 1170px so engordava o arquivo. E o desenho e um degrade dourado sobre
     transparente: 128 cores cobrem a rampa inteira sem faixa visivel, e
     levam o PNG de 415 KB pra uma fracao disso. */
  const destino = path.join(SAIDA, 'logo.png');
  await sharp(recortado)
    .resize({ width: 800, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, colours: 128 })
    .toFile(destino);

  const m = await sharp(destino).metadata();
  const kb = Math.round(fs.statSync(destino).size / 1024);
  console.log(`logo.png  ${m.width}x${m.height}  ${kb} KB  alfa=${m.hasAlpha}`);

  /* Previa do hero como ele e de verdade.

     A versao anterior centralizava o logo no quadro, e era enganosa: no meio
     do video, sem scrim, o dourado da 2,33:1 e a previa mostrava um logo
     lavado que nunca existiu na pagina. O logo mora na BASE, sob o scrim.

     Os numeros abaixo saem do layout medido no navegador a 375x812, dobrados
     pra previa sair legivel. Se o CSS do hero mudar, mudam aqui tambem —
     previa que mente e pior que previa nenhuma. */
  const poster = path.join(SAIDA, '..', 'hero', 'essence-poster.webp');
  if (fs.existsSync(poster)) {
    const E = 2;                       // escala da previa
    const W = 375 * E, H = 585 * E;    // hero: 72dvh de um 812
    const LX = 16 * E, LY = 431 * E, LW = 233 * E;

    const quadro = await sharp(poster)
      .resize(W, H, { fit: 'cover', position: 'top' })
      .raw().toBuffer({ resolveWithObject: true });
    const px = quadro.data, canais = quadro.info.channels;

    // Os dois scrims do CSS, aplicados como o navegador os empilha.
    const rampa = (t, paradas) => {
      if (t <= paradas[0][0]) return paradas[0][1];
      for (let i = 0; i < paradas.length - 1; i++) {
        const [p0, a0] = paradas[i], [p1, a1] = paradas[i + 1];
        if (t >= p0 && t <= p1) return a0 + ((t - p0) / (p1 - p0)) * (a1 - a0);
      }
      return 0;
    };
    for (let y = 0; y < H; y++) {
      const baixo = rampa((H - y) / H, [[0, 0.72], [0.34, 0.52], [0.62, 0]]);
      const cima = rampa(y / H, [[0, 0.58], [0.12, 0.22], [0.26, 0]]);
      const a = 1 - (1 - baixo) * (1 - cima);
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * canais;
        px[i] = px[i] * (1 - a) + 10 * a;
        px[i + 1] = px[i + 1] * (1 - a) + 9 * a;
        px[i + 2] = px[i + 2] * (1 - a) + 8 * a;
      }
    }

    const logo = await sharp(destino).resize({ width: LW }).toBuffer();
    await sharp(px, { raw: { width: W, height: H, channels: canais } })
      .composite([{ input: logo, left: LX, top: LY }])
      .jpeg({ quality: 90 })
      .toFile(path.join(RAIZ, '_fontes', '_previa-logo-no-video.jpg'));
    console.log('previa   _fontes/_previa-logo-no-video.jpg  (hero real, com scrim)');
  }
})();

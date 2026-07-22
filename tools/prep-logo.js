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

  for (let i = 0; i < alfa.length; i++) {
    const a = alfa[i];
    cor[i * 4 + 3] = a;
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

  /* Previa sobre o frame mais claro do video, que e o pior caso de contraste
     pro dourado. Nao vai pro site: serve pra decidir se o logo aguenta pousar
     sobre a imagem ou se precisa de scrim. */
  const poster = path.join(SAIDA, '..', 'hero', 'essence-poster.webp');
  if (fs.existsSync(poster)) {
    const larguraLogo = 520;
    const logo = await sharp(destino).resize({ width: larguraLogo }).toBuffer();
    const { height: hLogo } = await sharp(logo).metadata();
    await sharp(poster)
      .resize(720, 900, { fit: 'cover', position: 'top' })
      .composite([{ input: logo, left: Math.round((720 - larguraLogo) / 2), top: Math.round((900 - hLogo) / 2) }])
      .jpeg({ quality: 88 })
      .toFile(path.join(RAIZ, '_fontes', '_previa-logo-no-video.jpg'));
    console.log('previa   _fontes/_previa-logo-no-video.jpg');
  }
})();

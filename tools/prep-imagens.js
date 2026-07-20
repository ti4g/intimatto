/*
  Preparo das imagens do piloto. Roda uma vez; a saida estatica e commitada.
  Nao faz parte do site — o site nao tem build.

      node tools/prep-imagens.js

  Numeros medidos em disco, nao estimados.

  A grade usa as 6 fotos mais recentes, escolhidas por variedade de cor: vinho,
  marrom, jeans, rose e dois pretos. As anteriores continuam em _fontes/ e
  podem voltar trocando os slugs da lista abaixo.

  Resolucao: as novas vieram por WhatsApp em 960x1280, contra 1440x1710 das
  antigas. Parece perda mas quase nao e: o card usa no maximo 800px de largura
  (190px CSS a 3x = 570; desktop 3 col ~380 CSS a 2x = 760), e o modal a 960
  sobe so 1,09x. Cor vale mais que os 480px que sobravam.

  LARGURAS e uniforme de proposito. A camisola tem 1066 de fonte e sai em 960
  como as outras: srcset com larguras diferentes por produto complicaria o
  produtos.js sem ganho visivel.
*/

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const FONTES = path.join(RAIZ, '_fontes');
const SAIDA = path.join(RAIZ, 'img', 'produtos');

const LARGURAS = [400, 800, 960];

/*
  Recorte 4:5 (0,800), que e a proporcao do card e do modal.

  As fotos de loja sao 960x1280 (0,750): pra chegar em 4:5 corta-se ALTURA
  (960/0,8 = 1200, entao 80px fora). Cortamos os 80 do topo, nao do centro:
  o teto tem trilho de luz e luminarias de corda que so poluem o quadro.

  A camisola e 1066x1600 (0,666): precisa perder 268px de altura (1066/0,8 =
  1332). Aqui o corte e centrado, porque a foto e de estudio e ja esta
  enquadrada — cortar so o topo comeria o cabelo dela.
*/
const alvos = [
  { fonte: 'loja-vestido-vinho.jpg',      slug: 'vestido-vinho',    recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },
  { fonte: 'loja-conjunto-marrom.jpg',    slug: 'conjunto-marrom',  recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },
  { fonte: 'loja-jeans-wide.jpg',         slug: 'jeans-wide',       recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },
  { fonte: 'loja-vestido-preto.jpg',      slug: 'vestido-preto',    recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },
  { fonte: 'loja-polo-preta.jpg',         slug: 'polo-preta',       recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },
  { fonte: 'catalogo-camisola-rose.jpg',  slug: 'camisola-rose',    recorte: { left: 0, top: 134, width: 1066, height: 1332 } },
];

async function conferirFonte(arquivo, recorte) {
  const src = path.join(FONTES, arquivo);
  const { width, height } = await sharp(src).metadata();
  const precisaW = recorte.left + recorte.width;
  const precisaH = recorte.top + recorte.height;
  if (precisaW > width || precisaH > height) {
    throw new Error(
      `${arquivo} e ${width}x${height}, mas o recorte pede ${precisaW}x${precisaH}. ` +
      `Se a foto foi trocada, os numeros deste script precisam ser refeitos.`
    );
  }
  const ratio = (recorte.width / recorte.height).toFixed(3);
  if (ratio !== '0.800') {
    throw new Error(`${arquivo}: o recorte da ${ratio}, nao 4:5. A grade ficaria torta.`);
  }
  return src;
}

async function main() {
  // Regera do zero: as 5 pecas antigas sairam da vitrine e os arquivos delas
  // nao devem ficar para tras enganando quem for olhar a pasta depois.
  fs.rmSync(SAIDA, { recursive: true, force: true });
  fs.mkdirSync(SAIDA, { recursive: true });

  let n = 0;
  for (const alvo of alvos) {
    const src = await conferirFonte(alvo.fonte, alvo.recorte);

    for (const largura of LARGURAS) {
      const base = sharp(src).extract(alvo.recorte).resize({ width: largura });
      await base.clone().avif({ quality: 55, effort: 6 })
        .toFile(path.join(SAIDA, `${alvo.slug}-${largura}.avif`));
      await base.clone().webp({ quality: 80 })
        .toFile(path.join(SAIDA, `${alvo.slug}-${largura}.webp`));
      n += 2;
    }

    const r = alvo.recorte;
    console.log(`${alvo.fonte.padEnd(28)} -> ${alvo.slug.padEnd(17)} [${r.width}x${r.height}]`);
  }

  console.log(`\n${n} arquivos, larguras ${LARGURAS.join('/')}, avif + webp.`);
}

main().catch((err) => {
  console.error('\nFalhou:', err.message);
  process.exit(1);
});

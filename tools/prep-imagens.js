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
// site/ e a unica pasta publicada. Ferramenta e fonte ficam de fora dela.
const SAIDA = path.join(RAIZ, 'site', 'img', 'produtos');

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

  /* Fotos recortadas de uma colagem. Vem altas e estreitas (0,52 a 0,59), e
     chegar em 4:5 joga fora de 26% a 35% da altura — entao ONDE cortar muda
     de peca pra peca e nao da pra usar uma regra so:

       calca    'bottom'  a barra flare e o produto; sem ela e so uma calca
       conjunto 'centre'  foto de estudio, cabe inteira
       vestido  'top'     o corpete franzido e o detalhe; a barra sai
       blusa    'top'     o franzido lateral fica na cintura

     Sao ~450px de largura, contra 960 das outras. O card aguenta, o modal
     nao: e a razao de LARGURAS_BAIXA existir mais abaixo. Trocar assim que
     a loja mandar as fotos individuais em vez da colagem. */
  { fonte: '_recortes/calca-vinho.png',    slug: 'calca-vinho',   posicao: 'bottom' },
  { fonte: '_recortes/conjunto-vinho.png', slug: 'conjunto-vinho', posicao: 'centre' },
  { fonte: '_recortes/blusa-marinho.png',  slug: 'blusa-marinho',  posicao: 'top' },

  /* ── Lote de 2026-07-23 ────────────────────────────────────

     Nove pecas novas, em tres formatos de fonte diferentes:

       720x1280 (0,563)   fotos da loja, celular em retrato. Sao as mais
                          fora de proporcao do lote: chegar a 4:5 custa 380px
                          de altura, entao a janela e escolhida peca a peca
                          pra manter o rosto E a peca. O que sobra da barra
                          fica na foto inteira, que e um toque adiante.
       1024x1280 (0,800)  ja nasce 4:5, nao corta nada.
       demais             catalogo do fornecedor, corte pequeno.

     As de 720 de largura saem so em 400 e 800 (o 800 ja e 1,11x de ampliacao,
     aceitavel; 960 seria 1,33x). Quem declara isso pro site e o campo
     'larguras' em produtos.js — se esquecer la, o srcset promete um arquivo
     que nao existe e a foto some em tela densa. */

  { fonte: 'IMG-20260720-WA0107.jpg',            slug: 'calca-cinza',        recorte: { left: 0, top: 100, width: 720, height: 900 } },
  { fonte: 'IMG-20260720-WA0108.jpg',            slug: 'vestido-preto-colado', recorte: { left: 0, top: 80, width: 720, height: 900 } },
  { fonte: 'novas-2026-07-20/17.27.59.jpg',      slug: 'short-preto',        recorte: { left: 0, top: 0,   width: 720, height: 900 } },
  { fonte: 'novas-2026-07-20/17.28.00(1).jpg',   slug: 'vestido-marrom',     recorte: { left: 0, top: 100, width: 720, height: 900 } },
  { fonte: 'novas-2026-07-20/17.28.00(3).jpg',   slug: 'blusa-verde',        recorte: { left: 0, top: 50,  width: 720, height: 900 } },

  // Ja e 4:5 exato: a unica do lote que nao perde um pixel.
  { fonte: 'IMG-20260720-WA0111.jpg',            slug: 'short-doll-branco',  recorte: { left: 0, top: 0, width: 1024, height: 1280 } },

  // 0,837: sobra largura, nao altura. Os 47px saem repartidos pra modelo
  // continuar centrada.
  { fonte: 'IMG-20260720-WA0110.jpg',            slug: 'robe-preto',         recorte: { left: 24, top: 0, width: 1024, height: 1280 } },

  { fonte: 'IMG-20260720-WA0112.jpg',            slug: 'pijama-chemise',     recorte: { left: 0, top: 100, width: 1042, height: 1302 } },

  // Colagem: figura principal a esquerda, tres circulos de cor a direita.
  // A janela mantem o rosto e os dois primeiros circulos — as outras cores
  // aparecem inteiras na foto sem corte.
  { fonte: 'IMG-20260720-WA0113.jpg',            slug: 'conjunto-renda',     recorte: { left: 0, top: 60, width: 750, height: 937 } },

  /* ── Lote de 2026-08-02: moda intima ──────────────────────

     Oito pecas, e varias com MAIS DE UMA COR — cada cor e um arquivo
     proprio, e o produtos.js junta tudo num card so. Por isso os slugs aqui
     terminam com a cor: e o que o site usa pra trocar a foto quando a cliente
     toca no circulo da cor.

     Fotos de catalogo de fornecedor, entao vem em proporcao variada (0,50 a
     0,75). O corte 4:5 e escolhido peca a peca pra manter rosto E peca — o
     que sobra da barra vive na foto inteira, um toque adiante. */

  // Pijama americano calca — R$ 189,90
  { fonte: 'novas-2026-08-02/pijama-calca-vinho.webp',   slug: 'pijama-calca-vinho',   recorte: { left: 0, top: 80,  width: 960, height: 1200 } },
  { fonte: 'novas-2026-08-02/pijama-calca-preto.webp',   slug: 'pijama-calca-preto',   recorte: { left: 0, top: 80,  width: 960, height: 1200 } },
  /* A fonte tem um terceiro arquivo, um close do vivo rosa e do bolso
     (pijama-calca-preto-detalhe.webp). Fica guardado e NAO e processado: o
     seletor do modal e de COR, e uma miniatura chamada "detalhe" no meio de
     "vinho" e "preto" quebra a leitura. Volta no dia que houver galeria. */

  // Pijama americano alca — R$ 139,90
  { fonte: 'novas-2026-08-02/pijama-alca-vinho.webp',    slug: 'pijama-alca-vinho',    recorte: { left: 0, top: 80,  width: 960, height: 1200 } },

  // Pijama americano short — R$ 149,90
  { fonte: 'novas-2026-08-02/pijama-short-vinho.webp',   slug: 'pijama-short-vinho',   recorte: { left: 0, top: 60,  width: 960, height: 1200 } },

  // Robe curto tule e renda — R$ 129,90 — tres cores
  { fonte: 'novas-2026-08-02/robe-tule-branco.webp',     slug: 'robe-tule-branco',     recorte: { left: 0, top: 40,  width: 960, height: 1200 } },
  { fonte: 'novas-2026-08-02/robe-tule-vermelho.webp',   slug: 'robe-tule-vermelho',   recorte: { left: 0, top: 110, width: 853, height: 1066 } },
  { fonte: 'novas-2026-08-02/robe-tule-preto.webp',      slug: 'robe-tule-preto',      recorte: { left: 0, top: 40,  width: 960, height: 1200 } },

  // Conjunto cinta liga — R$ 169,90 — duas fotos, tres cores na loja
  { fonte: 'novas-2026-08-02/cinta-liga-preto.webp',     slug: 'cinta-liga-preto',     recorte: { left: 0, top: 120, width: 720, height: 900 } },
  { fonte: 'novas-2026-08-02/cinta-liga-vermelho.webp',  slug: 'cinta-liga-vermelho',  recorte: { left: 0, top: 120, width: 720, height: 900 } },

  // Camisola longa — R$ 239,90 — duas cores. As fontes sao as mais altas do
  // lote (0,50 e 0,63): chegar a 4:5 joga fora quase 40% da altura, entao o
  // corte fica no busto e a barra da camisola vive na foto inteira.
  // top=0: a modelo tem o rosto no topo do quadro, e qualquer folga aqui o
  // decapita. Medido — com top=150 o corte comecava no queixo.
  { fonte: 'novas-2026-08-02/camisola-longa-branca.webp', slug: 'camisola-longa-branca', recorte: { left: 0, top: 0, width: 681, height: 851 } },
  { fonte: 'novas-2026-08-02/camisola-longa-preta.webp',  slug: 'camisola-longa-preta',  recorte: { left: 0, top: 120, width: 855, height: 1069 } },

  /* Conjunto top tomara que caia — R$ 117,90.

     Selfie de espelho, o rosto ja vem cortado na altura da boca na fonte.
     top=0 preserva o que sobrou dele: sem isso o card vira tronco sem cabeca,
     que le como foto anatomica em vez de foto de peca. */
  { fonte: 'novas-2026-08-02/top-tomara-nude.webp',      slug: 'top-tomara-nude',      recorte: { left: 0, top: 0, width: 900, height: 1125 } },

  // Pijama infantil — R$ 129,90 — 2 a 12 anos
  { fonte: 'novas-2026-08-02/infantil-menina.webp',      slug: 'infantil-menina',      recorte: { left: 0, top: 40,  width: 864, height: 1080 } },
  { fonte: 'novas-2026-08-02/infantil-menino.webp',      slug: 'infantil-menino',      recorte: { left: 0, top: 50,  width: 747, height: 934 } },

  /* ── Lote de 2026-08-12 ────────────────────────────────────

     Fotos de loja 960x1280 (0,750), como as primeiras do arquivo: o 4:5 tira
     80px do topo (o trilho de luz e as luminarias de corda que so poluem o
     quadro). Duas novidades:

       macacao   ganha a cor Azul Marinho (a Marrom ja existia)
       wide leg  peca nova, em duas lavagens — cada uma seu arquivo, juntas
                 num card so pelo produtos.js (claro e escuro) */
  { fonte: 'loja-conjunto-azul-marinho.webp', slug: 'conjunto-azul-marinho',   recorte: { left: 0, top: 80, width: 960, height: 1200 } },
  { fonte: 'loja-jeans-wide-claro.webp',      slug: 'calca-jeans-wide-claro',  recorte: { left: 0, top: 80, width: 960, height: 1200 } },
  { fonte: 'loja-jeans-wide-escuro.webp',     slug: 'calca-jeans-wide-escuro', recorte: { left: 0, top: 80, width: 960, height: 1200 } },

  /* Mais pecas do mesmo dia (fotos de loja). Quase todas 960x1280 (top 80); a
     blusa veio 1200x1600, entao o recorte e proporcional (top 100, 1200x1500 =
     4:5) e ela sai ate 960 como as outras. */
  { fonte: 'loja-conjunto-colete-calca.webp', slug: 'conjunto-colete-calca',   recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },
  { fonte: 'loja-vestido-bengaline.webp',     slug: 'vestido-bengaline',       recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },
  { fonte: 'loja-blusa-assimetrica.webp',     slug: 'blusa-assimetrica',       recorte: { left: 0, top: 100, width: 1200, height: 1500 } },
  { fonte: 'loja-conjunto-alfaiataria.webp',  slug: 'conjunto-alfaiataria',    recorte: { left: 0, top: 80,  width: 960,  height: 1200 } },

  /* Pijama malha fria: liso e estampado sao DOIS produtos no site (precos
     diferentes). Liso = marinho (896px de fonte, sai ate 800). Estampado = dois
     desenhos (coracoes e lacos) num card so. */
  { fonte: 'loja-pijama-marinho.webp',  slug: 'pijama-malha-fria-liso',    recorte: { left: 0, top: 76, width: 896, height: 1120 } },
  { fonte: 'loja-pijama-coracoes.webp', slug: 'pijama-estampado-coracoes', recorte: { left: 0, top: 80, width: 960, height: 1200 } },
  { fonte: 'loja-pijama-lacos.webp',    slug: 'pijama-estampado-lacos',    recorte: { left: 0, top: 80, width: 960, height: 1200 } },
];

// Fonte de 720 ou 750 de largura: 960 seria ampliacao de 1,3x, que engorda o
// arquivo sem entregar detalhe. Tem que bater com 'larguras' no produtos.js.
const SO_ATE_800 = new Set([
  'calca-cinza', 'vestido-preto-colado', 'short-preto', 'vestido-marrom',
  'blusa-verde', 'conjunto-renda',
  // Lote de 2026-08-02: fontes de 681 a 747 de largura.
  'cinta-liga-preto', 'cinta-liga-vermelho',
  'camisola-longa-branca', 'infantil-menino',
  // Lote 2026-08-12: liso do pijama tem 896px de fonte.
  'pijama-malha-fria-liso',
]);

/* Fonte pequena nao ganha nada sendo ampliada: 960 a partir de 450 e 2,1x de
   borrao ocupando 100 KB. Melhor entregar o que existe e deixar o navegador
   esticar, que e honesto no srcset.

   ATENCAO — isto tem um par no site/js/produtos.js. Toda peca que sai daqui
   com LARGURAS_BAIXA precisa do campo `larguras: [400, 800]` la, senao o
   srcset promete um -960 que nao existe: em tela densa o navegador pede esse
   arquivo, leva 404, e como o <picture> nao cai pra proxima <source> a foto
   simplesmente some. Ja aconteceu com estas tres. */
const LARGURAS_BAIXA = [400, 800];

// Teto da foto inteira. So carrega quando a cliente toca pra ver, entao pode
// ser maior que os cards — mas nao ha o que ganhar acima disso: a fonte mais
// larga do lote tem 1066px.
const TETO_INTEIRA = 1200;

async function conferirFonte(arquivo, recorte) {
  const src = path.join(FONTES, arquivo);
  const { width, height } = await sharp(src).metadata();
  if (!recorte) return { src, width, height };

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
  return { src, width, height };
}

async function main() {
  // Regera do zero: peca que sai da vitrine nao deve deixar arquivo pra tras
  // enganando quem olhar a pasta depois.
  fs.rmSync(SAIDA, { recursive: true, force: true });
  fs.mkdirSync(SAIDA, { recursive: true });

  let n = 0;
  for (const alvo of alvos) {
    const { src, width } = await conferirFonte(alvo.fonte, alvo.recorte);

    // Duas formas de chegar em 4:5. 'recorte' e janela exata, medida a mao,
    // pra foto que so precisa perder uma faixa. 'posicao' e corte por cover,
    // pra foto muito fora de proporcao, onde o que importa e qual ponta fica.
    const cortar = (s) =>
      alvo.recorte
        ? s.extract(alvo.recorte)
        : s.resize(width, Math.round(width / 0.8), { fit: 'cover', position: alvo.posicao });

    const larguras =
      alvo.posicao || SO_ATE_800.has(alvo.slug) ? LARGURAS_BAIXA : LARGURAS;

    for (const largura of larguras) {
      const base = cortar(sharp(src)).resize({ width: largura });
      await base.clone().avif({ quality: 55, effort: 6 })
        .toFile(path.join(SAIDA, `${alvo.slug}-${largura}.avif`));
      await base.clone().webp({ quality: 80 })
        .toFile(path.join(SAIDA, `${alvo.slug}-${largura}.webp`));
      n += 2;
    }

    /* A foto INTEIRA, sem corte nenhum.

       O 4:5 da grade e o que faz as pecas lerem como um conjunto, mas ele
       joga fora ate um terco da imagem — e o que sai costuma ser a barra da
       peca, que e justamente o que a cliente quer ver antes de perguntar.
       Esta versao vive so no visualizador: carrega quando ela toca na foto,
       nunca antes. */
    const inteira = sharp(src).resize({ width: TETO_INTEIRA, withoutEnlargement: true });
    await inteira.clone().avif({ quality: 58, effort: 6 })
      .toFile(path.join(SAIDA, `${alvo.slug}-inteira.avif`));
    await inteira.clone().webp({ quality: 82 })
      .toFile(path.join(SAIDA, `${alvo.slug}-inteira.webp`));
    n += 2;

    const dim = alvo.recorte
      ? `${alvo.recorte.width}x${alvo.recorte.height}`
      : `${width}x${Math.round(width / 0.8)} (${alvo.posicao})`;
    console.log(
      `${alvo.fonte.replace('_recortes/', '').padEnd(28)} -> ` +
      `${alvo.slug.padEnd(16)} [${dim}] + inteira` +
      `${alvo.posicao ? '  <- fonte pequena' : ''}`
    );
  }

  console.log(`\n${n} arquivos, avif + webp.`);
}

main().catch((err) => {
  console.error('\nFalhou:', err.message);
  process.exit(1);
});

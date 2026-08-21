/* ═══════════════════════════════════════════════════════════
   PRODUTOS — a unica coisa que precisa ser editada pra trocar a vitrine.
   ═══════════════════════════════════════════════════════════ */

// Numero da loja: (63) 99126-6674.
// Formato: DDI + DDD + numero, sem espacos, tracos ou parenteses.
const WHATSAPP = '5563991266674';

/*
  Cada item e nomeado pela peca principal da foto, nao pelo look inteiro.
  Metade sao pecas unicas (vestido, camisola) e metade sao looks montados
  (polo com jeans, body com calca) — nesses, a outra peca e styling, que e
  como loja de verdade faz.

  Campos:
    slug      arquivo em img/produtos/{slug}-{400,800,960}.{avif,webp}
    nome      aparece no card e na mensagem do WhatsApp
    preco     string pronta, ja formatada
    categoria  um dos ids de CATEGORIAS, logo abaixo
    tamanhos  varia peca a peca, por isso e campo e nao const global
    alt       descricao pra leitor de tela. Nao e opcional
    larguras  OPCIONAL. So pra foto cuja fonte e pequena demais pra gerar 960.
              Tem que bater com o que o tools/prep-imagens.js gerou de verdade:
              se o srcset prometer um arquivo que nao existe, o navegador em
              tela densa pede o 960, leva 404, e a foto some. Sem o campo, o
              padrao e [400, 800, 960]
    cores     OPCIONAL. A MESMA peca em cores diferentes, num card so — cada
              cor tem sua propria foto e seu proprio slug. O 'slug' do produto
              e sempre o da PRIMEIRA cor: e ele que aparece no card da grade.
              No modal a cliente toca na miniatura e a foto troca; a cor
              escolhida vai junto na mensagem do WhatsApp.
              Cada cor aceita 'larguras' proprio, porque as fotos chegam da
              loja em tamanhos diferentes e a largura do produto nao serve
              pra todas
    nota      OPCIONAL. Uma linha curta no modal. Serve pro que a loja mandou
              como "verificar disponibilidade de cores" — dizer que existem
              outras cores e honesto; inventar quais nao e

  A ordem e a ordem da grade: cor alternada pra nenhuma fileira ficar monotona
  (2 col no celular, 3 no desktop).

  SOBRE TAMANHO: so as pecas do lote de 2026-08-02 tem grade confirmada pela
  loja. Nas outras o campo e chute meu marcado PLACEHOLDER — trocar assim que
  a loja passar a grade real, porque tamanho errado faz a cliente pedir o que
  nao existe e a conversa comeca com uma negativa.
*/

/*
  As categorias do filtro, na ordem em que os botoes aparecem.

  O eixo e PARTE DO CORPO, e nao tipo de produto. E como a cliente procura:
  ela quer "uma blusa" ou "uma calca", nao "uma roupa". Moda intima fica de
  fora desse eixo porque e a outra metade da loja — a bio deles diz "Moda
  Intima e composicoes de Looks", entao sao dois assuntos, nao um.

  Categoria sem nenhuma peca nao vira botao: o app.js so desenha o que tem
  conteudo. Da pra deixar uma linha aqui esperando as fotos chegarem sem
  sujar a tela — foi o que aconteceu com praia.
*/
const CATEGORIAS = [
  { id: 'cima',     nome: 'Parte de cima' },
  { id: 'baixo',    nome: 'Parte de baixo' },
  { id: 'unica',    nome: 'Peça única' },
  { id: 'intima',   nome: 'Moda íntima' },
  // Fora do eixo "parte do corpo", como moda intima: e outro publico, nao
  // outro pedaco da mesma cliente.
  { id: 'infantil', nome: 'Infantil' },
  { id: 'praia',    nome: 'Praia' },  // sem peca ainda: nao aparece
];

const PRODUTOS = [
  {
    slug: 'vestido-vinho',
    nome: 'Vestido Vinho Gola Alta',
    preco: 'R$ 289,90', // PLACEHOLDER
    categoria: 'unica',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER — a loja nao passou a grade
    alt: 'Modelo veste vestido vinho midi de gola alta com recorte no busto',
  },
  {
    slug: 'camisola-rose',
    nome: 'Camisola Renda Rosé',
    preco: 'R$ 109,90', // A CONFERIR: a loja mandou "Camisola: 109,90" sem foto junto
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER — a loja nao passou a grade
    alt: 'Modelo veste camisola rosé de renda com robe combinando',
  },
  {
    slug: 'vestido-preto-colado',
    nome: 'Vestido Preto Justo',
    preco: 'R$ 259,90', // confirmado pela loja
    categoria: 'unica',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste vestido preto midi justo de ombro único com fenda lateral',
    larguras: [400, 800], // fonte 720x1280: nao ha 960
  },
  {
    slug: 'blusa-verde',
    nome: 'Blusa Verde Ombro Único',
    preco: 'R$ 119,90', // PLACEHOLDER — estimado, a loja ainda nao passou
    categoria: 'cima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste blusa verde claro de ombro único com fivela dourada e calça jeans wide',
    larguras: [400, 800],
  },
  {
    slug: 'calca-cinza',
    nome: 'Calça Cinza com Cinto',
    preco: 'R$ 239,90', // confirmado pela loja
    categoria: 'baixo',
    tamanhos: ['36', '38', '40', '42'], // PLACEHOLDER
    alt: 'Modelo veste calça cinza de tecido com cinto lateral e blusa preta de ombro único',
    larguras: [400, 800],
  },
  {
    slug: 'conjunto-renda',
    nome: 'Conjunto de Renda',
    preco: 'R$ 104,90', // confirmado pela loja
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste conjunto de renda azul petróleo, também disponível em preto, marrom e branco',
    larguras: [400, 800],
  },
  {
    slug: 'robe-preto',
    nome: 'Robe de Renda Preto',
    preco: 'R$ 129,90', // confirmado pela loja
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste robe preto de renda transparente com faixa de amarrar',
  },
  {
    slug: 'calca-vinho',
    nome: 'Calça Flare Vinho',
    preco: 'R$ 249,90', // confirmado pela loja
    categoria: 'baixo',
    tamanhos: ['36', '38', '40', '42'], // PLACEHOLDER
    alt: 'Modelo veste calça flare vinho de alfaiataria com blusa preta',
    larguras: [400, 800], // recortada da colagem: fonte tem ~480px, nao ha 960
  },
  {
    slug: 'short-doll-branco',
    nome: 'Short Doll Branco de Seda',
    preco: 'R$ 219,90', // confirmado pela loja
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste short doll branco de seda com acabamento em renda',
  },
  {
    slug: 'vestido-preto',
    nome: 'Vestido Preto Midi',
    preco: 'R$ 319,90', // confirmado pela loja
    categoria: 'unica',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER — a loja ainda nao passou
    alt: 'Modelo veste vestido preto midi de gola alta sem mangas',
  },
  {
    slug: 'conjunto-vinho',
    nome: 'Conjunto Colete e Calça Vinho',
    preco: 'R$ 319,90', // confirmado pela loja
    categoria: 'unica',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste conjunto vinho de colete alfaiataria e calça reta',
    larguras: [400, 800], // recortada da colagem: fonte tem ~450px, nao ha 960
  },
  {
    slug: 'short-preto',
    nome: 'Short Alfaiataria Preto',
    preco: 'R$ 169,90', // PLACEHOLDER — estimado, a loja ainda nao passou
    categoria: 'baixo',
    tamanhos: ['36', '38', '40', '42'], // PLACEHOLDER
    alt: 'Modelo veste short preto de alfaiataria com blusa preta franzida',
    larguras: [400, 800],
  },
  {
    slug: 'blusa-marinho',
    nome: 'Blusa Marinho Franzida',
    preco: 'R$ 109,90', // confirmado pela loja
    categoria: 'cima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste blusa marinho sem mangas com franzido lateral e calça jeans',
    larguras: [400, 800], // recortada da colagem: fonte tem ~490px, nao ha 960
  },
  {
    slug: 'pijama-chemise',
    nome: 'Pijama Chemise Preto',
    preco: 'R$ 139,90', // confirmado pela loja
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste pijama chemise preto com vivo branco e botões',
  },
  {
    slug: 'conjunto-marrom',
    nome: 'Macacão Tomara Que Caia',
    preco: 'R$ 319,90', // PLACEHOLDER
    categoria: 'unica',
    // Fallback: vale pra cor que nao declarar a sua grade. Hoje as duas
    // declaram, entao este so existe por seguranca.
    tamanhos: ['P', 'M', 'G'],
    alt: 'Modelo veste conjunto marrom de top tomara que caia e calça pantalona',
    // Grade veio da loja POR COR: Marrom em P/M/G, Azul Marinho so no G. Cada
    // cor so oferece o que existe — 'tamanhos' por cor evita a cliente pedir um
    // tamanho fantasma (a regra que o resto do catalogo persegue).
    // FOTO PENDENTE: 'conjunto-azul-marinho' ainda nao existe em img/produtos;
    // ate a original entrar e o prep-imagens rodar, essa cor abre quebrada.
    cores: [
      { nome: 'Marrom', slug: 'conjunto-marrom', tamanhos: ['P', 'M', 'G'] },
      { nome: 'Azul Marinho', slug: 'conjunto-azul-marinho', tamanhos: ['G'] },
    ],
  },
  {
    slug: 'polo-preta',
    nome: 'Polo Canelada Preta',
    preco: 'R$ 129,90', // PLACEHOLDER
    categoria: 'cima',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER — a loja nao passou a grade
    alt: 'Modelo veste polo preta canelada com calça jeans escura',
  },

  /* ── Lote de 2026-08-02 ─────────────────────────────────────

     Preco e grade de tamanho vieram da loja, conferidos um a um. Sao as
     UNICAS pecas do catalogo com tamanho confirmado. */

  {
    slug: 'pijama-calca-vinho',
    nome: 'Pijama Americano Calça',
    preco: 'R$ 189,90',
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G', 'GG'],
    alt: 'Modelo veste pijama americano de camisa e calça em malha fria vinho com vivo branco',
    cores: [
      { nome: 'Vinho', slug: 'pijama-calca-vinho' },
      { nome: 'Preto', slug: 'pijama-calca-preto' },
    ],
    nota: 'Malha fria. Consulte outras cores disponíveis.',
  },
  {
    slug: 'camisola-longa-branca',
    nome: 'Camisola Longa de Renda',
    preco: 'R$ 239,90',
    categoria: 'intima',
    tamanhos: ['M', 'G'],
    alt: 'Modelo veste camisola longa branca com busto em renda e alças finas',
    cores: [
      // Largura por cor: a fonte da branca tem 681px e a da preta 855px. Uma
      // largura so pro produto quebraria uma das duas.
      { nome: 'Branca', slug: 'camisola-longa-branca', larguras: [400, 800] },
      { nome: 'Preta', slug: 'camisola-longa-preta' },
    ],
  },
  {
    slug: 'pijama-short-vinho',
    nome: 'Pijama Americano Short',
    preco: 'R$ 149,90',
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G', 'GG'],
    alt: 'Modelo veste pijama americano de camisa e short em malha fria vinho com vivo branco',
    nota: 'Malha fria. Consulte as cores disponíveis.',
  },
  {
    slug: 'robe-tule-branco',
    nome: 'Robe Curto Tule e Renda',
    preco: 'R$ 129,90',
    categoria: 'intima',
    tamanhos: ['Único'],
    alt: 'Modelo veste robe curto branco de tule com renda e mangas flare',
    cores: [
      { nome: 'Branco', slug: 'robe-tule-branco' },
      { nome: 'Vermelho', slug: 'robe-tule-vermelho' },
      { nome: 'Preto', slug: 'robe-tule-preto' },
    ],
  },
  {
    slug: 'pijama-alca-vinho',
    nome: 'Pijama Americano Alça',
    preco: 'R$ 139,90',
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G', 'GG'],
    alt: 'Modelo veste pijama americano de alça e short em malha fria vinho com vivo branco',
    nota: 'Malha fria. Consulte cores e tamanhos disponíveis.',
  },
  {
    slug: 'cinta-liga-preto',
    nome: 'Conjunto Cinta Liga',
    preco: 'R$ 169,90',
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G', 'GG'],
    alt: 'Modelo veste conjunto de lingerie preto em renda com cinta liga',
    cores: [
      { nome: 'Preto', slug: 'cinta-liga-preto' },
      { nome: 'Vermelho', slug: 'cinta-liga-vermelho' },
    ],
    // A loja mandou "preto, branco e vermelho", mas so veio foto de dois. A
    // nota conta a verdade sem inventar uma miniatura que nao existe.
    nota: 'Também disponível em branco.',
    larguras: [400, 800], // fonte 720px de largura
  },
  {
    slug: 'top-tomara-nude',
    nome: 'Conjunto Top Tomara que Caia',
    preco: 'R$ 117,90',
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G', 'GG'],
    alt: 'Modelo veste conjunto tomara que caia nude com calcinha de cintura alta',
    nota: 'Consulte as cores disponíveis.',
  },
  {
    slug: 'infantil-menina',
    nome: 'Pijama Americano Infantil',
    preco: 'R$ 129,90',
    categoria: 'infantil',
    // Numeracao por idade, e nao P/M/G: e como roupa infantil e vendida.
    tamanhos: ['2', '4', '6', '8', '10', '12'],
    alt: 'Criança veste pijama americano infantil de camisa e short com estampa de bichos',
    cores: [
      { nome: 'Menina', slug: 'infantil-menina' },
      // Fonte de 747px: sem isto o srcset prometeria um 960 inexistente e a
      // foto sumiria em tela densa.
      { nome: 'Menino', slug: 'infantil-menino', larguras: [400, 800] },
    ],
    nota: 'Tamanhos de 2 a 12 anos. Consulte as estampas disponíveis.',
  },

  /* ── Lote de 2026-08-12 ──────────────────────────────────── */
  {
    slug: 'calca-jeans-wide-claro',
    nome: 'Calça Jeans Wide Leg',
    preco: 'R$ 309,90', // confirmado pela loja
    categoria: 'baixo',
    tamanhos: ['36', '38', '40'], // confirmado pela loja
    alt: 'Modelo veste calça jeans wide leg de cintura alta e pernas bem amplas',
    // Duas lavagens da mesma modelagem, num card so. O slug do produto e o da
    // PRIMEIRA cor (claro), que e a que aparece na grade. Fontes 960px, entao
    // as duas saem em 400/800/960 e nenhuma precisa de 'larguras'.
    cores: [
      { nome: 'Azul Claro', slug: 'calca-jeans-wide-claro' },
      { nome: 'Azul Escuro', slug: 'calca-jeans-wide-escuro' },
    ],
  },
  {
    slug: 'conjunto-colete-calca',
    nome: 'Conjunto Colete + Calça',
    preco: 'R$ 319,90', // confirmado pela loja
    categoria: 'unica',
    tamanhos: ['P', 'M'], // confirmado pela loja
    alt: 'Modelo veste conjunto de colete alfaiatado e calça reta na cor vinho',
  },
  {
    slug: 'vestido-bengaline',
    nome: 'Vestido Justo em Bengaline',
    preco: 'R$ 249,90', // confirmado pela loja
    categoria: 'unica',
    tamanhos: ['PP', 'M', 'G'], // confirmado pela loja
    alt: 'Modelo veste vestido midi justo em bengaline vinho de gola alta com recorte no busto',
  },
  {
    slug: 'blusa-assimetrica',
    nome: 'Blusa Assimétrica com Ombreira',
    preco: 'R$ 109,90', // confirmado pela loja
    categoria: 'cima',
    tamanhos: ['P', 'M', 'G'], // confirmado pela loja
    alt: 'Modelo veste blusa assimétrica de um ombro só com ombreira estruturada',
  },
  {
    slug: 'conjunto-alfaiataria',
    nome: 'Conjunto Alfaiataria',
    preco: 'R$ 459,90', // confirmado pela loja
    categoria: 'unica',
    tamanhos: ['38', '40'], // confirmado pela loja
    alt: 'Modelo veste conjunto de alfaiataria cinza com blusa de manga bufante em um ombro e calça pantalona',
  },

  /* Pijama malha fria: liso e estampado sao DOIS produtos porque o preco muda
     (149,90 x 154,90) e o modelo tem UM preco por peca. */
  {
    slug: 'pijama-malha-fria-liso',
    nome: 'Pijama Americano Malha Fria Liso',
    preco: 'R$ 149,90', // confirmado pela loja
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G', 'GG'], // confirmado pela loja
    alt: 'Modelo veste pijama americano de manga curta em malha fria azul marinho com vivo branco',
    larguras: [400, 800], // fonte 896px de largura
  },
  {
    slug: 'pijama-estampado-coracoes',
    nome: 'Pijama Americano Malha Fria Estampado',
    preco: 'R$ 154,90', // confirmado pela loja
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G', 'GG'], // confirmado pela loja
    alt: 'Modelo veste pijama americano de manga curta em malha fria com estampa',
    cores: [
      { nome: 'Corações', slug: 'pijama-estampado-coracoes' },
      { nome: 'Laços', slug: 'pijama-estampado-lacos' },
    ],
  },
];

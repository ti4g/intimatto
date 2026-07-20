/* ═══════════════════════════════════════════════════════════
   PRODUTOS — a unica coisa que precisa ser editada pra trocar a vitrine.
   ═══════════════════════════════════════════════════════════ */

// TROCAR: numero da loja. Hoje aponta pro Tiago.
// Formato: DDI + DDD + numero, sem espacos, tracos ou parenteses.
const WHATSAPP = '5563999614831';

/*
  Cada item e nomeado pela peca principal da foto, nao pelo look inteiro.
  Metade sao pecas unicas (vestido, camisola) e metade sao looks montados
  (polo com jeans, body com calca) — nesses, a outra peca e styling, que e
  como loja de verdade faz.

  Campos:
    slug      arquivo em img/produtos/{slug}-{400,800,960}.{avif,webp}
    nome      aparece no card e na mensagem do WhatsApp
    preco     string pronta, ja formatada
    categoria 'roupa' | 'intima' | 'praia'. O filtro nao existe no piloto (com
              6 pecas seria decoracao), mas o campo ja nasce aqui pra ele
              entrar em poucas linhas depois
    tamanhos  varia peca a peca, por isso e campo e nao const global
    alt       descricao pra leitor de tela. Nao e opcional

  A ordem e a ordem da grade: cor alternada pra nenhuma fileira ficar monotona
  (2 col no celular, 3 no desktop).
*/

const PRODUTOS = [
  {
    slug: 'vestido-vinho',
    nome: 'Vestido Vinho Gola Alta',
    preco: 'R$ 289,90', // PLACEHOLDER
    categoria: 'roupa',
    tamanhos: ['P', 'M', 'G'],
    alt: 'Modelo veste vestido vinho midi de gola alta com recorte no busto',
  },
  {
    slug: 'camisola-rose',
    nome: 'Camisola Renda Rosé',
    preco: 'R$ 159,90', // PLACEHOLDER
    categoria: 'intima',
    tamanhos: ['P', 'M', 'G'],
    alt: 'Modelo veste camisola rosé de renda com robe combinando',
  },
  {
    slug: 'jeans-wide',
    nome: 'Calça Wide Leg Jeans',
    preco: 'R$ 229,90', // PLACEHOLDER
    categoria: 'roupa',
    tamanhos: ['36', '38', '40', '42'],
    alt: 'Modelo veste body preto com calça jeans wide leg azul claro',
  },
  {
    slug: 'vestido-preto',
    nome: 'Vestido Preto Midi',
    preco: 'R$ 279,90', // PLACEHOLDER
    categoria: 'roupa',
    tamanhos: ['M', 'G'], // PLACEHOLDER — aqui pra provar que varia por peca
    alt: 'Modelo veste vestido preto midi de gola alta sem mangas',
  },
  {
    slug: 'conjunto-marrom',
    nome: 'Conjunto Pantalona Marrom',
    preco: 'R$ 319,90', // PLACEHOLDER
    categoria: 'roupa',
    tamanhos: ['P', 'M', 'G'],
    alt: 'Modelo veste conjunto marrom de top tomara que caia e calça pantalona',
  },
  {
    slug: 'polo-preta',
    nome: 'Polo Canelada Preta',
    preco: 'R$ 129,90', // PLACEHOLDER
    categoria: 'roupa',
    tamanhos: ['P', 'M', 'G'],
    alt: 'Modelo veste polo preta canelada com calça jeans escura',
  },
];

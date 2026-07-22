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
    categoria 'roupa' | 'intima' | 'praia'. O filtro nao existe no piloto (com
              6 pecas seria decoracao), mas o campo ja nasce aqui pra ele
              entrar em poucas linhas depois
    tamanhos  varia peca a peca, por isso e campo e nao const global
    alt       descricao pra leitor de tela. Nao e opcional
    larguras  OPCIONAL. So pra foto cuja fonte e pequena demais pra gerar 960.
              Tem que bater com o que o tools/prep-imagens.js gerou de verdade:
              se o srcset prometer um arquivo que nao existe, o navegador em
              tela densa pede o 960, leva 404, e a foto some. Sem o campo, o
              padrao e [400, 800, 960]

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
    preco: 'R$ 319,90', // confirmado pela loja
    categoria: 'roupa',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER — a loja ainda nao passou
    alt: 'Modelo veste vestido preto midi de gola alta sem mangas',
  },
  {
    slug: 'calca-vinho',
    nome: 'Calça Flare Vinho',
    preco: 'R$ 249,90', // confirmado pela loja
    categoria: 'roupa',
    tamanhos: ['36', '38', '40', '42'], // PLACEHOLDER
    alt: 'Modelo veste calça flare vinho de alfaiataria com blusa preta',
    larguras: [400, 800], // recortada da colagem: fonte tem ~480px, nao ha 960
  },
  {
    slug: 'conjunto-vinho',
    nome: 'Conjunto Colete e Calça Vinho',
    preco: 'R$ 319,90', // confirmado pela loja
    categoria: 'roupa',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste conjunto vinho de colete alfaiataria e calça reta',
    larguras: [400, 800], // recortada da colagem: fonte tem ~450px, nao ha 960
  },
  {
    slug: 'blusa-marinho',
    nome: 'Blusa Marinho Franzida',
    preco: 'R$ 109,90', // confirmado pela loja
    categoria: 'roupa',
    tamanhos: ['P', 'M', 'G'], // PLACEHOLDER
    alt: 'Modelo veste blusa marinho sem mangas com franzido lateral e calça jeans',
    larguras: [400, 800], // recortada da colagem: fonte tem ~490px, nao ha 960
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

  /* Pecas sem foto ainda.

     Sem 'slug' o card vira "Em breve": aparece no catalogo com nome e preco,
     mas nao abre. No dia que a foto chegar, e so gerar a imagem e escrever o
     slug aqui — nada mais muda.

     Servem tambem pra loja cadastrar a colecao inteira antes do ensaio ficar
     pronto, em vez de esperar tudo pra publicar qualquer coisa. */
  {
    nome: 'Biquíni Cortininha', // PLACEHOLDER — exemplo
    preco: 'R$ 149,90', // PLACEHOLDER
    categoria: 'praia',
    tamanhos: ['P', 'M', 'G'],
  },
  {
    nome: 'Saída de Praia Renda', // PLACEHOLDER — exemplo
    preco: 'R$ 189,90', // PLACEHOLDER
    categoria: 'praia',
    tamanhos: ['Único'],
  },
];

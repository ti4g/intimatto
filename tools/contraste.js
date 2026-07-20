/*
  Confere contraste WCAG de cada par de cores que o site usa como texto.

      node tools/contraste.js

  Existe porque o documento original afirmava que o --ouro tinha "contraste
  real sobre branco" e isso e falso: da 2,97:1, que reprova ate como texto
  grande. Chutar cor e descobrir no Lighthouse custa uma rodada; medir aqui
  custa um segundo.

  AA pede 4,5:1 pra texto normal e 3:1 pra texto grande (>=24px, ou >=18,7px
  em negrito). Elemento decorativo (fio, ponto, borda) nao tem exigencia —
  por isso o dourado pode ser linha em qualquer lugar, mas so vira texto
  onde o fundo aguenta.
*/

const CORES = {
  luz: '#f7f6f4',
  branco: '#ffffff',
  tinta: '#1a1a18',
  cinza: '#726f69',
  fio: '#dad6d0',
  ouro: '#b08a28',
  ouroClaro: '#e6be64',
  preto: '#000000',
  // Hover do botao. Contraintuitivo: o texto em cima e escuro, entao escurecer
  // o ouro APROXIMA os dois e derruba o contraste. O hover tem que CLAREAR.
  ouroHoverErrado: '#9a771f',
  ouroHover: '#c49a2e',
};

const canal = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const luminancia = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = canal((n >> 16) & 255);
  const g = canal((n >> 8) & 255);
  const b = canal(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contraste = (a, b) => {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

// [texto, fundo, onde, tamanho]
const PARES = [
  ['tinta', 'luz', 'tipografia da pagina', 'normal'],
  ['cinza', 'luz', 'labels e preco', 'normal'],
  ['tinta', 'branco', 'nome e preco no modal', 'normal'],
  ['cinza', 'branco', 'label de tamanho', 'normal'],
  ['tinta', 'ouro', 'botao do WhatsApp', 'normal'],
  ['tinta', 'ouroHover', 'botao do WhatsApp em hover', 'normal'],
  ['tinta', 'ouroHoverErrado', 'REPROVA — hover escurecendo o ouro', 'normal'],
  ['ouroClaro', 'preto', 'links do bloco preto', 'normal'],
  ['branco', 'preto', 'bloco preto', 'normal'],
  // Os que NAO passam, mantidos aqui de proposito pra ninguem tentar de novo:
  ['ouro', 'luz', 'REPROVA — dourado como texto na pagina', 'normal'],
  ['ouro', 'branco', 'REPROVA — dourado como texto no modal', 'normal'],
];

const MINIMO = { normal: 4.5, grande: 3 };

let falhou = false;
console.log('par'.padEnd(22) + 'razao'.padEnd(9) + 'AA'.padEnd(6) + 'onde');
console.log('-'.repeat(78));

for (const [t, f, onde, tam] of PARES) {
  const r = contraste(CORES[t], CORES[f]);
  const passa = r >= MINIMO[tam];
  const esperadoReprovar = onde.startsWith('REPROVA');
  if (!passa && !esperadoReprovar) falhou = true;

  console.log(
    `${t} / ${f}`.padEnd(22) +
      `${r.toFixed(2)}:1`.padEnd(9) +
      (passa ? 'ok' : 'nao').padEnd(6) +
      onde
  );
}

console.log('-'.repeat(78));
console.log(
  falhou
    ? 'FALHOU: ha texto abaixo do minimo AA.'
    : 'Todos os pares em uso passam em AA. Os marcados REPROVA nao sao usados como texto.'
);
process.exit(falhou ? 1 : 0);

/* ═══════════════════════════════════════════════════════════
   CARRINHO — o pedido. Este arquivo nao toca no DOM.

   Ele existe separado por causa de um bug real, nao por gosto de arquitetura.

   Antes havia dois estados: o localStorage guardava QUAIS pecas foram
   separadas, e um Set dentro da funcao que pintava a tela guardava QUAIS iam
   na mensagem. A pintura re-adicionava ao Set tudo que nao estivesse nele,
   entao ela nao tinha como distinguir "peca nova" de "peca que a cliente
   desmarcou de proposito" — e desmarcar nao sobrevivia a fechar e reabrir o
   painel.

   Com um estado so, o que esta aqui E o pedido. Aquele bug deixa de ser
   possivel em vez de ser consertado.

   Depende de produtos.js (PRODUTOS).
   ═══════════════════════════════════════════════════════════ */

const Carrinho = (function () {
  'use strict';

  const CHAVE = 'intimatto:provador';

  // Teto por linha. Ninguem leva 300 unidades da mesma blusa pra loja no
  // WhatsApp; o numero existe pra segurar o dedo preso no "+" e pro layout
  // nao quebrar com um numero de tres digitos.
  const TETO_QTD = 99;

  let itens = [];
  const ouvintes = [];

  /* ── Dinheiro ────────────────────────────────────────────── */
  /* Regra de dinheiro e regra de dados, nao de tela: por isso mora aqui e
     nao no arquivo que desenha. */

  // "R$ 289,90" -> 289.9. Devolve null no que nao der pra ler, pra uma peca
  // "sob consulta" nao virar total errado.
  function emNumero(preco) {
    if (!preco) return null;
    const limpo = String(preco)
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const n = parseFloat(limpo);
    return Number.isFinite(n) ? n : null;
  }

  function emReais(n) {
    return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /* O slug de uma COR tambem encontra o produto.

     Peca com varias cores tem um arquivo por cor, e o carrinho guarda o slug
     da cor escolhida — nunca o do produto. Assim a identidade do item continua
     sendo o par slug+tamanho, sem terceiro campo e sem mexer em nada do que ja
     funcionava: a cor E o slug.

     Efeito colateral util: se a loja tirar uma cor de circulacao, o item some
     do carrinho sozinho na proxima visita, pela mesma limpeza que ja descarta
     peca vendida. */
  const produtoDe = (slug) =>
    PRODUTOS.find(
      (p) => p.slug === slug || p.cores?.some((c) => c.slug === slug)
    );

  // O nome da cor, pra mensagem do WhatsApp e pra linha do provador. null
  // quando a peca nao tem cores — a maioria.
  const corDe = (slug) => {
    const p = produtoDe(slug);
    return p?.cores?.find((c) => c.slug === slug)?.nome || null;
  };

  /* ── Persistencia ────────────────────────────────────────── */

  /* Leitura tolerante de proposito. O que esta gravado veio de outra visita,
     possivelmente de outra versao do site, e nada aqui pode explodir por
     causa disso. */
  function ler() {
    let bruto;
    try {
      bruto = JSON.parse(localStorage.getItem(CHAVE) || '[]');
    } catch {
      // localStorage bloqueado (aba anonima em alguns navegadores) ou JSON
      // corrompido. O carrinho vive so nesta visita.
      return [];
    }
    if (!Array.isArray(bruto)) return [];

    return bruto
      .filter((i) => i && produtoDe(i.slug))
      .map((i) => ({
        slug: i.slug,
        tamanho: i.tamanho,
        /* Formato antigo nao tinha qtd. Isto migra sem quebrar quem ja tinha
           peca separada no navegador — inclusive o cliente, que ja viu o
           site. Math.floor + o teto seguram valor adulterado a mao. */
        qtd: Math.min(Math.max(Math.floor(Number(i.qtd) || 1), 1), TETO_QTD),
      }));
  }

  function gravar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* Sem espaco ou sem permissao. A selecao segue valendo nesta visita —
         perder o carrinho e ruim, travar a tela e pior. */
    }
  }

  function mudou() {
    gravar();
    ouvintes.forEach((fn) => fn());
  }

  const achar = (slug, tamanho) =>
    itens.findIndex((i) => i.slug === slug && i.tamanho === tamanho);

  itens = ler();

  /* ── API ─────────────────────────────────────────────────── */

  return {
    /* Copia, nao a lista interna. Quem consome nao pode mexer no estado sem
       passar pelas regras daqui — foi exatamente essa fronteira que faltava
       antes. */
    itens: () => itens.map((i) => ({ ...i })),

    contagem: () => itens.reduce((soma, i) => soma + i.qtd, 0),

    vazio: () => itens.length === 0,

    // Levar de novo a mesma peca no mesmo tamanho soma. Antes isto era um
    // beco sem saida ("ja esta no provador") que nao deixava a cliente pedir
    // duas.
    adicionar(slug, tamanho) {
      const p = produtoDe(slug);
      if (!p || !p.tamanhos.includes(tamanho)) return;

      const i = achar(slug, tamanho);
      if (i >= 0) itens[i].qtd = Math.min(itens[i].qtd + 1, TETO_QTD);
      else itens.push({ slug, tamanho, qtd: 1 });
      mudou();
    },

    mudarQtd(slug, tamanho, n) {
      const i = achar(slug, tamanho);
      if (i < 0) return;

      // Zero nao e uma quantidade valida: e a intencao de tirar a peca.
      if (n <= 0) itens.splice(i, 1);
      else itens[i].qtd = Math.min(Math.floor(n), TETO_QTD);
      mudou();
    },

    /* Trocar pra um tamanho que ja esta no carrinho FUNDE as duas linhas.
       Sem isto o carrinho ficaria com duas linhas do mesmo par slug+tamanho,
       que e estado invalido: a mensagem sairia com a peca repetida e o
       "achar" passaria a devolver sempre a primeira. */
    mudarTamanho(slug, de, para) {
      if (de === para) return;
      const origem = achar(slug, de);
      if (origem < 0) return;

      const p = produtoDe(slug);
      if (!p || !p.tamanhos.includes(para)) return;

      const destino = achar(slug, para);
      if (destino >= 0) {
        itens[destino].qtd = Math.min(itens[destino].qtd + itens[origem].qtd, TETO_QTD);
        itens.splice(origem, 1);
      } else {
        itens[origem].tamanho = para;
      }
      mudou();
    },

    tirar(slug, tamanho) {
      const i = achar(slug, tamanho);
      if (i < 0) return;
      itens.splice(i, 1);
      mudou();
    },

    /* null se QUALQUER preco nao der pra ler. Meio total engana mais do que
       total nenhum: a cliente somaria de cabeca o que falta e chegaria na
       loja com outro numero. */
    total() {
      let soma = 0;
      for (const i of itens) {
        const v = emNumero(produtoDe(i.slug)?.preco);
        if (v === null) return null;
        soma += v * i.qtd;
      }
      return soma;
    },

    // Preco da linha ja multiplicado. null pelo mesmo motivo do total.
    subtotal(item) {
      const v = emNumero(produtoDe(item.slug)?.preco);
      return v === null ? null : v * item.qtd;
    },

    aoMudar(fn) {
      ouvintes.push(fn);
    },

    emReais,
    corDe,
    produtoDe,
  };
})();

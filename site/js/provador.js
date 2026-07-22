/* ═══════════════════════════════════════════════════════════
   PROVADOR — a tela do pedido e a rota que leva ate ela.

   Nao e <dialog>. E uma secao irma do catalogo, trocada por hashchange.

   O motivo e o gesto que a cliente mais usa no celular: voltar. Com dialog,
   deslizar pra voltar SAI DO SITE. Com rota, volta pro catalogo na mesma
   altura de rolagem. De brinde, empilhar camada sobre camada fica impossivel
   por construcao — nao existe camada de topo pra empilhar.

   Depende de produtos.js (WHATSAPP), carrinho.js (Carrinho) e app.js (Peca).
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const secCatalogo = document.getElementById('catalogo');
  const secProvador = document.getElementById('provador');
  if (!secCatalogo || !secProvador) return;

  const lista = document.getElementById('provador-lista');
  const pe = document.getElementById('provador-pe');
  const vazia = document.getElementById('provador-vazia');
  const totalEl = document.getElementById('provador-total');
  const botaoWpp = document.getElementById('provador-wpp');
  const titulo = document.getElementById('provador-titulo');
  const botaoVoltar = document.getElementById('provador-voltar');
  const botaoHeader = document.getElementById('abrir-provador');
  const conta = document.getElementById('provador-conta');

  const esc = Peca.esc;
  const ROTA = '#provador';

  /* ── A rota ──────────────────────────────────────────────── */

  // Guardada aqui e nao no history: a cliente vai e volta varias vezes na
  // mesma visita, e o que importa e sempre a ultima posicao do catalogo.
  let rolagemCatalogo = 0;

  const noProvador = () => location.hash === ROTA;

  /* Esta visita empilhou #provador no historico?

     Importa pro botao "Continuar vendo": se empilhamos, o certo e history.back(),
     que CONSOME a entrada em vez de criar outra — senao o historico enche de
     idas e voltas e o gesto de voltar do celular passa a alternar entre as duas
     telas em vez de sair da pilha. Se ela chegou direto no #provador (link
     colado, ou recarregou a pagina), nao ha entrada pra consumir. */
  let empurramos = false;

  // Troca a URL sem mexer no historico. Nao dispara hashchange, entao quem
  // chama precisa pintar a tela na mao.
  function semHistorico(hash) {
    history.replaceState(null, '', hash || location.pathname + location.search);
  }

  /* O hash e a unica fonte de verdade de qual tela aparece. Tudo passa por
     aqui: carga inicial, hashchange, botao voltar do sistema. */
  function rotear() {
    /* Carrinho vazio com #provador na URL (ela recarregou depois de esvaziar,
       ou colou o link) cai no catalogo. Tela vazia orfa alcancada por URL nao
       ajuda ninguem. */
    if (noProvador() && Carrinho.vazio()) {
      semHistorico(null);
      mostrarCatalogo(false);
      return;
    }
    if (noProvador()) return mostrarProvador();

    empurramos = false;
    mostrarCatalogo(true);
  }

  function mostrarProvador() {
    if (!secProvador.hidden) return;

    rolagemCatalogo = window.scrollY;
    pintar();

    secProvador.hidden = false;
    secCatalogo.hidden = true;
    window.scrollTo(0, 0);

    // Sem isto o foco fica no botao do header, que aponta pra tela em que ela
    // ja esta — e quem usa leitor de tela nao ouve que a tela mudou.
    titulo.focus();
  }

  function mostrarCatalogo(restaurarRolagem) {
    if (!secCatalogo.hidden && secProvador.hidden) return;

    secCatalogo.hidden = false;
    secProvador.hidden = true;
    // Depois de desesconder: rolar uma secao ainda hidden nao vai a lugar
    // nenhum, porque ela nao tem altura.
    if (restaurarRolagem) window.scrollTo(0, rolagemCatalogo);
  }

  window.addEventListener('hashchange', rotear);

  /* ── Pintura ─────────────────────────────────────────────── */
  /* Duas velocidades de proposito:

       entra ou sai peca  ->  repinta a lista
       muda a quantidade  ->  atualiza NO LUGAR

     Repintar a cada toque no "+" tiraria o foco do proprio "+", e no toque
     repetido a lista pisca e engasga. */

  function pintar() {
    const itens = Carrinho.itens();

    vazia.hidden = itens.length > 0;
    pe.hidden = itens.length === 0;
    lista.hidden = itens.length === 0;

    lista.innerHTML = itens.map(linha).join('');
    atualizarPe();
  }

  function linha(item) {
    const p = PRODUTOS.find((x) => x.slug === item.slug);
    const sub = Carrinho.subtotal(item);

    const chips = p.tamanhos
      .map(
        (t) =>
          `<button class="chip" type="button" data-t="${esc(t)}" ` +
          `aria-pressed="${t === item.tamanho}">${esc(t)}</button>`
      )
      .join('');

    return `
      <li class="linha" data-slug="${esc(item.slug)}" data-tamanho="${esc(item.tamanho)}">
        <button class="linha__foto" type="button" aria-label="Ver ${esc(p.nome)}">
          <picture>
            ${Peca.fontes(p.slug, '6rem')}
            <img src="img/produtos/${esc(p.slug)}-400.webp" width="960" height="1200"
                 loading="lazy" decoding="async" alt="">
          </picture>
        </button>

        <div class="linha__info">
          <p class="linha__nome">${esc(p.nome)}</p>
          <div class="linha__tamanhos" role="group" aria-label="Tamanho de ${esc(p.nome)}">
            ${chips}
          </div>
        </div>

        <div class="linha__fim">
          <div class="linha__qtd" role="group" aria-label="Quantidade de ${esc(p.nome)}">
            <button class="qtd__passo" type="button" data-passo="-1"
                    aria-label="Tirar uma unidade">−</button>
            <span class="qtd__n">${item.qtd}</span>
            <button class="qtd__passo" type="button" data-passo="1"
                    aria-label="Somar uma unidade">+</button>
          </div>
          <p class="linha__preco">${sub === null ? '' : esc(Carrinho.emReais(sub))}</p>
        </div>

        <button class="linha__tirar" type="button"
                aria-label="Tirar ${esc(p.nome)}, tamanho ${esc(item.tamanho)}, do pedido">
          <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path d="M1 1l16 16M17 1L1 17" fill="none" stroke="currentColor" stroke-width="1.25"/>
          </svg>
        </button>
      </li>`;
  }

  /* Atualiza uma linha sem reescrever a lista. So a quantidade passa por aqui:
     trocar tamanho pode fundir duas linhas, o que e mudanca estrutural.

     Le do Carrinho em vez de confiar no numero que o clique pediu — o teto de
     unidades vive la, entao o "+" no 99 continua mostrando 99. */
  function repintarLinha(li, slug, tamanho) {
    const item = achar(slug, tamanho);
    if (!item) return;
    const sub = Carrinho.subtotal(item);
    li.querySelector('.qtd__n').textContent = item.qtd;
    li.querySelector('.linha__preco').textContent =
      sub === null ? '' : Carrinho.emReais(sub);
  }

  function atualizarPe() {
    const total = Carrinho.total();
    totalEl.innerHTML =
      total === null
        ? ''
        : `<span>Total</span><span>${esc(Carrinho.emReais(total))}</span>`;

    const n = Carrinho.contagem();
    botaoWpp.textContent =
      n === 1 ? 'Enviar 1 peça no WhatsApp' : `Enviar ${n} peças no WhatsApp`;
    botaoWpp.href = montarPedido();
  }

  const achar = (slug, tamanho) =>
    Carrinho.itens().find((i) => i.slug === slug && i.tamanho === tamanho);

  /* ── A mensagem ──────────────────────────────────────────── */

  function montarPedido() {
    const itens = Carrinho.itens();
    if (!itens.length) return '#';

    const linhas = itens.map((i) => {
      const p = PRODUTOS.find((x) => x.slug === i.slug);
      const sub = Carrinho.subtotal(i);
      return (
        `• ${p.nome} — Tam ${i.tamanho}` +
        // "un" so quando passa de 1: escrever "1 un" em toda linha e ruido.
        (i.qtd > 1 ? ` — ${i.qtd} un` : '') +
        (sub === null ? '' : ` — ${Carrinho.emReais(sub)}`)
      );
    });

    let msg = 'Olá, vim do site e tenho interesse nestas peças:\n\n' + linhas.join('\n');

    const total = Carrinho.total();
    if (total !== null) msg += `\n\nTotal: ${Carrinho.emReais(total)}`;

    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  /* ── Cliques ─────────────────────────────────────────────── */
  /* Um listener so, por delegacao na lista: o innerHTML e reescrito a cada
     mudanca estrutural e levaria junto qualquer listener preso numa linha. */

  /* O Carrinho avisa todo mundo quando muda, e a tela ouve pra se atualizar
     quando a peca entra pelo modal. Mas quando a propria tela e quem mexeu,
     esse aviso repintaria a lista inteira e desfaria a atualizacao no lugar —
     que existe justamente pra nao perder o foco do "+". Esta bandeira diz ao
     ouvinte "eu ja cuidei da tela, so cuida do header". */
  let mexendoAqui = false;

  function daqui(fn) {
    mexendoAqui = true;
    try {
      fn();
    } finally {
      mexendoAqui = false;
    }
  }

  lista.addEventListener('click', (e) => {
    const li = e.target.closest('.linha');
    if (!li) return;

    const { slug, tamanho } = li.dataset;
    const item = achar(slug, tamanho);
    if (!item) return;

    if (e.target.closest('.linha__foto')) return Peca.abrir(slug, tamanho);

    if (e.target.closest('.linha__tirar')) {
      return daqui(() => {
        Carrinho.tirar(slug, tamanho);
        depoisDeMudarEstrutura(li);
      });
    }

    const passo = e.target.closest('.qtd__passo');
    if (passo) {
      const nova = item.qtd + Number(passo.dataset.passo);
      return daqui(() => {
        Carrinho.mudarQtd(slug, tamanho, nova);
        // Chegou a zero: a peca saiu, a linha some e o foco precisa de um novo
        // lar. Caso contrario e so o numero e o preco que mudam.
        if (nova <= 0) return depoisDeMudarEstrutura(li);
        repintarLinha(li, slug, tamanho);
        atualizarPe();
      });
    }

    const chip = e.target.closest('.chip');
    if (chip && chip.dataset.t !== tamanho) {
      const posicao = [...lista.children].indexOf(li);
      return daqui(() => {
        Carrinho.mudarTamanho(slug, tamanho, chip.dataset.t);
        /* Repinta porque trocar pra um tamanho que ja esta no carrinho funde
           as duas linhas — a lista muda de tamanho, nao so de conteudo. */
        pintar();
        const linhas = lista.querySelectorAll('.linha');
        const alvo = linhas[Math.min(posicao, linhas.length - 1)];
        alvo?.querySelector('.chip[aria-pressed="true"]')?.focus();
      });
    }
  });

  /* O innerHTML reescrito destroi o elemento que tinha o foco, e o foco cai no
     <body> — quem navega por teclado volta pro comeco do documento. */
  function depoisDeMudarEstrutura(li) {
    const posicao = [...lista.children].indexOf(li);
    pintar();

    /* Esvaziou pela mao dela: mostra o estado vazio e manda o foco pro caminho
       de volta. Trocar a tela debaixo dela no exato momento em que ela tira a
       ultima peca seria brusco — o redirecionamento existe so pra quem CHEGA
       com o carrinho vazio, pela URL. */
    if (Carrinho.vazio()) return botaoVoltar?.focus();

    const linhas = lista.querySelectorAll('.linha');
    const alvo = linhas[Math.min(posicao, linhas.length - 1)];
    alvo?.querySelector('.linha__tirar')?.focus();
  }

  botaoVoltar?.addEventListener('click', () => {
    // Consome a entrada que empilhamos, em vez de criar outra por cima.
    if (empurramos) return history.back();
    // Ela chegou direto no #provador: nao ha entrada nossa pra desfazer, e
    // history.back() aqui a levaria pra fora do site.
    semHistorico(null);
    rotear();
  });

  /* ── O botao do header ───────────────────────────────────── */

  function pintarHeader() {
    const n = Carrinho.contagem();
    conta.textContent = n ? String(n) : '';
    botaoHeader.toggleAttribute('data-cheia', n > 0);
    botaoHeader.setAttribute(
      'aria-label',
      n === 0 ? 'Provador vazio' : n === 1 ? 'Provador, 1 peça' : `Provador, ${n} peças`
    );
  }

  botaoHeader?.addEventListener('click', () => {
    if (Carrinho.vazio()) return;
    /* Empilha de verdade: e isto que faz o gesto de voltar do celular devolver
       o catalogo em vez de sair do site. Quem pinta a tela e o hashchange que
       esta linha dispara, nao este clique. */
    empurramos = true;
    location.hash = ROTA;
  });

  /* ── Start ───────────────────────────────────────────────── */

  Carrinho.aoMudar(() => {
    pintarHeader();
    // A tela pode estar aberta enquanto o modal soma uma peca por cima dela.
    if (!mexendoAqui && !secProvador.hidden) pintar();
  });

  pintarHeader();
  rotear();
})();

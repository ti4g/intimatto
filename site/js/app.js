/* ═══════════════════════════════════════════════════════════
   Render da grade, modal e link do WhatsApp.
   Depende de produtos.js (PRODUTOS, WHATSAPP).
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const GRID_LARGURAS = [400, 800, 960];
  const GRID_SIZES = '(min-width: 48rem) 30vw, 45vw';
  const MODAL_SIZES = '(min-width: 48rem) 27rem, 100vw';

  // Todos os recortes sao 4:5. O par serve so pra dar a proporcao intrinseca
  // antes da imagem carregar; o aspect-ratio no CSS e quem manda depois.
  const RAZAO = { w: 960, h: 1200 };

  let pecaAberta = null;
  let tamanhoEscolhido = null;

  /* ── Helpers ────────────────────────────────────────────── */

  // PRODUTOS e editado a mao, entao um & ou aspas num nome nao pode quebrar
  // o HTML nem virar injecao.
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

  function fontes(slug, pasta, larguras, sizes) {
    const srcset = (fmt) =>
      larguras.map((w) => `${pasta}/${slug}-${w}.${fmt} ${w}w`).join(', ');
    return (
      `<source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">` +
      `<source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">`
    );
  }

  /* ── Grade ──────────────────────────────────────────────── */

  function renderGrade() {
    const alvo = document.getElementById('grade');
    if (!alvo) return;

    alvo.innerHTML = PRODUTOS
      .map(
        (p) => `
        <li class="peca sobe">
          <button class="peca__botao" type="button" data-slug="${esc(p.slug)}">
            <picture>
              ${fontes(p.slug, 'img/produtos', GRID_LARGURAS, GRID_SIZES)}
              <img class="peca__foto" src="img/produtos/${esc(p.slug)}-800.webp"
                   width="${RAZAO.w}" height="${RAZAO.h}" loading="lazy" decoding="async"
                   alt="${esc(p.alt)}">
            </picture>
            <span class="peca__legenda">
              <span class="peca__nome">${esc(p.nome)}</span>
              <span class="peca__preco">${esc(p.preco)}</span>
            </span>
          </button>
        </li>`
      )
      .join('');

    alvo.querySelectorAll('.peca__botao').forEach((b) => {
      b.addEventListener('click', () => abrir(b.dataset.slug));
    });
  }

  /* ── Hero ───────────────────────────────────────────────── */
  /* O video e estatico no index.html: ele e o topo da pagina e nao pode
     esperar JS. Daqui sai so o respeito a "Reduzir movimento".

     O autoplay fica no HTML de proposito. Colocar por JS atrasaria o hero pra
     todo mundo pra atender uma minoria; assim o caso comum toca na hora e
     quem pediu menos movimento tem o video parado no primeiro frame — que e
     exatamente o poster, entao nao ha piscada. */

  function respeitarMovimento() {
    const video = document.getElementById('hero-video');
    if (!video) return;

    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

    const aplicar = () => {
      if (menosMovimento.matches) {
        video.autoplay = false;
        video.loop = false;
        video.pause();
        video.currentTime = 0;
      } else {
        video.loop = true;
        video.play().catch(() => {
          /* iOS bloqueia autoplay em Modo de Baixo Consumo. Nao e erro:
             o poster fica na tela e a pagina segue inteira. */
        });
      }
    };

    aplicar();
    menosMovimento.addEventListener('change', aplicar);
  }

  /* ── Modal ──────────────────────────────────────────────── */

  const dlg = document.getElementById('modal');

  function abrir(slug) {
    const p = PRODUTOS.find((x) => x.slug === slug);
    if (!p || !dlg) return;

    pecaAberta = p;
    tamanhoEscolhido = null;

    document.getElementById('modal-foto-wrap').innerHTML =
      fontes(p.slug, 'img/produtos', GRID_LARGURAS, MODAL_SIZES) +
      `<img class="modal__foto" src="img/produtos/${esc(p.slug)}-800.webp"
            width="1368" height="1710" decoding="async" alt="${esc(p.alt)}">`;

    document.getElementById('modal-nome').textContent = p.nome;
    document.getElementById('modal-preco').textContent = p.preco;

    const opcoes = document.getElementById('modal-tamanhos');
    opcoes.innerHTML = p.tamanhos
      .map(
        (t) =>
          `<button class="tamanho" type="button" aria-pressed="false" ` +
          `data-tamanho="${esc(t)}">${esc(t)}</button>`
      )
      .join('');

    opcoes.querySelectorAll('.tamanho').forEach((b) => {
      b.addEventListener('click', () => escolherTamanho(b.dataset.tamanho, opcoes));
    });

    atualizarWpp();
    dlg.showModal();
    // O scroll do fundo trava por CSS (body:has(.modal[open])), nao daqui.
  }

  function escolherTamanho(t, opcoes) {
    tamanhoEscolhido = t;
    opcoes.querySelectorAll('.tamanho').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.tamanho === t));
    });
    atualizarWpp();
  }

  function atualizarWpp() {
    if (!pecaAberta) return;
    const btn = document.getElementById('modal-wpp');
    const tam = tamanhoEscolhido ? `, tamanho ${tamanhoEscolhido}` : '';

    /* "nesta peça:" e nao "no ${nome}" por causa de concordancia de genero.
       Metade do catalogo e feminino (a calca, a camisola, a polo) e a outra
       metade masculino (o vestido, o conjunto), entao qualquer artigo fixo
       erra em metade das mensagens. Um campo artigo: 'no'|'na' resolveria,
       mas produtos.js e editado pela loja e seria mais uma coisa pra errar.
       Sem artigo, a frase vale pra qualquer nome que inventarem depois. */
    const msg = `Olá! Tenho interesse nesta peça: ${pecaAberta.nome}${tam}. Pode me dar mais informações?`;
    btn.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  if (dlg) {
    document.getElementById('modal-fechar').addEventListener('click', () => dlg.close());
    // Clique no backdrop fecha. O <dialog> ja da Esc e prisao de foco de graca.
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
  }

  /* ── Movimento ──────────────────────────────────────────── */
  /* IntersectionObserver no lugar de listener de scroll.

     So a grade passa por aqui. O fio se desenha por animacao de CSS, porque
     ele mora no HTML estatico e nao pode depender deste script pra existir.
     Os cards, ao contrario, sao criados aqui mesmo: se este script nao rodar
     nao ha card nenhum pra revelar, entao revelar por JS nao adiciona risco. */

  function observar() {
    const alvos = document.querySelectorAll('.sobe');
    if (!('IntersectionObserver' in window)) {
      alvos.forEach((el) => el.setAttribute('data-visivel', ''));
      return;
    }

    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.setAttribute('data-visivel', '');
          obs.unobserve(e.target); // uma vez so
        });
      },
      { rootMargin: '0px 0px -8% 0px' }
    );

    alvos.forEach((el) => obs.observe(el));
  }

  /* ── Start ──────────────────────────────────────────────── */

  // O numero mora so em produtos.js. Header e rodape apontam pra la em vez de
  // repetir o wa.me no HTML e sair do ar quando alguem trocar um e nao o outro.
  ['header-wpp', 'rodape-wpp'].forEach((id) => {
    const a = document.getElementById(id);
    if (a) a.href = `https://wa.me/${WHATSAPP}`;
  });

  renderGrade();
  respeitarMovimento();
  observar();
})();

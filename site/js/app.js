/* ═══════════════════════════════════════════════════════════
   VITRINE — grade, modal e foto inteira.

   O pedido nao mora aqui: quem guarda e o carrinho.js, quem desenha a tela
   do pedido e o provador.js. Este arquivo expoe `Peca` pra eles.

   Depende de produtos.js (PRODUTOS) e carrinho.js (Carrinho).
   ═══════════════════════════════════════════════════════════ */

const Peca = (function () {
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

  /* Um lugar so monta srcset no site inteiro — grade, modal e as linhas do
     provador. Mexer nas larguras e mexer aqui.

     As larguras saem do produto quando ele declara: as fotos recortadas da
     colagem tem ~450px de fonte e o prep-imagens.js nao gera 960 pra elas.
     Prometer no srcset um arquivo que nao existe da 404, e o <picture> NAO cai
     pra proxima <source> — o <img> dispara error e o card vira "Em breve".
     Aparecia so em tela densa (celular com DPR 3 no modal, desktop Retina na
     grade), que e justamente onde a cliente esta. */
  function fontes(slug, sizes) {
    const p = PRODUTOS.find((x) => x.slug === slug);
    const larguras = p?.larguras || GRID_LARGURAS;
    const srcset = (fmt) =>
      larguras.map((w) => `img/produtos/${slug}-${w}.${fmt} ${w}w`).join(', ');
    return (
      `<source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">` +
      `<source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">`
    );
  }

  /* ── Grade ──────────────────────────────────────────────── */

  function renderGrade() {
    const alvo = document.getElementById('grade');
    if (!alvo) return;

    // Conta so o que abre. Peca "Em breve" ainda nao e peca a venda, e
    // anunciar 8 quando 6 funcionam e promessa que a pagina nao cumpre.
    const conta = document.getElementById('grade-conta');
    if (conta) {
      const n = PRODUTOS.filter((p) => p.slug).length;
      conta.textContent = n === 1 ? '1 peça' : `${n} peças`;
    }

    // O indice reinicia a cada fileira (3 no desktop) pra cascata acontecer
    // dentro da fileira e nao ao longo do catalogo inteiro.
    const cascata = (i) => `--i:${i % 3}`;

    alvo.innerHTML = PRODUTOS
      .map((p, i) => (p.slug ? cardComFoto(p, i) : cardSemFoto(p, i)))
      .join('');

    alvo.querySelectorAll('.peca__botao').forEach((b) => {
      b.addEventListener('click', () => abrir(b.dataset.slug));
    });

    /* Revela cada foto quando ela termina de baixar. Imagem que veio do cache
       ja nasce completa e nunca dispara 'load', entao tem que ser checada.

       O 'error' importa tanto quanto o 'load': a foto nasce com opacity 0, e
       sem tratar a falha um arquivo faltando fica invisivel pra sempre e o
       card vira legenda solta no vazio. Se o arquivo nao vier, a peca cai pro
       estado "Em breve", que e a verdade. */
    alvo.querySelectorAll('.peca__foto').forEach((img) => {
      const revelar = () => img.setAttribute('data-carregada', '');
      const falhar = () => {
        const card = img.closest('.peca');
        if (card) card.classList.add('peca--vazia');
        const moldura = img.closest('picture');
        if (moldura) {
          moldura.outerHTML =
            '<div class="peca__vazia__moldura"><span class="peca__vazia__selo voz-ar">Em breve</span></div>';
        }
      };
      if (img.complete && img.naturalWidth > 0) revelar();
      else if (img.complete) falhar();
      else {
        img.addEventListener('load', revelar, { once: true });
        img.addEventListener('error', falhar, { once: true });
      }
    });

    function cardComFoto(p, i) {
      return `
        <li class="peca sobe" style="${cascata(i)}">
          <button class="peca__botao" type="button" data-slug="${esc(p.slug)}">
            <picture>
              ${fontes(p.slug, GRID_SIZES)}
              <img class="peca__foto" src="img/produtos/${esc(p.slug)}-800.webp"
                   width="${RAZAO.w}" height="${RAZAO.h}" loading="lazy" decoding="async"
                   alt="${esc(p.alt)}">
            </picture>
            <span class="peca__legenda">
              <span class="peca__nome">${esc(p.nome)}</span>
              <span class="peca__preco">${esc(p.preco)}</span>
            </span>
          </button>
        </li>`;
    }

    // Peca ja cadastrada, foto ainda nao. Nao e clicavel: sem foto o modal
    // nao tem o que mostrar, e um card que abre no vazio frustra mais do que
    // a espera. Vira card normal sozinho no dia que o arquivo existir.
    function cardSemFoto(p, i) {
      return `
        <li class="peca peca--vazia sobe" style="${cascata(i)}">
          <div class="peca__vazia__moldura">
            <span class="peca__vazia__selo voz-ar">Em breve</span>
          </div>
          <span class="peca__legenda">
            <span class="peca__nome">${esc(p.nome)}</span>
            <span class="peca__preco">${esc(p.preco || '')}</span>
          </span>
        </li>`;
    }
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

  /* ── Header sobre o hero ────────────────────────────────── */
  /* O header e fixo, entao ele acompanha a rolagem e o provador fica sempre
     alcancavel — era esse o trabalho da prateleira que saiu.

     So que sobre o video a letra e branca, e branca sobre o creme do catalogo
     seria invisivel. Este observador diz ao CSS quando o hero deixou de estar
     atras do header. IntersectionObserver e nao listener de scroll, como o
     resto da pagina. */

  function vigiarHero() {
    const header = document.querySelector('.header');
    const hero = document.querySelector('.hero');
    if (!header || !hero) return;

    if (!('IntersectionObserver' in window)) {
      header.setAttribute('data-fora-do-hero', '');
      return;
    }

    new IntersectionObserver(
      ([e]) => header.toggleAttribute('data-fora-do-hero', !e.isIntersecting),
      // Encolhe o topo da area observada na altura do proprio header: o hero
      // "sai" quando a base dele passa por baixo da faixa, nao quando some
      // da tela inteira.
      { rootMargin: '-64px 0px 0px 0px' }
    ).observe(hero);
  }

  /* ── Modal ──────────────────────────────────────────────── */

  const dlg = document.getElementById('modal');

  // tamanhoPrevio vem de quem reabre a peca pelo provador: ela ja escolheu, e
  // pedir de novo faria o botao dizer "Escolha o tamanho" pra uma peca que
  // esta no pedido ali do lado.
  function abrir(slug, tamanhoPrevio) {
    const p = PRODUTOS.find((x) => x.slug === slug);
    if (!p || !dlg) return;

    pecaAberta = p;
    tamanhoEscolhido = p.tamanhos.includes(tamanhoPrevio) ? tamanhoPrevio : null;

    document.getElementById('modal-foto-wrap').innerHTML =
      fontes(p.slug, MODAL_SIZES) +
      `<img class="modal__foto" src="img/produtos/${esc(p.slug)}-800.webp"
            width="1368" height="1710" decoding="async" alt="${esc(p.alt)}">`;

    document.getElementById('modal-nome').textContent = p.nome;
    document.getElementById('modal-preco').textContent = p.preco;

    const opcoes = document.getElementById('modal-tamanhos');
    opcoes.innerHTML = p.tamanhos
      .map(
        (t) =>
          `<button class="tamanho" type="button" ` +
          `aria-pressed="${t === tamanhoEscolhido}" ` +
          `data-tamanho="${esc(t)}">${esc(t)}</button>`
      )
      .join('');

    opcoes.querySelectorAll('.tamanho').forEach((b) => {
      b.addEventListener('click', () => escolherTamanho(b.dataset.tamanho, opcoes));
    });

    atualizarBotaoAdd();
    dlg.showModal();
    // O scroll do fundo trava por CSS (body:has(.modal[open])), nao daqui.
  }

  function escolherTamanho(t, opcoes) {
    tamanhoEscolhido = t;
    opcoes.querySelectorAll('.tamanho').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.tamanho === t));
    });
    atualizarBotaoAdd();
  }

  function atualizarBotaoAdd() {
    const btn = document.getElementById('modal-add');
    if (!btn || !pecaAberta) return;

    // Sem tamanho a mensagem chegaria incompleta na loja e a conversa
    // comecaria com uma pergunta a mais. O botao diz o que falta.
    const falta = !tamanhoEscolhido;
    btn.disabled = falta;
    btn.textContent = falta ? 'Escolha o tamanho' : 'Levar ao provador';
  }

  if (dlg) {
    document.getElementById('modal-fechar').addEventListener('click', () => dlg.close());
    // Clique no backdrop fecha. O <dialog> ja da Esc e prisao de foco de graca.
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
    document.getElementById('modal-add').addEventListener('click', levarAoProvador);
    document.getElementById('modal-ampliar').addEventListener('click', verInteira);
  }

  /* ── Levar ao provador ──────────────────────────────────── */

  function levarAoProvador() {
    if (!pecaAberta || !tamanhoEscolhido) return;

    /* Guarda a posicao da foto ANTES de fechar o modal: depois de fechado o
       elemento sai da tela e o retangulo zera. */
    const foto = document.querySelector('.modal__foto');
    const origem = foto ? foto.getBoundingClientRect() : null;

    Carrinho.adicionar(pecaAberta.slug, tamanhoEscolhido);

    // Fecha e devolve a cliente pro catalogo. O voo da foto ate o header e o
    // que conta o que aconteceu — sem ele, o modal some e a peca parece ter
    // evaporado.
    if (dlg.open) dlg.close();
    if (foto) voarParaOProvador(foto, origem);
  }

  /* A foto sai do modal e pousa no botao do provador.

     Serve a duas coisas ao mesmo tempo: confirma que a peca entrou e ensina
     ONDE ela entrou, que e a pergunta que a cliente faria em seguida. O
     destino e o header, que e fixo — entao ele esta sempre na tela, mesmo
     que ela esteja no fim do catalogo. */
  function voarParaOProvador(foto, origem) {
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const destino = document.getElementById('abrir-provador');
    if (menosMovimento || !origem || !destino) return;

    const chegada = destino.getBoundingClientRect();
    if (!chegada.width) return; // escondido por CSS: nao ha pra onde voar

    const voo = foto.cloneNode(true);
    voo.className = 'voo';
    voo.style.cssText =
      `left:${origem.left}px; top:${origem.top}px; ` +
      `width:${origem.width}px; height:${origem.height}px;`;
    document.body.appendChild(voo);

    // Centro a centro: o destino e um icone pequeno, entao mirar no canto
    // faria a foto pousar torta ao lado dele.
    const escala = chegada.width / origem.width;
    const dx = chegada.left + chegada.width / 2 - (origem.left + origem.width / 2);
    const dy = chegada.top + chegada.height / 2 - (origem.top + origem.height / 2);

    requestAnimationFrame(() => {
      voo.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;
      voo.style.opacity = '0';
    });

    const limpar = () => {
      voo.remove();
      destino.setAttribute('data-recebeu', '');
      setTimeout(() => destino.removeAttribute('data-recebeu'), 600);
    };
    voo.addEventListener('transitionend', limpar, { once: true });
    // Rede: se a transicao nao disparar (aba em segundo plano, por exemplo),
    // o clone nao pode ficar preso na tela pra sempre.
    setTimeout(() => { if (voo.isConnected) limpar(); }, 900);
  }

  /* ── Foto inteira ───────────────────────────────────────── */
  /* O 4:5 da grade e o que faz as pecas lerem como conjunto, mas ele corta
     ate um terco da foto — e o que sai e quase sempre a barra da peca. Em vez
     de escolher entre grade bonita e peca inteira, a grade fica cortada e a
     foto inteira mora um toque adiante. */

  const inteiraDlg = document.getElementById('inteira');

  function verInteira() {
    if (!pecaAberta || !inteiraDlg) return;
    const slug = esc(pecaAberta.slug);

    // src so agora: o arquivo "-inteira" nao pesa no carregamento da pagina.
    document.getElementById('inteira-wrap').innerHTML =
      `<source type="image/avif" srcset="img/produtos/${slug}-inteira.avif">` +
      `<source type="image/webp" srcset="img/produtos/${slug}-inteira.webp">` +
      `<img class="inteira__foto" src="img/produtos/${slug}-inteira.webp"
            decoding="async" alt="${esc(pecaAberta.alt)}">`;

    inteiraDlg.showModal();
  }

  if (inteiraDlg) {
    // Delegacao: fecha pelo X, pelo fundo ou tocando na propria foto — quem
    // abriu com um toque espera fechar do mesmo jeito.
    inteiraDlg.addEventListener('click', () => inteiraDlg.close());
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

  // O numero mora so em produtos.js. O rodape aponta pra la em vez de repetir
  // o wa.me no HTML e sair do ar quando alguem trocar um e nao o outro.
  const wppRodape = document.getElementById('rodape-wpp');
  if (wppRodape) wppRodape.href = `https://wa.me/${WHATSAPP}`;

  renderGrade();
  respeitarMovimento();
  vigiarHero();
  observar();

  /* O que o provador.js precisa da vitrine. Antes tudo morava dentro da mesma
     IIFE e se enxergava por acidente de escopo; separado em arquivos, a
     fronteira precisa ser dita. */
  return { abrir, fontes, esc };
})();

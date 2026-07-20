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

    const conta = document.getElementById('grade-conta');
    if (conta) {
      conta.textContent = PRODUTOS.length === 1 ? '1 peça' : `${PRODUTOS.length} peças`;
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

    // Revela cada foto quando ela termina de baixar. Imagem que veio do cache
    // ja nasce completa e nunca dispara 'load', entao tem que ser checada.
    alvo.querySelectorAll('.peca__foto').forEach((img) => {
      if (img.complete && img.naturalWidth > 0) img.setAttribute('data-carregada', '');
      else img.addEventListener('load', () => img.setAttribute('data-carregada', ''), { once: true });
    });

    function cardComFoto(p, i) {
      return `
        <li class="peca sobe" style="${cascata(i)}">
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
    btn.textContent = falta ? 'Escolha o tamanho' : 'Adicionar à sacola';
  }

  if (dlg) {
    document.getElementById('modal-fechar').addEventListener('click', () => dlg.close());
    // Clique no backdrop fecha. O <dialog> ja da Esc e prisao de foco de graca.
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
    document.getElementById('modal-add').addEventListener('click', adicionarNaSacola);
  }

  /* ══════════════════════════════════════════════════════════
     SACOLA
     ══════════════════════════════════════════════════════════ */
  /* Guarda no proprio navegador da cliente e monta a mensagem do WhatsApp
     com a lista pronta. Sem pagamento, sem estoque, sem servidor: a venda
     continua fechando na conversa, que e como a loja ja trabalha. */

  const CHAVE = 'intimatto:sacola';
  const sacolaDlg = document.getElementById('sacola');

  function lerSacola() {
    try {
      const bruto = JSON.parse(localStorage.getItem(CHAVE) || '[]');
      if (!Array.isArray(bruto)) return [];
      // Descarta o que nao existe mais no catalogo: a peca pode ter sido
      // vendida ou renomeada desde a ultima visita, e um item fantasma
      // quebraria a mensagem.
      return bruto.filter((i) => i && PRODUTOS.some((p) => p.slug === i.slug));
    } catch {
      return []; // localStorage bloqueado (aba anonima em alguns navegadores)
    }
  }

  function gravarSacola(itens) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* Sem espaco ou sem permissao. A sacola segue valendo nesta visita. */
    }
    pintarSacola(itens);
  }

  function adicionarNaSacola() {
    if (!pecaAberta || !tamanhoEscolhido) return;

    const itens = lerSacola();
    const repetido = itens.some(
      (i) => i.slug === pecaAberta.slug && i.tamanho === tamanhoEscolhido
    );
    if (!repetido) itens.push({ slug: pecaAberta.slug, tamanho: tamanhoEscolhido });
    gravarSacola(itens);

    // Confirma no lugar onde o olho ja esta, senao ela clica de novo achando
    // que nao funcionou.
    const aviso = document.getElementById('modal-aviso');
    aviso.textContent = repetido
      ? `${pecaAberta.nome}, tamanho ${tamanhoEscolhido}, já está na sacola.`
      : `${pecaAberta.nome}, tamanho ${tamanhoEscolhido}, na sacola.`;
    aviso.setAttribute('data-visivel', '');
  }

  function tirarDaSacola(slug, tamanho) {
    gravarSacola(lerSacola().filter((i) => !(i.slug === slug && i.tamanho === tamanho)));
  }

  // "R$ 289,90" -> 289.9. Devolve null no que nao der pra ler, pra uma peca
  // "sob consulta" nao virar total errado.
  function emNumero(preco) {
    if (!preco) return null;
    const limpo = String(preco).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(limpo);
    return Number.isFinite(n) ? n : null;
  }

  const emReais = (n) =>
    'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  function pintarSacola(itens) {
    const lista = itens || lerSacola();
    const corpo = document.getElementById('sacola-corpo');
    const pe = document.getElementById('sacola-pe');
    const conta = document.getElementById('sacola-conta');
    const botao = document.getElementById('abrir-sacola');

    if (conta) conta.textContent = lista.length ? `(${lista.length})` : '';
    if (botao) {
      botao.toggleAttribute('data-cheia', lista.length > 0);
      botao.setAttribute(
        'aria-label',
        lista.length === 0 ? 'Sacola vazia'
          : lista.length === 1 ? 'Sacola, 1 peça'
          : `Sacola, ${lista.length} peças`
      );
    }

    if (!corpo) return;

    if (!lista.length) {
      corpo.innerHTML =
        '<p class="sacola__vazia">Sua sacola está vazia.<br>Escolha uma peça e o tamanho.</p>';
      if (pe) pe.hidden = true;
      return;
    }

    corpo.innerHTML = lista
      .map((i) => {
        const p = PRODUTOS.find((x) => x.slug === i.slug);
        return `
        <div class="item">
          <picture>
            ${fontes(p.slug, 'img/produtos', GRID_LARGURAS, '3.5rem')}
            <img class="item__foto" src="img/produtos/${esc(p.slug)}-400.webp"
                 width="${RAZAO.w}" height="${RAZAO.h}" loading="lazy" decoding="async" alt="">
          </picture>
          <div>
            <p class="item__nome">${esc(p.nome)}</p>
            <p class="item__meta">Tam ${esc(i.tamanho)} · ${esc(p.preco || '')}</p>
          </div>
          <button class="item__tirar" type="button"
                  data-slug="${esc(p.slug)}" data-tamanho="${esc(i.tamanho)}"
                  aria-label="Tirar ${esc(p.nome)}, tamanho ${esc(i.tamanho)}, da sacola">
            <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <path d="M1 1l16 16M17 1L1 17" fill="none" stroke="currentColor" stroke-width="1.25"/>
            </svg>
          </button>
        </div>`;
      })
      .join('');

    corpo.querySelectorAll('.item__tirar').forEach((b) => {
      b.addEventListener('click', () => tirarDaSacola(b.dataset.slug, b.dataset.tamanho));
    });

    if (pe) pe.hidden = false;

    // Total so aparece se TODOS os precos derem pra ler. Meio total engana
    // mais do que total nenhum.
    const valores = lista.map((i) => emNumero(PRODUTOS.find((x) => x.slug === i.slug)?.preco));
    const totalEl = document.getElementById('sacola-total');
    if (valores.every((v) => v !== null)) {
      const soma = valores.reduce((a, b) => a + b, 0);
      totalEl.innerHTML = `<span>Total</span><span>${esc(emReais(soma))}</span>`;
    } else {
      totalEl.textContent = '';
    }

    document.getElementById('sacola-wpp').href = montarPedido(lista, valores);
  }

  function montarPedido(lista, valores) {
    const linhas = lista.map((i) => {
      const p = PRODUTOS.find((x) => x.slug === i.slug);
      return `• ${p.nome} — Tam ${i.tamanho}${p.preco ? ` — ${p.preco}` : ''}`;
    });

    let msg = 'Olá! Quero estas peças:\n\n' + linhas.join('\n');
    if (valores.every((v) => v !== null)) {
      msg += `\n\nTotal: ${emReais(valores.reduce((a, b) => a + b, 0))}`;
    }
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  if (sacolaDlg) {
    document.getElementById('abrir-sacola').addEventListener('click', () => {
      pintarSacola();
      sacolaDlg.showModal();
    });
    document.getElementById('sacola-fechar').addEventListener('click', () => sacolaDlg.close());
    sacolaDlg.addEventListener('click', (e) => {
      if (e.target === sacolaDlg) sacolaDlg.close();
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

  // O numero mora so em produtos.js. O rodape aponta pra la em vez de repetir
  // o wa.me no HTML e sair do ar quando alguem trocar um e nao o outro.
  const wppRodape = document.getElementById('rodape-wpp');
  if (wppRodape) wppRodape.href = `https://wa.me/${WHATSAPP}`;

  renderGrade();
  respeitarMovimento();
  observar();
  // Restaura a contagem no header: a sacola sobrevive a fechar o navegador.
  pintarSacola();
})();

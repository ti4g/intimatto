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

  /* ── O filtro ───────────────────────────────────────────── */

  const TODAS = 'todas';
  let categoriaAtiva = TODAS;
  let jaPintou = false;

  const doFiltro = () =>
    categoriaAtiva === TODAS
      ? PRODUTOS
      : PRODUTOS.filter((p) => p.categoria === categoriaAtiva);

  function montarFiltro() {
    const barra = document.getElementById('filtro');
    if (!barra || typeof CATEGORIAS === 'undefined') return;

    /* So entra categoria que tem peca. Botao que filtra pra zero e uma porta
       que abre num comodo vazio — e assim uma categoria pode ficar cadastrada
       esperando as fotos chegarem sem aparecer na tela. */
    const comPeca = CATEGORIAS.filter((c) =>
      PRODUTOS.some((p) => p.categoria === c.id)
    );

    // Uma categoria so nao e escolha: seria um botao que nao faz nada.
    if (comPeca.length < 2) return;

    barra.innerHTML = [{ id: TODAS, nome: 'Todas' }, ...comPeca]
      .map(
        (c) =>
          `<button class="filtro__botao" type="button" data-cat="${esc(c.id)}" ` +
          `aria-pressed="${c.id === categoriaAtiva}">${esc(c.nome)}</button>`
      )
      .join('');

    barra.addEventListener('click', (e) => {
      const botao = e.target.closest('.filtro__botao');
      if (!botao || botao.dataset.cat === categoriaAtiva) return;

      categoriaAtiva = botao.dataset.cat;
      barra.querySelectorAll('.filtro__botao').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.cat === categoriaAtiva));
      });
      // Traz o botao escolhido pra dentro da vista: na fita rolada, tocar no
      // ultimo chip deixaria ele meio cortado na borda.
      botao.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      renderGrade();
    });
  }

  /* ── Grade ──────────────────────────────────────────────── */

  function renderGrade() {
    const alvo = document.getElementById('grade');
    if (!alvo) return;

    const lista = doFiltro();

    // Conta so o que abre. Peca "Em breve" ainda nao e peca a venda, e
    // anunciar 8 quando 6 funcionam e promessa que a pagina nao cumpre.
    const conta = document.getElementById('grade-conta');
    if (conta) {
      const n = lista.filter((p) => p.slug).length;
      conta.textContent = n === 1 ? '1 peça' : `${n} peças`;
    }

    // O indice reinicia a cada fileira (3 no desktop) pra cascata acontecer
    // dentro da fileira e nao ao longo do catalogo inteiro.
    const cascata = (i) => `--i:${i % 3}`;

    alvo.innerHTML = lista
      .map((p, i) => (p.slug ? cardComFoto(p, i) : cardSemFoto(p, i)))
      .join('');

    /* Na primeira pintura os cards sobem em cascata, revelados pelo
       IntersectionObserver. Ao FILTRAR eles ja nascem visiveis: filtrar
       precisa ser instantaneo, e refazer o fade escalonado a cada toque faria
       a grade piscar. O observador tambem nao serviria — ele so revela o que
       entra na tela, e as pecas filtradas ja estao nela. */
    if (jaPintou) {
      alvo.querySelectorAll('.sobe').forEach((el) => el.setAttribute('data-visivel', ''));
    }
    jaPintou = true;

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

    /* Copia antes de qualquer coisa: fechar o modal nao zera estas variaveis,
       mas abrir outra peca zera — e a confirmacao roda depois do voo, meio
       segundo no futuro. */
    const p = pecaAberta;
    const tamanho = tamanhoEscolhido;

    /* Guarda a posicao da foto ANTES de fechar o modal: depois de fechado o
       elemento sai da tela e o retangulo zera. */
    const foto = document.querySelector('.modal__foto');
    const origem = foto ? foto.getBoundingClientRect() : null;

    Carrinho.adicionar(p.slug, tamanho);

    // Fecha e devolve a cliente pro catalogo. O voo da foto ate o header e o
    // que conta o que aconteceu — sem ele, o modal some e a peca parece ter
    // evaporado.
    if (dlg.open) dlg.close();

    /* Se o voo nao rolar — "Reduzir movimento" ligado, icone fora da tela — a
       confirmacao nao pode sumir junto. Ela e barata e roda de qualquer jeito;
       sob reduced-motion o proprio CSS neutraliza o movimento e sobra o texto,
       que e o que importa. */
    const confirmar = () => confirmarEntrada(p, tamanho);
    if (!voarParaOProvador(foto, origem, confirmar)) confirmar();
  }

  /* A confirmacao: anel no icone, salto na contagem e a faixa escrita.

     Separada do voo de proposito. O voo e o floreio; isto e o recado. Se um
     nao acontecer, o outro ainda avisa que a peca entrou. */
  const TEMPO_AVISO = 2500;
  let apagarPulso;
  let apagarAviso;

  function confirmarEntrada(p, tamanho) {
    const destino = document.getElementById('abrir-provador');
    if (destino) {
      /* Tirar e repor com um reflow no meio. Sem isso, levar duas pecas
         seguidas so anima a primeira: o atributo ja esta la e o navegador nao
         tem por que reiniciar a animacao. */
      destino.removeAttribute('data-recebeu');
      void destino.offsetWidth;
      destino.setAttribute('data-recebeu', '');

      clearTimeout(apagarPulso);
      apagarPulso = setTimeout(() => destino.removeAttribute('data-recebeu'), 700);
    }

    const aviso = document.getElementById('aviso');
    if (!aviso) return;

    document.getElementById('aviso-foto').src = `img/produtos/${p.slug}-400.webp`;

    /* textContent e nao innerHTML: o nome vem do produtos.js, que e editado a
       mao, e aqui ele entra em elemento separado justamente pra nao haver
       string de HTML pra escapar. */
    const texto = document.getElementById('aviso-texto');
    texto.textContent = '';
    const nome = document.createElement('strong');
    nome.textContent = p.nome;
    const onde = document.createElement('span');
    onde.className = 'aviso__onde';
    onde.textContent = ` · Tam ${tamanho} no provador`;
    texto.append(nome, onde);

    aviso.setAttribute('data-visivel', '');
    clearTimeout(apagarAviso);
    apagarAviso = setTimeout(() => aviso.removeAttribute('data-visivel'), TEMPO_AVISO);
  }

  /* A foto sai do modal e pousa no botao do provador.

     Serve a duas coisas ao mesmo tempo: confirma que a peca entrou e ensina
     ONDE ela entrou, que e a pergunta que a cliente faria em seguida. O
     destino e o header, que e fixo — entao ele esta sempre na tela, mesmo
     que ela esteja no fim do catalogo. */
  function voarParaOProvador(foto, origem, aoPousar) {
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const destino = document.getElementById('abrir-provador');
    if (menosMovimento || !foto || !origem || !destino) return false;

    const chegada = destino.getBoundingClientRect();
    if (!chegada.width) return false; // escondido por CSS: nao ha pra onde voar

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

    // A confirmacao so dispara quando a foto POUSA: e a chegada que ela conta.
    const limpar = () => {
      voo.remove();
      aoPousar();
    };
    voo.addEventListener('transitionend', limpar, { once: true });
    // Rede: se a transicao nao disparar (aba em segundo plano, por exemplo),
    // o clone nao pode ficar preso na tela pra sempre.
    setTimeout(() => { if (voo.isConnected) limpar(); }, 900);

    return true;
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

  montarFiltro();
  renderGrade();
  respeitarMovimento();
  observar();

  /* O que o provador.js precisa da vitrine. Antes tudo morava dentro da mesma
     IIFE e se enxergava por acidente de escopo; separado em arquivos, a
     fronteira precisa ser dita. */
  return { abrir, fontes, esc };
})();

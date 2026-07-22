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

  // tamanhoPrevio vem de quem reabre a peca pelo provador: ela ja escolheu,
  // e pedir de novo faria o botao dizer "Escolha o tamanho" pra uma peca que
  // esta separada com tamanho ali do lado.
  function abrir(slug, tamanhoPrevio) {
    const p = PRODUTOS.find((x) => x.slug === slug);
    if (!p || !dlg) return;

    pecaAberta = p;
    tamanhoEscolhido = p.tamanhos.includes(tamanhoPrevio) ? tamanhoPrevio : null;

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

  /* ══════════════════════════════════════════════════════════
     PROVADOR
     ══════════════════════════════════════════════════════════ */
  /* Guarda no proprio navegador da cliente e monta a mensagem do WhatsApp
     com a lista pronta. Sem pagamento, sem estoque, sem servidor: a venda
     continua fechando na conversa, que e como a loja ja trabalha. */

  const CHAVE = 'intimatto:provador';
  const provadorDlg = document.getElementById('provador');

  /* Quais pecas vao na mensagem.

     Existe porque separar e pedir sao coisas diferentes: ela pode levar cinco
     ao provador e querer perguntar de duas hoje. Sem isso, tirar uma peca do
     pedido significa tirar do provador — e ai ela perde a peca que ainda
     queria. Marcadas por padrao: o caso comum e querer todas. */
  const naMensagem = new Set();
  const chaveDe = (i) => `${i.slug}|${i.tamanho}`;

  function lerProvador() {
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

  function gravarProvador(itens) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* Sem espaco ou sem permissao. A selecao segue valendo nesta visita. */
    }
    pintarProvador(itens);
  }

  function levarAoProvador() {
    if (!pecaAberta || !tamanhoEscolhido) return;

    const itens = lerProvador();
    const repetido = itens.some(
      (i) => i.slug === pecaAberta.slug && i.tamanho === tamanhoEscolhido
    );

    if (repetido) {
      // Nao fecha o modal: ela clicou de novo porque nao percebeu que ja
      // tinha levado. Fechar so aumentaria a confusao.
      const aviso = document.getElementById('modal-aviso');
      aviso.textContent = `${pecaAberta.nome}, tamanho ${tamanhoEscolhido}, já está no provador.`;
      aviso.setAttribute('data-visivel', '');
      return;
    }

    /* Guarda a posicao da foto ANTES de fechar o modal: depois de fechado o
       elemento sai da tela e o retangulo zera. */
    const foto = document.querySelector('.modal__foto');
    const origem = foto ? foto.getBoundingClientRect() : null;

    itens.push({ slug: pecaAberta.slug, tamanho: tamanhoEscolhido });
    gravarProvador(itens);

    // Fecha e devolve a cliente pro catalogo. O voo da foto ate a prateleira
    // e o que conta o que aconteceu — sem ele, o modal some e a peca parece
    // ter evaporado.
    if (dlg.open) dlg.close();
    if (foto) voarParaPrateleira(foto, origem);
  }

  /* A foto sai do modal e pousa na prateleira.

     Serve a duas coisas ao mesmo tempo: confirma que a peca entrou e ensina
     ONDE ela entrou, que e a pergunta que a cliente faria em seguida. E, com
     a prateleira enchendo a cada peca, o proprio rodape vira o convite pra
     fechar o pedido. */
  function voarParaPrateleira(foto, origem) {
    const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const barra = document.getElementById('prateleira');
    if (menosMovimento || !origem || !barra || barra.hidden) return;

    const destino = barra.querySelector('.prateleira__fotos img:last-of-type');
    if (!destino) return;
    const chegada = destino.getBoundingClientRect();

    const voo = foto.cloneNode(true);
    voo.className = 'voo';
    voo.style.cssText =
      `left:${origem.left}px; top:${origem.top}px; ` +
      `width:${origem.width}px; height:${origem.height}px;`;
    document.body.appendChild(voo);

    requestAnimationFrame(() => {
      voo.style.transform =
        `translate(${chegada.left - origem.left}px, ${chegada.top - origem.top}px) ` +
        `scale(${chegada.width / origem.width})`;
      voo.style.opacity = '0.4';
    });

    const limpar = () => {
      voo.remove();
      barra.setAttribute('data-recebeu', '');
      setTimeout(() => barra.removeAttribute('data-recebeu'), 600);
    };
    voo.addEventListener('transitionend', limpar, { once: true });
    // Rede: se a transicao nao disparar (aba em segundo plano, por exemplo),
    // o clone nao pode ficar preso na tela pra sempre.
    setTimeout(() => { if (voo.isConnected) limpar(); }, 900);
  }

  function tirarDoProvador(slug, tamanho) {
    const antes = lerProvador();
    const indice = antes.findIndex((i) => i.slug === slug && i.tamanho === tamanho);
    gravarProvador(antes.filter((i) => !(i.slug === slug && i.tamanho === tamanho)));

    /* pintarProvador reescreve o innerHTML, entao o botao que tinha o foco
       deixa de existir e o foco cai no <body> — quem navega por teclado perde
       o lugar e volta pro comeco do documento. Manda pro item seguinte, ou
       pro fechar quando era o ultimo. */
    const restantes = document.querySelectorAll('.item__tirar');
    const proximo = restantes[Math.min(indice, restantes.length - 1)];
    (proximo || document.getElementById('provador-fechar'))?.focus();
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

  function pintarProvador(itens) {
    const lista = itens || lerProvador();
    const corpo = document.getElementById('provador-corpo');
    const pe = document.getElementById('provador-pe');
    const conta = document.getElementById('provador-conta');
    const botao = document.getElementById('abrir-provador');

    // So o numero: o parenteses vira o disco dourado no CSS.
    if (conta) conta.textContent = lista.length ? String(lista.length) : '';
    if (botao) {
      botao.toggleAttribute('data-cheia', lista.length > 0);
      botao.setAttribute(
        'aria-label',
        lista.length === 0 ? 'Provador vazio'
          : lista.length === 1 ? 'Provador, 1 peça'
          : `Provador, ${lista.length} peças`
      );
    }

    /* Peca nova entra ja marcada; peca que saiu do provador sai daqui junto.
       Sem esta limpeza o Set acumularia chaves de pecas que nao existem mais
       e a contagem do botao iria mentindo com o tempo. */
    const atuais = new Set(lista.map(chaveDe));
    lista.forEach((i) => { if (!naMensagem.has(chaveDe(i))) naMensagem.add(chaveDe(i)); });
    [...naMensagem].forEach((k) => { if (!atuais.has(k)) naMensagem.delete(k); });

    pintarPrateleira(lista);

    if (!corpo) return;

    if (!lista.length) {
      corpo.innerHTML =
        '<p class="provador__vazia">Nenhuma peça separada ainda.<br>Escolha uma peça e o tamanho.</p>';
      if (pe) pe.hidden = true;
      return;
    }

    corpo.innerHTML = lista
      .map((i) => {
        const p = PRODUTOS.find((x) => x.slug === i.slug);
        const chave = chaveDe(i);
        const marcada = naMensagem.has(chave);
        return `
        <div class="item${marcada ? '' : ' item--fora'}">
          <label class="item__marca">
            <input type="checkbox" data-chave="${esc(chave)}" ${marcada ? 'checked' : ''}>
            <span class="item__marca__caixa" aria-hidden="true"></span>
            <span class="visualmente-oculto">Incluir ${esc(p.nome)} no pedido</span>
          </label>
          <button class="item__ver" type="button" data-slug="${esc(p.slug)}"
                  data-tamanho="${esc(i.tamanho)}"
                  aria-label="Ver ${esc(p.nome)} de novo">
            <picture>
              ${fontes(p.slug, 'img/produtos', GRID_LARGURAS, '5rem')}
              <img class="item__foto" src="img/produtos/${esc(p.slug)}-400.webp"
                   width="${RAZAO.w}" height="${RAZAO.h}" loading="lazy" decoding="async" alt="">
            </picture>
          </button>
          <div>
            <p class="item__nome">${esc(p.nome)}</p>
            <p class="item__meta">Tam ${esc(i.tamanho)} · ${esc(p.preco || '')}</p>
          </div>
          <button class="item__tirar" type="button"
                  data-slug="${esc(p.slug)}" data-tamanho="${esc(i.tamanho)}"
                  aria-label="Tirar ${esc(p.nome)}, tamanho ${esc(i.tamanho)}, do provador">
            <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <path d="M1 1l16 16M17 1L1 17" fill="none" stroke="currentColor" stroke-width="1.25"/>
            </svg>
          </button>
        </div>`;
      })
      .join('');

    // Os cliques daqui sao tratados por delegacao no proprio dialogo, porque
    // este innerHTML e reescrito a cada mudanca e levaria os listeners junto.

    if (pe) pe.hidden = false;
    atualizarPedido(lista);
  }

  /* Total e mensagem olham so o que esta marcado. Roda a cada clique no
     checkbox sem repintar a lista: repintar perderia o foco de quem navega
     por teclado e faria as fotos piscarem. */
  function atualizarPedido(lista) {
    const escolhidas = (lista || lerProvador()).filter((i) => naMensagem.has(chaveDe(i)));
    const valores = escolhidas.map((i) => emNumero(PRODUTOS.find((x) => x.slug === i.slug)?.preco));

    // Total so aparece se TODOS os precos derem pra ler. Meio total engana
    // mais do que total nenhum.
    const totalEl = document.getElementById('provador-total');
    if (escolhidas.length && valores.every((v) => v !== null)) {
      const soma = valores.reduce((a, b) => a + b, 0);
      totalEl.innerHTML = `<span>Total</span><span>${esc(emReais(soma))}</span>`;
    } else {
      totalEl.textContent = '';
    }

    // O botao diz quantas vao. Sem isso, desmarcar uma peca nao muda nada na
    // tela e a cliente nao tem como saber o que vai chegar na loja.
    const botao = document.getElementById('provador-wpp');
    const n = escolhidas.length;
    botao.textContent = n === 0 ? 'Escolha ao menos uma peça'
      : n === 1 ? 'Enviar 1 peça no WhatsApp'
      : `Enviar ${n} peças no WhatsApp`;
    botao.toggleAttribute('data-travado', n === 0);
    botao.setAttribute('aria-disabled', String(n === 0));
    botao.href = n ? montarPedido(escolhidas, valores) : '#';
  }

  /* A prateleira: as pecas separadas ficam a vista no rodape da tela.

     Mostra no maximo 4 fotos. Alem disso vira "+N": a faixa e uma lembranca
     do que foi escolhido, nao a lista inteira — quem quer ver tudo abre o
     provador, que e pra isso que a faixa serve. */
  const TETO_NA_PRATELEIRA = 4;

  function pintarPrateleira(lista) {
    const barra = document.getElementById('prateleira');
    const fotos = document.getElementById('prateleira-fotos');
    const botao = document.getElementById('abrir-prateleira');
    if (!barra || !fotos) return;

    if (!lista.length) {
      barra.hidden = true;
      fotos.innerHTML = '';
      return;
    }

    const mostradas = lista.slice(0, TETO_NA_PRATELEIRA);
    const sobra = lista.length - mostradas.length;

    fotos.innerHTML =
      mostradas
        .map((i) => {
          const p = PRODUTOS.find((x) => x.slug === i.slug);
          return `<img src="img/produtos/${esc(p.slug)}-400.webp"
                       width="${RAZAO.w}" height="${RAZAO.h}"
                       loading="lazy" decoding="async" alt="">`;
        })
        .join('') + (sobra > 0 ? `<span class="prateleira__mais">+${sobra}</span>` : '');

    if (botao) {
      botao.setAttribute(
        'aria-label',
        lista.length === 1 ? 'Ver provador, 1 peça' : `Ver provador, ${lista.length} peças`
      );
    }

    barra.hidden = false;
  }

  function montarPedido(escolhidas, valores) {
    const linhas = escolhidas.map((i) => {
      const p = PRODUTOS.find((x) => x.slug === i.slug);
      return `• ${p.nome} — Tam ${i.tamanho}${p.preco ? ` — ${p.preco}` : ''}`;
    });

    let msg = 'Olá! Quero estas peças:\n\n' + linhas.join('\n');
    if (valores.every((v) => v !== null)) {
      msg += `\n\nTotal: ${emReais(valores.reduce((a, b) => a + b, 0))}`;
    }
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  if (provadorDlg) {
    const abrirProvador = () => {
      pintarProvador();
      /* showModal e nao show: so o modal entra na camada de topo. Aberto com
         show() o painel fica no fluxo normal e a pagina atravessa por cima
         dele — da pra ver o texto do hero por cima das fotos da lista.
         O teste do :modal desfaz esse estado se ele aparecer por qualquer
         caminho, em vez de deixar a tela quebrada. */
      if (provadorDlg.open && !provadorDlg.matches(':modal')) provadorDlg.close();
      if (!provadorDlg.open) provadorDlg.showModal();
    };

    // Duas portas de entrada: o botao do header no desktop e a prateleira no
    // celular. Uma so das duas fica visivel por vez, mas ambas existem sempre.
    ['abrir-provador', 'abrir-prateleira'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', abrirProvador);
    });

    /* Um listener so, por delegacao, pra tudo que se clica dentro do painel.

       Delegacao e nao listener direto no botao: o corpo do provador e
       reescrito por innerHTML a cada mudanca, entao qualquer listener preso
       num elemento de dentro morre junto. Com o listener no dialogo, que
       nunca e recriado, os cliques continuam funcionando aconteca o que
       acontecer com o conteudo. */
    provadorDlg.addEventListener('click', (e) => {
      if (e.target.closest('#provador-fechar')) return provadorDlg.close();

      // Ver a peca de novo: abre o modal por cima do provador. Fechar o modal
      // devolve a lista, entao ela nao perde o lugar.
      const ver = e.target.closest('.item__ver');
      if (ver) return abrir(ver.dataset.slug, ver.dataset.tamanho);

      const tirar = e.target.closest('.item__tirar');
      if (tirar) return tirarDoProvador(tirar.dataset.slug, tirar.dataset.tamanho);

      if (e.target === provadorDlg) provadorDlg.close();
    });

    // Marcar e desmarcar. 'change' e nao 'click' pra funcionar por teclado
    // (barra de espaco) do mesmo jeito que pelo toque.
    provadorDlg.addEventListener('change', (e) => {
      const caixa = e.target.closest('input[type="checkbox"]');
      if (!caixa) return;
      if (caixa.checked) naMensagem.add(caixa.dataset.chave);
      else naMensagem.delete(caixa.dataset.chave);
      caixa.closest('.item')?.classList.toggle('item--fora', !caixa.checked);
      atualizarPedido();
    });

    // Sem peca marcada o link nao leva a lugar nenhum: melhor nao abrir o
    // WhatsApp do que abrir com uma mensagem vazia.
    document.getElementById('provador-wpp').addEventListener('click', (e) => {
      if (e.currentTarget.hasAttribute('data-travado')) e.preventDefault();
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
  // Restaura a contagem no header: a selecao sobrevive a fechar o navegador.
  pintarProvador();
})();

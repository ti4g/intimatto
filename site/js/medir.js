/* ═══════════════════════════════════════════════════════════
   MEDIR — Firebase Analytics.

   Este arquivo tem UMA regra acima de todas: medicao nunca pode quebrar a
   loja. Se o Firebase nao carregar, se o config estiver vazio, se a cliente
   usar bloqueador de anuncio ou estiver sem rede, a vitrine tem que seguir
   funcionando como se este arquivo nao existisse. Por isso tudo aqui e
   opcional, silencioso e envolvido em try/catch.

   Depende de nada. Quem chama e o app.js e o provador.js, por Medir.evento().
   ═══════════════════════════════════════════════════════════ */

const Medir = (function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────
     COLE AQUI o objeto do console do Firebase — inteiro, incluindo a linha
     "const firebaseConfig = {". O nome da variavel e o mesmo que o Firebase
     usa de proposito: assim da pra substituir este bloco por copia e cola
     direto do console, sem renomear nada.

     Onde achar: console.firebase.google.com -> engrenagem (Configuracoes do
     projeto) -> role ate "Seus apps" -> app da Web -> "Configuracao do SDK e
     configuracao" -> copie o firebaseConfig.

     O measurementId (G-XXXXXXXXXX) e o que liga o Analytics. Se ele nao
     estiver no objeto, o app da Web foi criado sem Analytics — da pra ligar
     no proprio console, em Analytics -> "Ativar o Google Analytics".

     Estas chaves sao PUBLICAS por natureza: todo site com Firebase no
     navegador expoe as dele, e nao dao acesso a nada sozinhas. Nao e segredo
     vazado, e identificacao de projeto.
     ───────────────────────────────────────────────────────────────────── */
  const firebaseConfig = {
    apiKey: "AIzaSyBbUMLiFLsLTycB_F-XCEFaHwXCU9JC7YQ",
    authDomain: "intimatto-d1a9c.firebaseapp.com",
    projectId: "intimatto-d1a9c",
    storageBucket: "intimatto-d1a9c.firebasestorage.app",
    messagingSenderId: "41015154395",
    appId: "1:41015154395:web:6684e6c3bd8d1211fb1efe",
    measurementId: "G-MQMHPQMXFP"
  };

  // Versao do SDK cravada de proposito: "latest" faria o site mudar de
  // comportamento sozinho no dia que o Google publicasse uma versao nova.
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

  /* Fila de eventos disparados antes do SDK terminar de carregar.

     O SDK vem de outro dominio e demora; a cliente pode muito bem abrir a
     primeira peca antes disso. Sem a fila esse evento — que e justamente o
     comeco do funil — se perderia. */
  let fila = [];
  let registrar = null;
  let desistiu = false;

  const configurado = () =>
    Boolean(firebaseConfig.apiKey && firebaseConfig.measurementId);

  function iniciar() {
    /* Sem config o arquivo inteiro vira um no-op. E o estado em que ele nasce,
       pra o site poder ser publicado antes de alguem preencher isto. */
    if (!configurado()) { desistiu = true; return; }

    // import() dinamico num script classico: funciona sem build e sem
    // <script type="module">, e mantem o SDK fora do caminho critico.
    Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-analytics.js`),
    ])
      .then(([app, analytics]) => {
        const firebase = app.initializeApp(firebaseConfig);
        const medidor = analytics.getAnalytics(firebase);
        registrar = (nome, dados) => analytics.logEvent(medidor, nome, dados);

        fila.forEach(([nome, dados]) => {
          try { registrar(nome, dados); } catch { /* nao e problema da loja */ }
        });
        fila = [];
      })
      .catch(() => {
        /* Bloqueador de anuncio, rede caida, CDN fora do ar. Tudo esperado.
           Desiste em silencio e esvazia a fila pra ela nao crescer sem fim
           enquanto a cliente navega. */
        desistiu = true;
        fila = [];
      });
  }

  /* O SDK so comeca a carregar depois que a pagina terminou de pintar.

     São ~90 KB de JavaScript de terceiro. Numa pagina cujo hero ja pesa 2 MB
     de video, deixar isso competir pelo primeiro paint seria trocar
     experiencia da cliente por numero no painel. */
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') iniciar();
    else window.addEventListener('load', iniciar, { once: true });
  }

  return {
    /* Nomes de evento seguem o padrao do GA4 (view_item, add_to_cart,
       begin_checkout) porque o console do Firebase ja tem relatorio pronto
       pra eles. Evento com nome inventado cai em "outros" e vira trabalho
       manual pra ler depois. */
    evento(nome, dados) {
      if (desistiu) return;
      try {
        if (registrar) registrar(nome, dados || {});
        else if (fila.length < 40) fila.push([nome, dados || {}]);
      } catch {
        /* Nunca deixa a medicao estourar pra cima de quem chamou. */
      }
    },

    // Pro console do navegador, quando alguem for conferir se esta ligado.
    estado: () => (desistiu ? 'desligado' : registrar ? 'ligado' : 'carregando'),
  };
})();

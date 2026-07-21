/*
  Gera favicon, icone de iOS e a imagem de compartilhamento.
  Roda uma vez; a saida estatica e commitada.

      node tools/prep-social.js

  O link desta loja circula em story, bio do Instagram e conversa de WhatsApp.
  Sem estes arquivos ele aparece como retangulo cinza sem imagem, que e a
  primeira impressao da marca pra quem ainda nao conhece.

  Nada aqui depende de fonte instalada: tudo sai de recorte e composicao do
  proprio JPG do logo, que ja tem o wordmark desenhado.
*/

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const RAIZ = path.join(__dirname, '..');
const LOGO = path.join(RAIZ, '_fontes', 'logo.jpg');
const FOTO = path.join(RAIZ, '_fontes', 'catalogo-camisola-rose.jpg');
const SAIDA = path.join(RAIZ, 'site', 'img', 'social');

// A silhueta reclinada dentro do logo de 1053x1053. O wordmark inteiro nao
// serve de favicon: a 32px "INTIMATTO DELLES" vira borrao. A silhueta e a
// unica parte do logo que sobrevive nesse tamanho.
//
// Pega a figura INTEIRA, com as pernas. O recorte so no torso lia como
// closeup em vez de marca, e ainda raspava o topo do "M" do wordmark.
const SILHUETA = { left: 545, top: 195, width: 350, height: 290 };

const kb = (p) => `${Math.round(fs.statSync(p).size / 1024)} KB`;

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });

  // Favicon e icone de iOS: silhueta dourada no preto do proprio logo.
  const marca = await sharp(LOGO).extract(SILHUETA).toBuffer();

  for (const [nome, tamanho] of [['favicon.png', 64], ['apple-touch-icon.png', 180]]) {
    await sharp(marca)
      .resize(tamanho, tamanho, { fit: 'contain', background: '#000000' })
      .png()
      .toFile(path.join(SAIDA, nome));
    console.log(nome.padEnd(22), kb(path.join(SAIDA, nome)));
  }

  /* Imagem de compartilhamento, 1200x630.

     Foto na esquerda e logo na direita. O fundo e #000000 exato pelo mesmo
     motivo do bloco preto da pagina: o JPG do logo tem fundo preto e encaixa
     sem borda aparente. Foto de catalogo e nao de loja porque esta e a
     unica com luz de estudio — no tamanho que o WhatsApp mostra, foto de
     celular em loja bege vira mancha. */
  const L = 1200, A = 630;
  const foto = await sharp(FOTO)
    .resize(Math.round(L * 0.46), A, { fit: 'cover', position: 'top' })
    .toBuffer();

  const logoLargura = 420;
  const logo = await sharp(LOGO).resize(logoLargura).toBuffer();
  const logoAltura = (await sharp(logo).metadata()).height;

  await sharp({ create: { width: L, height: A, channels: 3, background: '#000000' } })
    .composite([
      { input: foto, left: 0, top: 0 },
      {
        input: logo,
        left: Math.round(L * 0.46 + (L * 0.54 - logoLargura) / 2),
        top: Math.round((A - logoAltura) / 2),
      },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(SAIDA, 'og.jpg'));

  console.log('og.jpg'.padEnd(22), kb(path.join(SAIDA, 'og.jpg')), ` ${L}x${A}`);
})();

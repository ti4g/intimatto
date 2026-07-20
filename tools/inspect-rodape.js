// Diagnostico: recorta o rodape do vestido para localizar a marca d'agua
// antes de decidir a linha de corte do prep-imagens.js.
const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '..', '_fontes', 'vestido-vermelho.jpg');
const OUT = path.join(__dirname, '..', '_fontes', '_rodape-diagnostico.png');

(async () => {
  const { width, height } = await sharp(SRC).metadata();
  const top = 1400;
  await sharp(SRC)
    .extract({ left: 0, top, width, height: height - top })
    .png()
    .toFile(OUT);
  console.log(`fonte ${width}x${height} -> recorte y=${top}..${height} em ${OUT}`);
})();

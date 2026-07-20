// Diagnostico: mede a cor media do fundo do poster contra o --luz da pagina.
// O reel tem dominante lavanda e a pagina e branco quente; isto diz o quanto
// eles brigam, em numero e nao no olho.
const sharp = require('sharp');
const path = require('path');

const LUZ = { r: 0xf7, g: 0xf6, b: 0xf4 };

// Canto superior esquerdo: so fundo de estudio, sem modelo nem sofa.
const RECORTE = { left: 20, top: 20, width: 240, height: 240 };

async function medir(arquivo) {
  const { data } = await sharp(path.join(__dirname, '..', 'site', 'img', 'hero', arquivo))
    .extract(RECORTE)
    .resize(1, 1, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const [r, g, b] = data;
  // Distancia de matiz: o quanto azul/magenta sobra em relacao ao verde.
  const desvioAzul = b - g;
  const desvioVermelho = r - g;
  const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  const distLuz = Math.round(Math.hypot(r - LUZ.r, g - LUZ.g, b - LUZ.b));

  return { arquivo, hex, r, g, b, desvioAzul, desvioVermelho, distLuz };
}

(async () => {
  const alvo = { hex: '#f7f6f4', desvioAzul: -2, desvioVermelho: 1 };
  console.log('alvo (--luz)      ', alvo.hex, ` azul${alvo.desvioAzul >= 0 ? '+' : ''}${alvo.desvioAzul}  vermelho+${alvo.desvioVermelho}`);
  for (const f of ['poster-limpo.jpg', 'poster-corrigido.jpg']) {
    const m = await medir(f);
    console.log(
      m.arquivo.padEnd(22),
      m.hex,
      ` azul${m.desvioAzul >= 0 ? '+' : ''}${m.desvioAzul}`.padEnd(8),
      `vermelho${m.desvioVermelho >= 0 ? '+' : ''}${m.desvioVermelho}`.padEnd(12),
      `dist do --luz: ${m.distLuz}`
    );
  }
})();

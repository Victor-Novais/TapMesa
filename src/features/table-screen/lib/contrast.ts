/**
 * Utilitários de cálculo de contraste e luminância conforme WCAG 2.1
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB | null {
  const cleanHex = hex.replace("#", "").trim();

  if (cleanHex.length === 3) {
    const rChar = cleanHex.charAt(0);
    const gChar = cleanHex.charAt(1);
    const bChar = cleanHex.charAt(2);
    const r = parseInt(rChar + rChar, 16);
    const g = parseInt(gChar + gChar, 16);
    const b = parseInt(bChar + bChar, 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }

  return null;
}

export function getRelativeLuminance({ r, g, b }: RGB): number {
  const transform = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const R = transform(r);
  const G = transform(g);
  const B = transform(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Garante que a cor de texto possua contraste mínimo de 4.5:1 com o fundo.
 * Se o contraste atual for insuficiente, seleciona entre branco ou preto
 * o que oferecer maior legibilidade.
 */
export function getAccessibleTextColor(
  textColor: string,
  backgroundColor: string,
  minRatio = 4.5,
): string {
  const currentRatio = getContrastRatio(textColor, backgroundColor);

  if (currentRatio >= minRatio) {
    return textColor;
  }

  const whiteRatio = getContrastRatio("#ffffff", backgroundColor);
  const darkRatio = getContrastRatio("#09090b", backgroundColor);

  return whiteRatio >= darkRatio ? "#ffffff" : "#09090b";
}

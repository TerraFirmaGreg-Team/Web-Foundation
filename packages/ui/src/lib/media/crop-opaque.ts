type OpaqueBBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function opaqueBBox(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
): OpaqueBBox | undefined {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < width * height; i++) {
    if ((pixels[i * 4 + 3] ?? 0) === 0) continue;
    const x = i % width;
    const y = (i / width) | 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) return undefined;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function cropOpaqueImageDataUrl(
  image: HTMLImageElement,
): string | undefined {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width < 1 || height < 1) return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return undefined;
  ctx.drawImage(image, 0, 0);
  let pixels: ImageData;
  try {
    pixels = ctx.getImageData(0, 0, width, height);
  } catch {
    return undefined;
  }
  const box = opaqueBBox(pixels.data, width, height);
  if (!box) return undefined;
  if (
    box.x === 0 &&
    box.y === 0 &&
    box.width === width &&
    box.height === height
  ) {
    return undefined;
  }
  const out = document.createElement('canvas');
  out.width = box.width;
  out.height = box.height;
  const outCtx = out.getContext('2d');
  if (!outCtx) return undefined;
  outCtx.imageSmoothingEnabled = false;
  outCtx.drawImage(
    image,
    box.x,
    box.y,
    box.width,
    box.height,
    0,
    0,
    box.width,
    box.height,
  );
  return out.toDataURL('image/png');
}


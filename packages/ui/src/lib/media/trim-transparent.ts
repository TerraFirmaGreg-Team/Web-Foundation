const TRIM_TOL = 8;

export function trimTransparent(src: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(image, 0, 0);
      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, width, height);
      } catch {
        resolve(src);
        return;
      }
      const { data } = imageData;
      const at = (x: number, y: number) => (y * width + x) * 4;
      const closeRgb = (i: number, j: number) =>
        Math.abs(data[i]! - data[j]!) <= TRIM_TOL &&
        Math.abs(data[i + 1]! - data[j + 1]!) <= TRIM_TOL &&
        Math.abs(data[i + 2]! - data[j + 2]!) <= TRIM_TOL;
      const empty = (x: number, y: number, ref: number) => {
        const i = at(x, y);
        if (data[i + 3]! <= TRIM_TOL) return true;
        if (data[ref + 3]! <= TRIM_TOL) return false;
        return closeRgb(i, ref);
      };
      const rowPad = (y: number, x0: number, x1: number) => {
        let ref = -1;
        for (let x = x0; x <= x1; x++) {
          const i = at(x, y);
          if (data[i + 3]! > TRIM_TOL) {
            ref = i;
            break;
          }
        }
        if (ref < 0) return true;
        for (let x = x0; x <= x1; x++) {
          if (!empty(x, y, ref)) return false;
        }
        return true;
      };
      const colPad = (x: number, y0: number, y1: number) => {
        let ref = -1;
        for (let y = y0; y <= y1; y++) {
          const i = at(x, y);
          if (data[i + 3]! > TRIM_TOL) {
            ref = i;
            break;
          }
        }
        if (ref < 0) return true;
        for (let y = y0; y <= y1; y++) {
          if (!empty(x, y, ref)) return false;
        }
        return true;
      };

      let minX = 0;
      let minY = 0;
      let maxX = width - 1;
      let maxY = height - 1;
      let changed = true;
      while (changed && minX < maxX && minY < maxY) {
        changed = false;
        if (rowPad(minY, minX, maxX)) {
          minY += 1;
          changed = true;
        }
        if (minY < maxY && rowPad(maxY, minX, maxX)) {
          maxY -= 1;
          changed = true;
        }
        if (colPad(minX, minY, maxY)) {
          minX += 1;
          changed = true;
        }
        if (minX < maxX && colPad(maxX, minY, maxY)) {
          maxX -= 1;
          changed = true;
        }
      }
      if (
        maxX <= minX ||
        maxY <= minY ||
        (minX === 0 && minY === 0 && maxX === width - 1 && maxY === height - 1)
      ) {
        resolve(src);
        return;
      }
      const tw = maxX - minX + 1;
      const th = maxY - minY + 1;
      const out = document.createElement('canvas');
      out.width = tw;
      out.height = th;
      const outCtx = out.getContext('2d');
      if (!outCtx) {
        resolve(src);
        return;
      }
      outCtx.drawImage(image, minX, minY, tw, th, 0, 0, tw, th);
      resolve(out.toDataURL('image/png'));
    };
    image.onerror = () => resolve(src);
    image.crossOrigin = 'anonymous';
    image.src = src;
  });
}


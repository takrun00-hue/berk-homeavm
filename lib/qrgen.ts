export function generateQR(text: string): number[][] {
  const encoded = encodeData(text);
  const version = 1;
  const capacity = 41;

  if (encoded.length > capacity) {
    throw new Error("Text too long for QR code");
  }

  let data = [...encoded];
  while (data.length < capacity) {
    data.push(0);
  }

  const matrix: number[][] = Array(25)
    .fill(null)
    .map(() => Array(25).fill(0));

  addFinderPatterns(matrix);
  addSeparators(matrix);
  addTimingPatterns(matrix);
  addFormatInfo(matrix);

  const payload = createPayload(data);
  let minPenalty = Infinity;
  let bestMask = 0;

  for (let mask = 0; mask < 8; mask++) {
    const testMatrix = matrix.map((row) => [...row]);
    addPayload(testMatrix, payload, mask);
    const penalty = calculatePenalty(testMatrix);
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestMask = mask;
    }
  }

  const finalMatrix = matrix.map((row) => [...row]);
  addPayload(finalMatrix, payload, bestMask);

  return finalMatrix;
}

function encodeData(text: string): number[] {
  const bytes: number[] = [];
  const utf8 = new TextEncoder().encode(text);

  bytes.push(0x40);
  bytes.push(utf8.length);

  for (const byte of utf8) {
    bytes.push(byte);
  }

  return bytes;
}

function addFinderPatterns(matrix: number[][]): void {
  const pattern = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];

  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      matrix[i][j] = pattern[i][j];
      matrix[i][24 - j] = pattern[i][j];
      matrix[24 - i][j] = pattern[i][j];
    }
  }
}

function addSeparators(matrix: number[][]): void {
  for (let i = 0; i < 8; i++) {
    matrix[7][i] = matrix[7][i] === undefined ? 0 : matrix[7][i];
    matrix[i][7] = matrix[i][7] === undefined ? 0 : matrix[i][7];
    matrix[7][24 - i] = matrix[7][24 - i] === undefined ? 0 : matrix[7][24 - i];
    matrix[24 - i][7] = matrix[24 - i][7] === undefined ? 0 : matrix[24 - i][7];
  }
}

function addTimingPatterns(matrix: number[][]): void {
  for (let i = 8; i < 17; i++) {
    if ((i - 6) % 2 === 0) {
      matrix[6][i] = 1;
      matrix[i][6] = 1;
    } else {
      matrix[6][i] = 0;
      matrix[i][6] = 0;
    }
  }
}

function addFormatInfo(matrix: number[][]): void {
  const format = 0x5d47;

  for (let i = 0; i < 9; i++) {
    const bit = (format >> i) & 1;
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else matrix[8][14 - i] = bit;
  }

  for (let i = 0; i < 8; i++) {
    const bit = (format >> (14 - i)) & 1;
    if (i < 8) matrix[i][8] = bit;
    else matrix[24 - (i - 8)][8] = bit;
  }

  matrix[8][8] = 0;
}

function createPayload(data: number[]): number[] {
  return data.flatMap((b) =>
    Array.from({ length: 8 }, (_, i) => (b >> (7 - i)) & 1)
  );
}

function addPayload(matrix: number[][], payload: number[], mask: number): void {
  let payloadIndex = 0;

  for (let col = 24; col >= 0; col -= 2) {
    if (col === 6) col--;

    for (let row = 0; row < 25; row++) {
      for (let c = 0; c < 2; c++) {
        const col2 = col - c;

        if (
          matrix[row][col2] !== 0 &&
          matrix[row][col2] !== 1
        ) {
          if (payloadIndex < payload.length) {
            let bit = payload[payloadIndex++];
            bit ^= getMaskBit(row, col2, mask);
            matrix[row][col2] = bit;
          }
        }
      }
    }
  }
}

function getMaskBit(row: number, col: number, mask: number): number {
  switch (mask) {
    case 0:
      return ((row + col) % 2) & 1;
    case 1:
      return (row % 2) & 1;
    case 2:
      return (col % 3) & 1;
    case 3:
      return (((row + col) % 3) & 1) === 0 ? 1 : 0;
    case 4:
      return (((row >> 1) + (col / 3)) % 2) & 1;
    case 5:
      return (((row * col) % 2) + ((row * col) % 3)) & 1;
    case 6:
      return ((((row * col) % 2) + ((row * col) % 3)) % 2) & 1;
    case 7:
      return ((((row + col) % 2) + ((row * col) % 3)) % 2) & 1;
    default:
      return 0;
  }
}

function calculatePenalty(matrix: number[][]): number {
  let penalty = 0;

  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      if (
        matrix[i][j] === 1 &&
        matrix[i][j] === 1 &&
        matrix[i + 1]?.[j] === 1 &&
        matrix[i][j + 1] === 1 &&
        matrix[i + 1]?.[j + 1] === 1
      ) {
        penalty += 3;
      }

      let horizontal = 0;
      for (let k = 0; k < 25; k++) {
        if (matrix[i][k] === matrix[i][j]) horizontal++;
        else break;
      }
      if (horizontal >= 5) penalty += 3 + (horizontal - 5);

      let vertical = 0;
      for (let k = 0; k < 25; k++) {
        if (matrix[k][j] === matrix[i][j]) vertical++;
        else break;
      }
      if (vertical >= 5) penalty += 3 + (vertical - 5);
    }
  }

  const darkModules = matrix.flat().filter((b) => b === 1).length;
  const ratio = Math.abs(darkModules / 625 - 0.5) / 0.05;
  penalty += Math.floor(ratio) * 10;

  return penalty;
}

export function renderQRToCanvas(
  matrix: number[][],
  canvas: HTMLCanvasElement,
  moduleSize: number = 10,
  quietZone: number = 4,
  darkColor: string = "#000000",
  lightColor: string = "#FFFFFF"
): void {
  const size = matrix.length;
  const canvasSize = (size + quietZone * 2) * moduleSize;

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = darkColor;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (matrix[i][j] === 1) {
        const x = (j + quietZone) * moduleSize;
        const y = (i + quietZone) * moduleSize;
        ctx.fillRect(x, y, moduleSize, moduleSize);
      }
    }
  }
}

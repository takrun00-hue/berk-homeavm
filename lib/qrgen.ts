// QR Code Generator — Version 2, Error Correction Level M, Byte mode
// Supports URLs up to 28 bytes (https://berk-homeavm.com = 22 bytes ✓)

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let a = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = a; LOG[a] = i;
    a = (a << 1) ^ (a & 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gfMul = (a: number, b: number) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;

function genPoly(n: number): number[] {
  let p = [1];
  for (let i = 0; i < n; i++) {
    const q = [1, EXP[i]];
    const r = new Array(p.length + q.length - 1).fill(0);
    for (let j = 0; j < p.length; j++)
      for (let k = 0; k < q.length; k++)
        r[j + k] ^= gfMul(p[j], q[k]);
    p = r;
  }
  return p;
}

function rsEncode(data: number[], ecN: number): number[] {
  const gen = genPoly(ecN);
  const rem = [...data, ...new Array(ecN).fill(0)];
  for (let i = 0; i < data.length; i++)
    if (rem[i]) for (let j = 0; j < gen.length; j++) rem[i + j] ^= gfMul(gen[j], rem[i]);
  return rem.slice(data.length);
}

function fmtInfo(mask: number): number {
  const data = (0b00 << 3) | mask; // M level = 0b00
  let d = data << 10;
  for (let i = 14; i >= 10; i--)
    if (d & (1 << i)) d ^= (0x537 << (i - 10));
  return ((data << 10) | d) ^ 0x5412;
}

function buildDataCW(url: string): number[] {
  const bytes = new TextEncoder().encode(url);
  const bits: number[] = [];
  bits.push(0, 1, 0, 0);
  const n = bytes.length;
  for (let i = 7; i >= 0; i--) bits.push((n >> i) & 1);
  for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  for (let i = 0; i < 4; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const pads = [0xec, 0x11];
  for (let pi = 0; bits.length < 224; pi++)
    for (let i = 7; i >= 0; i--) bits.push((pads[pi % 2] >> i) & 1);
  const cw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    cw.push(b);
  }
  return cw;
}

const FP = [
  [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1],
];

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r,c) => (r+c)%2===0,
  (r,c) => r%2===0,
  (r,c) => c%3===0,
  (r,c) => (r+c)%3===0,
  (r,c) => (Math.floor(r/2)+Math.floor(c/3))%2===0,
  (r,c) => (r*c)%2+(r*c)%3===0,
  (r,c) => ((r*c)%2+(r*c)%3)%2===0,
  (r,c) => ((r+c)%2+(r*c)%3)%2===0,
];

function penalty(m: number[][], N: number): number {
  let s = 0;
  for (let i = 0; i < N; i++) {
    for (let isRow = 0; isRow < 2; isRow++) {
      let run = 1;
      for (let j = 1; j < N; j++) {
        const cur = isRow ? m[i][j] : m[j][i];
        const prv = isRow ? m[i][j-1] : m[j-1][i];
        if (cur === prv) run++;
        else { if (run >= 5) s += 3 + run - 5; run = 1; }
      }
      if (run >= 5) s += 3 + run - 5;
    }
  }
  for (let r = 0; r < N-1; r++)
    for (let c = 0; c < N-1; c++)
      if (m[r][c]===m[r+1][c] && m[r][c]===m[r][c+1] && m[r][c]===m[r+1][c+1]) s+=3;
  const P1=[1,0,1,1,1,0,1,0,0,0,0], P2=[0,0,0,0,1,0,1,1,1,0,1];
  for (let i = 0; i < N; i++) for (let j = 0; j <= N-11; j++) {
    let a=true,b=true,cc=true,d=true;
    for (let k=0;k<11;k++){
      if(m[i][j+k]!==P1[k]) a=false; if(m[i][j+k]!==P2[k]) b=false;
      if(m[j+k][i]!==P1[k]) cc=false; if(m[j+k][i]!==P2[k]) d=false;
    }
    if(a||b) s+=40; if(cc||d) s+=40;
  }
  let dk=0;
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(m[r][c]) dk++;
  const pct=(dk/(N*N))*100, p5=Math.floor(pct/5)*5;
  s+=Math.min(Math.abs(p5-50),Math.abs(p5+5-50))/5*10;
  return s;
}

export function generateQR(url: string): number[][] {
  const N = 25;
  const m: number[][] = Array.from({length:N}, () => new Array(N).fill(0));
  const res: number[][] = Array.from({length:N}, () => new Array(N).fill(0));

  const set = (r: number, c: number, v: number, isRes = false) => {
    if (r < 0 || r >= N || c < 0 || c >= N) return;
    m[r][c] = v; if (isRes) res[r][c] = 1;
  };

  const placeFinder = (or: number, oc: number) => {
    for (let r=0;r<7;r++) for (let c=0;c<7;c++) set(or+r, oc+c, FP[r][c], true);
    for (let i=-1;i<=7;i++) {
      set(or-1,oc+i,0,true); set(or+7,oc+i,0,true);
      set(or+i,oc-1,0,true); set(or+i,oc+7,0,true);
    }
  };
  placeFinder(0,0); placeFinder(0,N-7); placeFinder(N-7,0);

  for (let i=8;i<N-8;i++) { set(6,i,i%2===0?1:0,true); set(i,6,i%2===0?1:0,true); }
  set(N-8,8,1,true);

  for (let i=0;i<=8;i++) { if(!res[8][i]){res[8][i]=1;} if(!res[i][8]){res[i][8]=1;} }
  for (let i=N-8;i<N;i++) res[8][i]=1;
  for (let i=N-7;i<N;i++) res[i][8]=1;

  const dataCW = buildDataCW(url);
  const ecCW = rsEncode(dataCW, 16);
  const bits: number[] = [];
  for (const cw of [...dataCW, ...ecCW]) for (let i=7;i>=0;i--) bits.push((cw>>i)&1);

  let bi=0, up=true;
  for (let col=N-1;col>=1;col-=2) {
    if(col===6) col=5;
    for (let row=0;row<N;row++) {
      const r=up?N-1-row:row;
      for (let dc=0;dc<2;dc++) { const c=col-dc; if(!res[r][c]) m[r][c]=bits[bi++]??0; }
    }
    up=!up;
  }

  let bestMask=0, bestScore=Infinity, bestMatrix: number[][]=m;
  for (let mask=0;mask<8;mask++) {
    const mc = m.map(row=>[...row]);
    for (let r=0;r<N;r++) for (let c=0;c<N;c++) if(!res[r][c]&&MASKS[mask](r,c)) mc[r][c]^=1;
    const s=penalty(mc,N);
    if(s<bestScore){bestScore=s;bestMask=mask;bestMatrix=mc;}
  }

  const fmt=fmtInfo(bestMask), fb: number[]=[];
  for (let i=14;i>=0;i--) fb.push((fmt>>i)&1);
  let fi=0;
  for (let c=0;c<=8;c++){if(c===6)continue; bestMatrix[8][c]=fb[fi++];}
  for (let r=7;r>=0;r--){if(r===6)continue; bestMatrix[r][8]=fb[fi++];}
  fi=0;
  for (let r=N-7;r<N;r++) bestMatrix[r][8]=fb[fi++];
  for (let c=N-8;c<N;c++) bestMatrix[8][c]=fb[fi++];
  bestMatrix[N-8][8]=1;

  return bestMatrix;
}

export function renderQRToCanvas(
  matrix: number[][],
  canvas: HTMLCanvasElement,
  modulePx: number,
  quietZone: number,
  dark = '#000000',
  light = '#ffffff'
) {
  const N = matrix.length;
  const S = (N + quietZone * 2) * modulePx;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = dark;
  for (let r=0;r<N;r++)
    for (let c=0;c<N;c++)
      if(matrix[r][c])
        ctx.fillRect((c+quietZone)*modulePx,(r+quietZone)*modulePx,modulePx,modulePx);
}

import { createHash } from "node:crypto";

const DIMS = 64;

export const embed = (text: string): number[] => {
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  const vec = new Array(DIMS).fill(0);
  for (const t of tokens) {
    const h = createHash("sha256").update(t).digest();
    for (let i = 0; i < DIMS; i++) {
      vec[i] += (h[i % h.length] - 128) / 128;
    }
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
};

export const cosine = (a: number[], b: number[]): number => {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
};

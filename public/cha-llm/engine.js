// 字符级 GPT 的纯浏览器前向实现：int8 行量化权重 + KV cache。
// 与 train.py / export_int8.py 的数值路径一一对应，方便用 Node 做 logits 对齐。

const EPS = 1e-5;

function erf(x) {
  // Abramowitz & Stegun 7.1.26，绝对误差 < 1.5e-7
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-x * x);
  return sign * y;
}

function gelu(x) {
  return 0.5 * x * (1 + erf(x / Math.SQRT2));
}

export class GPTModel {
  constructor(meta, buffer) {
    this.meta = meta;
    this.cfg = meta.config;
    const { nLayer, nHead, nEmbd, block, vocab, headDim } = this.cfg;
    this.D = nEmbd;
    this.H = nHead;
    this.HD = headDim;
    this.L = nLayer;
    this.block = block;
    this.vocab = vocab;

    const views = {};
    for (const [name, t] of Object.entries(meta.tensors)) {
      const count = t.shape.reduce((a, b) => a * b, 1);
      if (t.dtype === "i8") {
        views[name] = new Int8Array(buffer, t.offset, count);
      } else {
        views[name] = new Float32Array(buffer, t.offset, count);
      }
    }
    this.v = views;

    this.chars = Array.from(meta.chars);
    this.stoi = new Map();
    this.chars.forEach((c, i) => this.stoi.set(c, i));

    this.layers = [];
    for (let i = 0; i < nLayer; i++) {
      const p = `blocks.${i}.`;
      this.layers.push({
        ln1w: views[p + "ln1.weight"],
        ln1b: views[p + "ln1.bias"],
        wqkv: views[p + "attn.in_proj_weight"],
        sqkv: views[p + "attn.in_proj_weight.scales"],
        bqkv: views[p + "attn.in_proj_bias"],
        wo: views[p + "attn.out_proj.weight"],
        so: views[p + "attn.out_proj.weight.scales"],
        bo: views[p + "attn.out_proj.bias"],
        ln2w: views[p + "ln2.weight"],
        ln2b: views[p + "ln2.bias"],
        w1: views[p + "mlp.0.weight"],
        s1: views[p + "mlp.0.weight.scales"],
        b1: views[p + "mlp.0.bias"],
        w2: views[p + "mlp.2.weight"],
        s2: views[p + "mlp.2.weight.scales"],
        b2: views[p + "mlp.2.bias"],
      });
    }
    this.tokQ = views["tok.weight"];
    this.tokS = views["tok.weight.scales"];
    this.posQ = views["pos.weight"];
    this.posS = views["pos.weight.scales"];
    this.lnfW = views["lnf.weight"];
    this.lnfB = views["lnf.bias"];

    this.x = new Float32Array(nEmbd);
    this.h = new Float32Array(nEmbd);
    this.qkv = new Float32Array(3 * nEmbd);
    this.attn = new Float32Array(nEmbd);
    this.proj = new Float32Array(nEmbd);
    this.mlp = new Float32Array(4 * nEmbd);
    this.mlpOut = new Float32Array(nEmbd);
    this.logits = new Float32Array(vocab);

    const cacheSize = nLayer * nHead * block * headDim;
    this.kCache = new Float32Array(cacheSize);
    this.vCache = new Float32Array(cacheSize);
    this.scores = new Float32Array(block);

    this.pos = 0;
  }

  reset() {
    this.pos = 0;
    this.kCache.fill(0);
    this.vCache.fill(0);
  }

  encode(text) {
    return Array.from(text, (c) => this.stoi.get(c) ?? 0);
  }

  decode(id) {
    return this.chars[id] ?? "";
  }

  layernorm(src, w, b, out) {
    const D = this.D;
    let mean = 0;
    for (let i = 0; i < D; i++) mean += src[i];
    mean /= D;
    let v = 0;
    for (let i = 0; i < D; i++) {
      const d = src[i] - mean;
      v += d * d;
    }
    const inv = 1 / Math.sqrt(v / D + EPS);
    for (let i = 0; i < D; i++) out[i] = (src[i] - mean) * inv * w[i] + b[i];
  }

  linear(q, scale, bias, src, out, rows, cols) {
    for (let o = 0; o < rows; o++) {
      const base = o * cols;
      let s = 0;
      let i = 0;
      for (; i + 3 < cols; i += 4) {
        s +=
          q[base + i] * src[i] +
          q[base + i + 1] * src[i + 1] +
          q[base + i + 2] * src[i + 2] +
          q[base + i + 3] * src[i + 3];
      }
      for (; i < cols; i++) s += q[base + i] * src[i];
      out[o] = s * scale[o] + bias[o];
    }
  }

  forward(tokenId) {
    const { D, H, HD, block } = this;
    const pos = this.pos;
    if (pos >= block) throw new Error("context overflow");
    this.pos = pos + 1;

    const x = this.x;
    const tokBase = tokenId * D;
    const tokScale = this.tokS[tokenId];
    const posBase = pos * D;
    const posScale = this.posS[pos];
    for (let i = 0; i < D; i++) {
      x[i] = this.tokQ[tokBase + i] * tokScale + this.posQ[posBase + i] * posScale;
    }

    const h = this.h;
    const qkv = this.qkv;
    const attn = this.attn;
    const proj = this.proj;
    const mlp = this.mlp;
    const mlpOut = this.mlpOut;
    const scores = this.scores;
    const scaleAttn = 1 / Math.sqrt(HD);

    for (let li = 0; li < this.L; li++) {
      const L = this.layers[li];

      this.layernorm(x, L.ln1w, L.ln1b, h);
      this.linear(L.wqkv, L.sqkv, L.bqkv, h, qkv, 3 * D, D);

      for (let hd = 0; hd < H; hd++) {
        const vecBase = hd * HD;
        const cacheBase = (li * H + hd) * block * HD;
        const kOff = cacheBase + pos * HD;

        for (let d = 0; d < HD; d++) {
          this.kCache[kOff + d] = qkv[D + vecBase + d];
          this.vCache[kOff + d] = qkv[2 * D + vecBase + d];
        }

        let maxScore = -Infinity;
        for (let j = 0; j <= pos; j++) {
          const base = cacheBase + j * HD;
          let s = 0;
          for (let d = 0; d < HD; d++) s += qkv[vecBase + d] * this.kCache[base + d];
          s *= scaleAttn;
          scores[j] = s;
          if (s > maxScore) maxScore = s;
        }
        let sum = 0;
        for (let j = 0; j <= pos; j++) {
          const e = Math.exp(scores[j] - maxScore);
          scores[j] = e;
          sum += e;
        }
        const invSum = 1 / sum;
        for (let d = 0; d < HD; d++) {
          let acc = 0;
          for (let j = 0; j <= pos; j++) {
            acc += scores[j] * this.vCache[cacheBase + j * HD + d];
          }
          attn[vecBase + d] = acc * invSum;
        }
      }

      this.linear(L.wo, L.so, L.bo, attn, proj, D, D);
      for (let i = 0; i < D; i++) x[i] += proj[i];

      this.layernorm(x, L.ln2w, L.ln2b, h);
      this.linear(L.w1, L.s1, L.b1, h, mlp, 4 * D, D);
      for (let i = 0; i < 4 * D; i++) mlp[i] = gelu(mlp[i]);
      this.linear(L.w2, L.s2, L.b2, mlp, mlpOut, D, 4 * D);
      for (let i = 0; i < D; i++) x[i] += mlpOut[i];
    }

    this.layernorm(x, this.lnfW, this.lnfB, h);

    const logits = this.logits;
    const tokQ = this.tokQ;
    const tokS = this.tokS;
    for (let o = 0; o < this.vocab; o++) {
      const base = o * D;
      let s = 0;
      for (let i = 0; i < D; i++) s += tokQ[base + i] * h[i];
      logits[o] = s * tokS[o];
    }
    return logits;
  }

  sample(logits, temperature, topK) {
    const V = this.vocab;
    const k = Math.max(1, Math.min(topK | 0, V));
    const vals = new Float32Array(k).fill(-Infinity);
    const ids = new Int32Array(k).fill(-1);

    for (let i = 0; i < V; i++) {
      const v = logits[i] / temperature;
      if (v <= vals[k - 1]) continue;
      let p = k - 1;
      while (p > 0 && v > vals[p - 1]) {
        vals[p] = vals[p - 1];
        ids[p] = ids[p - 1];
        p--;
      }
      vals[p] = v;
      ids[p] = i;
    }

    let max = -Infinity;
    for (let i = 0; i < k; i++) if (vals[i] > max) max = vals[i];
    let sum = 0;
    const probs = new Float32Array(k);
    for (let i = 0; i < k; i++) {
      const e = Math.exp(vals[i] - max);
      probs[i] = e;
      sum += e;
    }
    let r = Math.random() * sum;
    for (let i = 0; i < k; i++) {
      r -= probs[i];
      if (r <= 0) return ids[i];
    }
    return ids[k - 1];
  }
}

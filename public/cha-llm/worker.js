import { GPTModel } from "./engine.js";

let model = null;
let busy = false;
let cancel = false;
let banIds = [];
let letterIds = [];

// 干净模式：小模型很容易吐出 Markdown/URL 碎片和伪拉丁串，采样层直接压掉
const BAN_CHARS = "#*_`{}[]<>|\\=;~^$@\"'/";
const isLetter = (ch) => /[A-Za-z]/.test(ch);

function prepareConstraints() {
  banIds = [...BAN_CHARS].map((c) => model.stoi.get(c)).filter((i) => i !== undefined);
  letterIds = [];
  model.chars.forEach((c, i) => {
    if (isLetter(c)) letterIds.push(i);
  });
}

function applyCleanMask(logits, history) {
  for (const id of banIds) logits[id] = -Infinity;
  if (history.length >= 3) {
    const tail = history.slice(-3).map((id) => model.decode(id)).join("");
    if (/^[A-Za-z]{3}$/.test(tail)) {
      for (const id of letterIds) logits[id] = -Infinity;
    }
  }
}

const post = (msg) => self.postMessage(msg);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const STALL_MS = 12000;

async function fetchBuffer(url, onProgress, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    let stall = 0;
    const arm = () => {
      clearTimeout(stall);
      stall = setTimeout(() => controller.abort(), STALL_MS);
    };
    try {
      const target = attempt === 1 ? url : `${url}?retry=${attempt}-${Date.now()}`;
      arm();
      const res = await fetch(target, {
        signal: controller.signal,
        cache: attempt === 1 ? "default" : "no-store",
      });
      if (!res.ok) throw new Error(`无法读取 ${url}（HTTP ${res.status}）`);
      const total = Number(res.headers.get("content-length")) || 0;
      if (!res.body) {
        const buf = await res.arrayBuffer();
        onProgress(buf.byteLength, buf.byteLength);
        return buf;
      }
      const reader = res.body.getReader();
      const chunks = [];
      let loaded = 0;
      let last = 0;
      arm();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        arm();
        const now = performance.now();
        if (now - last > 90) {
          onProgress(loaded, total);
          last = now;
        }
      }
      clearTimeout(stall);
      onProgress(loaded, total || loaded);
      const out = new Uint8Array(loaded);
      let off = 0;
      for (const c of chunks) {
        out.set(c, off);
        off += c.length;
      }
      return out.buffer;
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
      post({
        type: "retry",
        attempt: attempt + 1,
        attempts,
        reason: controller.signal.aborted ? "下载停滞" : err?.message || "网络错误",
      });
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      clearTimeout(stall);
    }
  }
  throw new Error(`权重下载失败：${lastError?.message || lastError}（已尝试 ${attempts} 次）`);
}

async function load() {
  const t0 = performance.now();
  post({ type: "progress", phase: "meta", loaded: 0, total: 0 });
  const metaRes = await fetch("/cha-llm/model.json");
  if (!metaRes.ok) throw new Error(`无法读取 model.json（HTTP ${metaRes.status}）`);
  const meta = await metaRes.json();
  post({ type: "progress", phase: "weights", loaded: 0, total: 0 });
  const bin = await fetchBuffer("/cha-llm/model.bin", (loaded, total) => {
    post({ type: "progress", phase: "weights", loaded, total });
  });
  model = new GPTModel(meta, bin);
  prepareConstraints();
  post({
    type: "ready",
    stats: meta.stats,
    config: meta.config,
    bytes: meta.totalBytes,
    loadMs: performance.now() - t0,
  });
}

async function generate({ prompt, maxTokens, temperature, topK, clean = true }) {
  if (!model) throw new Error("模型尚未加载");
  busy = true;
  cancel = false;
  const t0 = performance.now();
  try {
    let ids = model.encode(String(prompt ?? ""));
    if (ids.length === 0) ids = [model.stoi.get("我") ?? 0];
    if (ids.length >= model.block - 2) {
      throw new Error(`提示词太长：${ids.length} 字，模型上下文只有 ${model.block}`);
    }
    const limit = Math.max(0, Math.min(maxTokens | 0, model.block - ids.length - 2));
    post({ type: "start", promptTokens: ids.length, limit, requested: maxTokens | 0 });

    model.reset();
    let logits = null;
    for (let i = 0; i < ids.length; i++) {
      logits = model.forward(ids[i]);
      if ((i & 7) === 0) await tick();
      if (cancel) break;
    }

    let count = 0;
    let lastPost = t0;
    const history = ids.slice();
    for (let n = 0; n < limit && !cancel; n++) {
      if (clean) applyCleanMask(logits, history);
      const next = model.sample(logits, temperature, topK, history);
      post({ type: "token", id: next, text: model.decode(next) });
      history.push(next);
      count++;
      const now = performance.now();
      if (now - lastPost > 160) {
        post({ type: "stats", count, elapsed: now - t0 });
        lastPost = now;
      }
      if (n < limit - 1) logits = model.forward(next);
      await tick();
    }
    post({
      type: "done",
      count,
      limit,
      requested: maxTokens | 0,
      elapsed: performance.now() - t0,
      cancelled: cancel,
    });
  } finally {
    busy = false;
    cancel = false;
  }
}

self.onmessage = (ev) => {
  const msg = ev.data;
  if (msg.type === "load") {
    load().catch((err) => {
      post({ type: "error", message: err?.message || String(err) });
    });
  } else if (msg.type === "generate") {
    if (busy || !model) return;
    generate(msg).catch((err) => {
      post({ type: "error", message: err?.message || String(err) });
    });
  } else if (msg.type === "cancel") {
    cancel = true;
  }
};

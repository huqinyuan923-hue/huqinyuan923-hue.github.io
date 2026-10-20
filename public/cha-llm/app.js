const $ = (id) => document.getElementById(id);
const promptEl = $("prompt");
const outputEl = $("output");
const runBtn = $("run");
const stopBtn = $("stop");
const loadStatus = $("loadStatus");
const statsEl = $("stats");
const loadbar = $("loadbar");
const bar = loadbar.querySelector("i");
const examples = $("examples");
const copyBtn = $("copy");
const announcer = $("announcer");
const rightPane = document.querySelector(".pane.right");

let ready = false;
let generating = false;
let loading = true;
let loadFailed = false;
let accumulated = "";
let copyTimer = 0;

const worker = new Worker("/cha-llm/worker.js", { type: "module" });

function setStatus(text, cls = "") {
  loadStatus.textContent = text;
  loadStatus.title = text;
  loadStatus.className = "meta" + (cls ? " " + cls : "");
}

function setStats(text) {
  statsEl.textContent = text;
  statsEl.title = text;
}

function announce(text) {
  announcer.textContent = text;
}

function formatBytes(n) {
  if (!n) return "—";
  return (n / 1048576).toFixed(1) + " MB";
}

function bindSlider(id, labelId, digits) {
  const input = $(id);
  const label = $(labelId);
  const update = () => {
    label.textContent = digits ? Number(input.value).toFixed(digits) : input.value;
  };
  input.addEventListener("input", update);
  update();
}
bindSlider("temp", "tempVal", 2);
bindSlider("topk", "topkVal", 0);
bindSlider("len", "lenVal", 0);

examples.addEventListener("change", () => {
  if (!examples.value) return;
  promptEl.value = examples.value;
  examples.selectedIndex = 0;
  promptEl.focus();
});

promptEl.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    start();
  }
});

runBtn.addEventListener("click", start);
stopBtn.addEventListener("click", () => {
  worker.postMessage({ type: "cancel" });
  stopBtn.disabled = true;
});

copyBtn.addEventListener("click", async () => {
  if (!accumulated) return;
  try {
    await navigator.clipboard.writeText(accumulated);
    copyBtn.textContent = "已复制";
    announce("已复制生成结果");
  } catch {
    copyBtn.textContent = "复制失败";
  }
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyBtn.textContent = "复制";
  }, 1600);
});

function beginLoad() {
  loadFailed = false;
  loading = true;
  ready = false;
  runBtn.textContent = "▶ 生成";
  runBtn.disabled = true;
  stopBtn.disabled = true;
  loadbar.classList.remove("done");
  bar.style.width = "4%";
  setStatus("正在加载权重…");
  worker.postMessage({ type: "load" });
}

function start() {
  if (loadFailed && !loading) {
    beginLoad();
    return;
  }
  if (!ready || generating) return;
  const prompt = promptEl.value.trim() || "我用 AI";
  promptEl.value = prompt;
  accumulated = "";
  outputEl.textContent = "";
  outputEl.setAttribute("aria-busy", "true");
  outputEl.classList.add("streaming");
  generating = true;
  runBtn.disabled = true;
  stopBtn.disabled = false;
  copyBtn.disabled = true;
  copyBtn.textContent = "复制";
  clearTimeout(copyTimer);
  setStats("准备中…");
  worker.postMessage({
    type: "generate",
    prompt,
    maxTokens: Number($("len").value),
    temperature: Number($("temp").value),
    topK: Number($("topk").value),
    clean: $("clean").checked,
  });
}

function finish() {
  generating = false;
  outputEl.setAttribute("aria-busy", "false");
  outputEl.classList.remove("streaming");
  runBtn.disabled = !ready;
  stopBtn.disabled = true;
}

worker.onmessage = (ev) => {
  const msg = ev.data;
  if (msg.type === "progress") {
    if (msg.phase === "meta") {
      setStatus("读取模型配置…");
      bar.style.width = "4%";
    } else {
      const pct = msg.total ? Math.min(100, Math.round((msg.loaded / msg.total) * 100)) : 0;
      setStatus(
        pct
          ? `加载权重 ${pct}%`
          : msg.loaded
            ? `加载权重 ${formatBytes(msg.loaded)}`
            : "准备下载权重…"
      );
      bar.style.width = pct ? Math.max(4, pct) + "%" : "30%";
    }
  } else if (msg.type === "retry") {
    setStatus(`下载中断（${msg.reason}），重试 ${msg.attempt}/${msg.attempts}…`);
    bar.style.width = "4%";
    announce(`权重下载中断，正在第 ${msg.attempt} 次重试，共 ${msg.attempts} 次`);
  } else if (msg.type === "ready") {
    ready = true;
    loading = false;
    loadFailed = false;
    loadbar.classList.add("done");
    bar.style.width = "100%";
    setStatus(
      `就绪 · ${formatBytes(msg.bytes)} · ${Math.round(msg.loadMs)}ms`,
      "ok"
    );
    runBtn.textContent = "▶ 生成";
    runBtn.disabled = false;
    setStats("输入提示词，点「生成」开始");
    const ms = Math.round(msg.loadMs);
    announce(`模型就绪，权重 ${formatBytes(msg.bytes)}，加载用时 ${ms < 1000 ? `${ms} 毫秒` : `${(ms / 1000).toFixed(1)} 秒`}`);
    const s = msg.stats || {};
    if (s.int8Val != null) {
      $("factLoss").textContent = Number(s.int8Val).toFixed(3);
      $("factLoss").title = `fp32 ${Number(s.fp32Val).toFixed(4)}`;
    }
    $("factBytes").textContent = formatBytes(msg.bytes);
  } else if (msg.type === "start") {
    const extra = msg.limit < msg.requested ? ` · 上下文上限 ${msg.limit} 字` : "";
    setStats(`提示词 ${msg.promptTokens} 字 · 生成中${extra}`);
    if (window.matchMedia("(max-width: 860px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rightPane.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  } else if (msg.type === "token") {
    if (!accumulated) copyBtn.disabled = false;
    accumulated += msg.text;
    outputEl.textContent = accumulated;
    outputEl.scrollTop = outputEl.scrollHeight;
  } else if (msg.type === "stats") {
    const tps = msg.elapsed > 0 ? (msg.count / (msg.elapsed / 1000)).toFixed(1) : "0.0";
    setStats(`${msg.count} 字 · ${tps} tok/s`);
  } else if (msg.type === "done") {
    finish();
    const secs = msg.elapsed / 1000;
    const tps = secs > 0 ? (msg.count / secs).toFixed(1) : "0.0";
    const prefix = msg.cancelled ? "已停止 · " : "";
    const extra = msg.limit < msg.requested ? ` · 触达 ${msg.limit} 字上限` : "";
    setStats(`${prefix}${msg.count} 字 · ${tps} tok/s · ${secs.toFixed(1)}s${extra}`);
    announce(msg.cancelled ? "已停止生成" : `生成完成，共 ${msg.count} 字`);
    if (msg.count === 0 && !msg.cancelled) {
      setStatus("就绪 · 未生成内容", "ok");
    }
  } else if (msg.type === "error") {
    const wasReady = ready;
    finish();
    if (!wasReady) {
      loading = false;
      loadFailed = true;
      runBtn.textContent = "↻ 重试加载";
      runBtn.disabled = false;
      setStatus("加载失败：" + msg.message, "err");
      setStats("点击「重试加载」重新下载权重");
      announce("模型加载失败，可以点击重试加载按钮重试");
    } else {
      setStatus("出错：" + msg.message, "err");
      setStats("调整提示词后可再次生成");
      announce("生成出错：" + msg.message);
    }
    console.error(msg.message);
  }
};

worker.onerror = (ev) => {
  finish();
  ready = false;
  loading = false;
  loadFailed = false;
  runBtn.textContent = "▶ 生成";
  runBtn.disabled = true;
  setStatus("Worker 出错：" + (ev.message || "未知错误"), "err");
  setStats("刷新页面后重试");
  announce("推理进程出错，请刷新页面后重试");
  console.error(ev);
};

beginLoad();

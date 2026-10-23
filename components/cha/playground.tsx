'use client'

import { Play, RotateCcw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cha（茶）在线 Playground：双引擎版。
 * 解释器以 Web Worker 形式内嵌（public/cha/cha-worker.js），与系列文章配套。
 * 引擎三模式：树遍历解释器 / 字节码 VM / 对照（同一段代码双引擎各跑一遍，
 * 并排显示输出与耗时并判定一致性）。会话模式——各引擎的变量跨次运行保留；
 * 运行超过 5 秒由主线程终止 Worker，死循环不会冻住页面。
 */

type Phase = 'lex' | 'parse' | 'resolve' | 'runtime'
type Engine = 'tree' | 'vm' | 'both'

interface ChaError {
  name: string
  message: string
  line: number
  col: number
  phase: Phase
}

interface SingleResult {
  output: string[]
  error: ChaError | null
  ms: number | null
}

interface BothResult {
  tree: SingleResult
  vm: SingleResult
  match: boolean
}

const PHASE_NAMES: Record<Phase, string> = {
  lex: '词法',
  parse: '语法',
  resolve: '作用域',
  runtime: '运行时',
}

const ENGINE_NAMES: Record<Engine, string> = {
  tree: '树遍历',
  vm: '字节码 VM',
  both: '对照',
}

export const CHA_EXAMPLES: Record<string, { label: string; code: string }> = {
  ch1: {
    label: '初见',
    code: `var 杯子 = ["龙井", "普洱", "铁观音"];
fn 冲泡(茶名, 次数) {
    return "第 \${次数} 泡 \${茶名}";
}
for (var i = 1; i <= len(杯子); i += 1) {
    print(冲泡(杯子[i - 1], i));
}`,
  },
  fib: {
    label: '递归',
    code: `fn fib(n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}
for (var i = 0; i <= 10; i += 1) {
    print("fib(\${i}) = \${fib(i)}");
}`,
  },
  closures: {
    label: '闭包',
    code: `fn makeCounter(prefix) {
    var count = 0;
    fn increment() {
        count += 1;
        return "\${prefix} 第 \${count} 次";
    }
    return increment;
}
var tea = makeCounter("茶");
var cake = makeCounter("点心");
print(tea());
print(tea());
print(cake());
print(tea());`,
  },
  classes: {
    label: '类',
    code: `class 动物 {
    init(名字) {
        this.名字 = 名字;
    }
    自我介绍() {
        return "我是 \${this.名字}";
    }
}
class 猫 < 动物 {
    自我介绍() {
        return "\${super.自我介绍()}，喵";
    }
}
var 咪咪 = 猫("咪咪");
print(咪咪.自我介绍());`,
  },
  fizzbuzz: {
    label: 'FizzBuzz',
    code: `for (var i = 1; i <= 15; i += 1) {
    if (i % 15 == 0) {
        print("FizzBuzz");
    } else if (i % 3 == 0) {
        print("Fizz");
    } else if (i % 5 == 0) {
        print("Buzz");
    } else {
        print(i);
    }
}`,
  },
  stdlib: {
    label: '标准库',
    code: `var 茶单 = {龙井: 30, 普洱: 25};
茶单["铁观音"] = 28;
print(茶单["龙井"], len(茶单), has(茶单, "普洱"));
print(keys(茶单));
print(range(3), range(1, 4), range(10, 0, -3));
print(type(1), type("字"), type(nil), type([1]), type({}), type(print));`,
  },
}

const TIMEOUT_MS = 5000

interface WorkerReply {
  id: number
  engine?: Engine
  output?: string[]
  error?: ChaError
  ms?: number
  reset?: boolean
  tree?: SingleResult
  vm?: SingleResult
  match?: boolean
}

export function ChaPlayground({
  initialExample = 'ch1',
  compact = false,
}: {
  /** 初始示例的 key（CHA_EXAMPLES 的键） */
  initialExample?: string
  /** 文章内嵌的紧凑模式 */
  compact?: boolean
}) {
  const initial = CHA_EXAMPLES[initialExample] ?? CHA_EXAMPLES.ch1!
  const [code, setCode] = useState(initial.code)
  const [engine, setEngine] = useState<Engine>('tree')
  const [single, setSingle] = useState<SingleResult | null>(null)
  const [both, setBoth] = useState<BothResult | null>(null)
  const [running, setRunning] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef(0)

  const killWorker = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  useEffect(() => killWorker, [killWorker])

  const spawnWorker = useCallback((): Worker => {
    const worker = new Worker('/cha/cha-worker.js')
    worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      const data = e.data
      if (data.id !== idRef.current) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      if (data.engine === 'both' && data.tree && data.vm) {
        setBoth({ tree: data.tree, vm: data.vm, match: data.match === true })
        setSingle(null)
      } else {
        setSingle({ output: data.output ?? [], error: data.error ?? null, ms: data.ms ?? null })
        setBoth(null)
      }
      setRunning(false)
    }
    worker.onerror = () => {
      setSingle({
        output: [],
        error: {
          name: 'WorkerError',
          message: '解释器 Worker 加载失败，请刷新页面重试',
          line: 0,
          col: 0,
          phase: 'runtime',
        },
        ms: null,
      })
      setRunning(false)
      killWorker()
    }
    return worker
  }, [killWorker])

  const run = useCallback(() => {
    if (running) return
    // 复用 Worker：两个引擎的会话各自跨次运行保留；仅超时后重建（会话清空）
    idRef.current += 1
    const worker = workerRef.current ?? spawnWorker()
    workerRef.current = worker
    setRunning(true)
    setSingle(null)
    setBoth(null)
    worker.postMessage({ id: idRef.current, engine, source: code })
    timerRef.current = setTimeout(() => {
      killWorker()
      setRunning(false)
      setSingle({
        output: [],
        error: {
          name: 'TimeoutError',
          message: `执行超过 ${TIMEOUT_MS / 1000} 秒，已终止——可能是死循环（Worker 已重置，会话数据清空）`,
          line: 0,
          col: 0,
          phase: 'runtime',
        },
        ms: null,
      })
    }, TIMEOUT_MS)
  }, [code, engine, killWorker, running, spawnWorker])

  const resetSession = useCallback(() => {
    killWorker()
    setRunning(false)
    setSingle(null)
    setBoth(null)
  }, [killWorker])

  function loadExample(key: string) {
    const ex = CHA_EXAMPLES[key]
    if (!ex) return
    killWorker()
    setRunning(false)
    setSingle(null)
    setBoth(null)
    setCode(ex.code)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      run()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const { selectionStart: s, selectionEnd: t } = el
      const next = code.slice(0, s) + '  ' + code.slice(t)
      setCode(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 2
      })
    }
  }

  function OutputPane({ title, result }: { title: string; result: SingleResult }) {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1 dark:border-gray-800">
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{title}</span>
          {result.ms !== null && (
            <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">
              {result.ms}ms
            </span>
          )}
        </div>
        {result.error ? (
          <div className="px-3 py-2 text-xs">
            <span className="me-2 inline-block rounded bg-red-600/10 px-1.5 py-0.5 font-medium text-red-600 dark:bg-red-400/10 dark:text-red-400">
              {PHASE_NAMES[result.error.phase] ?? '错误'}
              {result.error.line > 0 && ` @${result.error.line}:${result.error.col}`}
            </span>
            <span className="text-gray-700 dark:text-gray-300">{result.error.message}</span>
          </div>
        ) : result.output.length > 0 ? (
          <pre className="max-h-56 overflow-auto px-3 py-2 font-mono text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
            {result.output.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </pre>
        ) : (
          <div className="px-3 py-2 font-mono text-xs text-gray-400 dark:text-gray-500">
            （无输出）
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-200 bg-gray-100/70 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/70">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          ☕ <span className="hidden sm:inline">Cha Playground</span>
        </span>
        {!compact && (
          <span className="hidden items-center gap-1 text-xs text-gray-400 dark:text-gray-500 md:inline-flex">
            <Sparkles className="h-3 w-3" />
            会话模式：变量跨次运行保留
          </span>
        )}
        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={resetSession}
            disabled={running}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <RotateCcw className="h-3 w-3" />
            重置
          </button>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
          >
            <Play className="h-3 w-3" />
            {running ? '运行中…' : '运行'}
            <kbd className="ms-1 hidden rounded border border-white/40 px-1 text-[10px] sm:inline">
              Ctrl↵
            </kbd>
          </button>
        </div>
      </div>

      {/* 引擎与示例切换 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
        <div className="flex items-center gap-1" role="group" aria-label="引擎选择">
          {(Object.keys(ENGINE_NAMES) as Engine[]).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEngine(e)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                engine === e
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {ENGINE_NAMES[e]}
            </button>
          ))}
        </div>
        <span className="hidden text-[10px] text-gray-400 dark:text-gray-500 sm:inline">
          {engine === 'both' ? '双引擎各跑一遍 · 两会话相互独立' : '后端'}
        </span>
        <div className="ms-auto flex flex-wrap items-center gap-1.5">
          {Object.entries(CHA_EXAMPLES).map(([key, ex]) => (
            <button
              key={key}
              type="button"
              onClick={() => loadExample(key)}
              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                code === ex.code
                  ? 'bg-primary-600/10 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400'
                  : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* 编辑器 */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        aria-label="Cha 代码编辑器"
        className="block w-full resize-y bg-transparent px-3 py-3 font-mono text-[13px] leading-relaxed text-gray-800 outline-none dark:text-gray-200"
        style={{ minHeight: compact ? '13rem' : '18rem' }}
      />

      {/* 输出 */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        {running && (
          <div className="px-3 py-2 font-mono text-xs text-gray-400 dark:text-gray-500">
            {engine === 'both' ? '双引擎运行中…' : '运行中…'}
          </div>
        )}
        {!running && engine === 'both' && both && (
          <div>
            <div
              className={`px-3 py-1.5 text-xs font-medium ${
                both.match
                  ? 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400'
                  : 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
              }`}
            >
              {both.match
                ? '✓ 双引擎输出一致（差分测试口径）'
                : '✗ 双引擎输出不一致——两会话独立演进时属正常，可重置后用纯计算代码再试'}
            </div>
            <div className="flex flex-col divide-y dark:divide-gray-800 sm:flex-row sm:divide-x sm:divide-y-0">
              <OutputPane title="树遍历解释器" result={both.tree} />
              <OutputPane title="字节码 VM" result={both.vm} />
            </div>
          </div>
        )}
        {!running && (engine !== 'both' || !both) && single && (
          <OutputPane title={ENGINE_NAMES[engine]} result={single} />
        )}
        {!running &&
          !single &&
          !both &&
          (engine === 'both' ? (
            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
              点击「运行」——同一段代码双引擎各跑一遍，对比输出与耗时
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
              点击「运行」或按 Ctrl+Enter 查看输出
            </div>
          ))}
        {!running && single?.ms != null && engine !== 'both' && (
          <div className="border-t border-gray-100 px-3 py-1 text-end text-[10px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
            {ENGINE_NAMES[engine]} · {single.ms}ms · cha-lang 双引擎驱动
          </div>
        )}
      </div>
    </div>
  )
}

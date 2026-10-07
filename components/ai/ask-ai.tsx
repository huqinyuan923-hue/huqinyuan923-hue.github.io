'use client'

import { Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Source {
  n: number
  title: string
  url: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    '你好！我是本站的 AI 助手，读过这里所有文章。关于博主的项目、踩坑记录、技术笔记，直接问我就行～',
}

/**
 * 站内 RAG 问答浮窗：POST /api/ask 由 Cloudflare Worker 调 Workers AI，
 * 基于构建期生成的文章向量索引检索语料，流式返回答案与引用。
 */
export function AskAI() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function ask(question: string) {
    const history = messages
      .filter((m) => m !== WELCOME)
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '' },
    ])
    setStreaming(true)
    setError('')

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, history }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `服务异常（${res.status}）`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let answer = ''
      let sources: Source[] = []
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() || ''
        for (const line of lines) {
          const t = line.trim()
          if (!t.startsWith('data:')) continue
          const payload = t.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const chunk = JSON.parse(payload)
            if (chunk.t) {
              answer += chunk.t
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', content: answer, sources }
                return next
              })
            } else if (chunk.sources) {
              sources = chunk.sources
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { role: 'assistant', content: answer, sources }
                return next
              })
            } else if (chunk.error) {
              throw new Error(chunk.error)
            }
          } catch (e) {
            if (e instanceof Error && e.message && !e.message.includes('JSON')) throw e
          }
        }
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.name === 'AbortError'
          ? ''
          : e instanceof Error
            ? e.message
            : '未知错误'
      if (msg) {
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.role !== 'assistant' || m.content !== ''))
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function submit() {
    const q = input.trim()
    if (!q || streaming) return
    setInput('')
    void ask(q)
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="问 AI：基于站内文章的问答助手"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-primary-500 sm:bottom-8 sm:right-8 sm:h-12 sm:w-auto sm:gap-2 sm:px-4 lg:right-[5.5rem]"
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden text-sm font-medium sm:inline">问 AI</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[32rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:bottom-8 sm:right-8 lg:right-[5.5rem]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />问 AI ·
              站内文章问答
            </div>
            <button
              type="button"
              aria-label="关闭"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={listRef} className="grow space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary-600 px-3 py-2 text-sm text-white'
                      : 'max-w-[95%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                  }
                >
                  {m.content}
                  {m.role === 'assistant' &&
                    streaming &&
                    i === messages.length - 1 &&
                    !m.content && (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        正在检索文章…
                      </span>
                    )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.sources.map((s) => (
                        <a
                          key={s.n}
                          href={new URL(s.url).pathname}
                          className="rounded-full bg-primary-600/10 px-2 py-0.5 text-xs text-primary-600 hover:bg-primary-600/20 dark:bg-primary-400/10 dark:text-primary-400 dark:hover:bg-primary-400/20"
                        >
                          [{s.n}] {s.title.length > 14 ? s.title.slice(0, 14) + '…' : s.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
                }}
                placeholder="比如：你的街机厅是怎么做的？"
                maxLength={500}
                className="h-9 grow rounded-lg bg-gray-100 px-3 text-sm outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-primary-500 dark:bg-gray-800"
              />
              <button
                type="button"
                onClick={submit}
                disabled={streaming || !input.trim()}
                className="h-9 rounded-lg bg-primary-600 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-40"
              >
                {streaming ? '…' : '发送'}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
              回答由 AI 基于站内文章生成，可能有误，请以原文为准
            </p>
          </div>
        </div>
      )}
    </>
  )
}

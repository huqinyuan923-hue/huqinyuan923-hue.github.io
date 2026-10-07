import { Sparkles } from 'lucide-react'

/** 文章开头的一句话结论盒子，数据来自 frontmatter 的 tldr 字段 */
export function TldrBox({ tldr }: { tldr?: string }) {
  if (!tldr) return null
  return (
    <div className="not-prose mb-8 rounded-xl border border-primary-500/25 bg-primary-50/50 p-4 dark:border-primary-400/25 dark:bg-primary-900/15">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
        <Sparkles className="h-4 w-4" />
        TL;DR
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">{tldr}</p>
    </div>
  )
}

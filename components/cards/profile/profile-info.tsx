import { Github, Mail, MapPin } from 'lucide-react'
import { AUTHOR_INFO } from '~/data/author-info'

function getAccountHandle(url = '') {
  const lastPart = url.split('/').pop()
  if (lastPart) {
    return lastPart
  }
  return url
}

/** HUD 数据行：左侧 mono 标签，右侧值 */
function HudRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-gray-200 py-2 dark:border-white/10">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-right text-sm text-gray-700 dark:text-gray-200">
        {children}
      </span>
    </div>
  )
}

export function ProfileCardInfo() {
  const handle = getAccountHandle(AUTHOR_INFO.social.github)

  return (
    <div className="hidden flex-col gap-3 py-4 md:flex md:px-5">
      <div className="flex items-center justify-between">
        <h2 className="font-grotesk text-xl font-bold text-gray-900 dark:text-white">
          {AUTHOR_INFO.name}
        </h2>
        <span className="rounded border border-primary-500/40 bg-primary-500/10 px-1.5 py-0.5 font-mono text-[10px] text-primary-600 dark:text-primary-300">
          {'<dev/>'}
        </span>
      </div>

      <div className="space-y-0">
        <HudRow label="loc">
          <MapPin strokeWidth={1.5} size={14} className="text-primary-500" />
          {AUTHOR_INFO.address.city}
        </HudRow>
        <HudRow label="mail">
          <Mail strokeWidth={1.5} size={14} className="shrink-0 text-primary-500" />
          <a
            className="min-w-0 truncate hover:text-primary-600 dark:hover:text-primary-400"
            href={`mailto:${AUTHOR_INFO.email}`}
          >
            {AUTHOR_INFO.email}
          </a>
        </HudRow>
        <HudRow label="git">
          <Github strokeWidth={1.5} size={14} className="text-primary-500" />
          <a
            className="truncate hover:text-primary-600 dark:hover:text-primary-400"
            href={AUTHOR_INFO.social.github}
            target="_blank"
            rel="noreferrer"
            data-umami-event="profile-card-github"
          >
            {handle}
          </a>
        </HudRow>
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
        {'// 学编程 · 折腾有意思的技术 · 写点东西'}
      </p>
    </div>
  )
}

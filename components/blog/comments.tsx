'use client'

import type { Mapping, BooleanString, InputPosition } from '@giscus/react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { SITE_METADATA } from '~/data/site-metadata'

const GiscusComponent = dynamic(() => import('@giscus/react'), { ssr: false })

interface GiscusConfig {
  themeURL: string
  theme: string
  darkTheme: string
  mapping: Mapping
  repo: `${string}/${string}`
  repositoryId: string
  category: string
  categoryId: string
  reactions: BooleanString
  metadata: BooleanString
  inputPosition: InputPosition
  lang: string
}

interface CommentsProps {
  configs?: Partial<GiscusConfig>
  className?: string
}

export function Comments({ configs, className }: CommentsProps) {
  const defaultConfigs = SITE_METADATA.comments.giscusConfig as GiscusConfig
  const {
    themeURL,
    theme,
    darkTheme,
    repo,
    repositoryId,
    category,
    categoryId,
    reactions,
    metadata,
    inputPosition,
    lang,
    mapping,
  } = { ...defaultConfigs, ...configs }

  const { theme: siteTheme, resolvedTheme } = useTheme()
  const commentsTheme =
    themeURL === ''
      ? siteTheme === 'dark' || resolvedTheme === 'dark'
        ? darkTheme
        : theme
      : themeURL

  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [visible])

  // giscus env vars come from CI repository variables; without a repo the
  // widget would just hammer giscus.app with 403s, so render nothing.
  if (!repo) return null

  return (
    <div id="comment" className={className} ref={containerRef}>
      {visible ? (
        <GiscusComponent
          id="comments-container"
          repo={repo}
          repoId={repositoryId}
          category={category}
          categoryId={categoryId}
          mapping={mapping}
          reactionsEnabled={reactions}
          emitMetadata={metadata}
          inputPosition={inputPosition}
          theme={commentsTheme}
          lang={lang}
          loading="lazy"
        />
      ) : (
        <div className="h-24" aria-hidden="true" />
      )}
    </div>
  )
}

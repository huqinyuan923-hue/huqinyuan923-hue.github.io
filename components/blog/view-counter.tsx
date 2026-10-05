'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import type { ViewApiResponse, ViewCounterProps } from '~/types/data'
import { fetcher } from '~/utils/misc'
import { IS_STATIC_EXPORT } from '~/utils/is-static-export'

export function ViewCounter({ slug, className }: ViewCounterProps) {
  const { data } = useSWR(
    IS_STATIC_EXPORT ? null : `/api/views/${slug}`,
    fetcher
  ) as ViewApiResponse
  const views = Number(data?.total)

  useEffect(() => {
    if (IS_STATIC_EXPORT) return
    const registerView = () => fetch(`/api/views/${slug}`, { method: 'POST' })
    registerView()
  }, [slug])

  if (IS_STATIC_EXPORT) return null

  return <span className={className}>{+views > 0 ? views.toLocaleString() : '–––'} views</span>
}

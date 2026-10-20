'use client'

import { Command } from 'lucide-react'
import { requestOpenSearch } from './search-events'

export function KbarSearchTrigger() {
  return (
    <button
      aria-label="Search"
      className="rounded p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
      data-umami-event="search-the-site"
      onClick={requestOpenSearch}
    >
      <Command size={20} strokeWidth={1.5} />
    </button>
  )
}

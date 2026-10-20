import type { Action } from 'kbar'

export const OPEN_SEARCH_EVENT = 'site:open-search'

export interface KBarSearchProps {
  searchDocumentsPath: string | false
  defaultActions?: Action[]
  onSearchDocumentsLoad?: (json: any) => Action[]
}

export function requestOpenSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))
}

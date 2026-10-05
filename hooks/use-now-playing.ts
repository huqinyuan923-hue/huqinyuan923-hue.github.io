import useSWR from 'swr'
import type { SpotifyNowPlayingData } from '~/types/data'
import { fetcher } from '~/utils/misc'
import { IS_STATIC_EXPORT } from '~/utils/is-static-export'

export function useNowPlaying() {
  const { data } = useSWR<SpotifyNowPlayingData>(
    IS_STATIC_EXPORT ? null : '/api/spotify',
    fetcher,
    {
      // Keep the homepage quiet: don't refetch on focus/reconnect spam.
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Prevent duplicated requests across quick re-mounts / transitions.
      dedupingInterval: 5 * 60 * 1000,
      // Avoid aggressive retries when Spotify creds are missing or rate limited.
      errorRetryCount: 1,
      errorRetryInterval: 30 * 1000,
    }
  )
  return data || { isPlaying: false }
}

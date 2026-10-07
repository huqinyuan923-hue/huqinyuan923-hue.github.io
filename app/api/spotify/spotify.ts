const SPOTIFY_TOKEN_API = `https://accounts.spotify.com/api/token`
const SPOTIFY_NOW_PLAYING_API = `https://api.spotify.com/v1/me/player/currently-playing`
const SPOTIFY_TOP_TRACKS_API = `https://api.spotify.com/v1/me/top/tracks`

// 仅允许可见 ASCII：防止环境变量中的 CR/LF 被注入 HTTP 请求头
const SAFE_CREDENTIAL = /^[\x21-\x7e]+$/

/**
 * 运行时读取并校验 Spotify 凭证：缺失或包含控制字符时直接抛错（fail closed），
 * 未经验证的值不会流入任何请求头。
 */
function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Spotify credentials are not fully configured')
  }
  if (
    !SAFE_CREDENTIAL.test(clientId) ||
    !SAFE_CREDENTIAL.test(clientSecret) ||
    !SAFE_CREDENTIAL.test(refreshToken)
  ) {
    throw new Error('Spotify credentials contain invalid characters')
  }

  return {
    basic: Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    refreshToken,
  }
}

async function getAccessToken() {
  const { basic, refreshToken } = getCredentials()
  const response = await fetch(SPOTIFY_TOKEN_API, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  return response.json()
}

export async function getNowPlaying() {
  const { access_token } = await getAccessToken()
  const url = new URL(SPOTIFY_NOW_PLAYING_API)
  url.searchParams.append('additional_types', 'track,episode')

  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: 'no-store',
  })
}

export async function getTopTracks() {
  const { access_token } = await getAccessToken()

  return fetch(SPOTIFY_TOP_TRACKS_API, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
}

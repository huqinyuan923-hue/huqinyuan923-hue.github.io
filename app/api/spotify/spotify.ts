// Spotify API 地址以内联字面量写在各 fetch 处（可被静态验证为常量目标）

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
  // URL 字面量内联：fetch 目标恒为 Spotify 官方 API，杜绝 SSRF 可能
  const response = await fetch('https://accounts.spotify.com/api/token', {
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
  const url = new URL('https://api.spotify.com/v1/me/player/currently-playing')
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

  return fetch('https://api.spotify.com/v1/me/top/tracks', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
}

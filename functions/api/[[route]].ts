import { handleApiRequest, type Env } from '../../worker/index'

interface PagesFunctionContext {
  request: Request
  env: unknown
}

/**
 * Cloudflare Pages Functions 路由：/api/* 全部交给 worker/index.ts 的
 * handleApiRequest 处理（Pages 项目里 main/assets 配置不生效，
 * AI 绑定与 vars 由 wrangler.jsonc 的 pages_build_output_dir 形态声明）。
 */
export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  return handleApiRequest(context.request, context.env as Env)
}

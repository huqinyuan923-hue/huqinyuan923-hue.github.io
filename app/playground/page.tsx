import type { Metadata } from 'next'
import Link from 'next/link'
import { genPageMetadata } from '~/app/seo'
import { ChaPlayground } from '~/components/cha/playground'
import { Container } from '~/components/ui/container'
import { PageHeader } from '~/components/ui/page-header'

export const metadata: Metadata = genPageMetadata({
  title: 'Cha Playground',
  description:
    '在浏览器里直接运行 Cha（茶）编程语言——双引擎版：树遍历解释器与字节码 VM 任选，还能开对照模式让两个引擎各跑一遍、比较输出与耗时。会话模式，变量跨次运行保留。',
})

const SERIES = [
  { href: '/blog/cha-series-1-design', title: '（一）设计图纸：在写第一行代码之前' },
  { href: '/blog/cha-series-2-lexer', title: '（二）词法分析器与最难的十行模板字符串' },
  { href: '/blog/cha-series-3-parser', title: '（三）解析器：优先级是「降」出来的' },
  { href: '/blog/cha-series-4-interpreter', title: '（四）求值器：一门语言的「运行时」长什么样' },
  { href: '/blog/cha-series-5-resolver', title: '（五）作用域解析：让错误提前爆炸' },
  { href: '/blog/cha-series-6-repl', title: '（六）REPL：改了三遍才像样的第一印象' },
  { href: '/blog/cha-series-7-errors', title: '（七）错误体验：「报错是脸面」的完整故事' },
  { href: '/blog/cha-series-8-bytecode', title: '（八·终）字节码虚拟机：同一个语言，两种引擎' },
]

export default function PlaygroundPage() {
  return (
    <Container className="pt-4 lg:pt-12">
      <PageHeader
        title="Cha Playground"
        description="☕ Cha（茶）——我用 TypeScript 从零手写的编程语言，双引擎版：树遍历解释器与字节码 VM 都跑在你的浏览器里。切到「对照」模式，同一段代码两个引擎各跑一遍，直接对比输出与耗时。会话模式：变量与函数在多次运行之间保留；超过 5 秒自动终止，放心写循环。"
        className="border-b border-gray-200 dark:border-gray-700"
      />
      <div className="py-8">
        <ChaPlayground initialExample="ch1" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">这是什么</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-600 dark:text-gray-400">
              <li>
                解释器来自开源项目{' '}
                <a
                  href="https://github.com/huqinyuan923-hue/cha-lang"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  cha-lang
                </a>
                ：手写词法分析器 → 递归下降解析器 → 静态作用域解析，再分岔出两个后端——树遍历求值器
                与 字节码编译器 + 栈式虚拟机，零依赖
              </li>
              <li>双引擎编译进同一个 Worker 脚本加载进本页，没有任何服务端参与</li>
              <li>
                「对照」模式即第 8 章讲的差分测试的现场版：两引擎输出一致会打勾；
                提示——两个引擎的会话相互独立，先「重置」再用纯计算代码对照最准确
              </li>
              <li>支持中文变量名、模板字符串插值（可嵌套）、闭包、类与继承、数组与 map</li>
              <li>
                想看字节码长什么样？姊妹页{' '}
                <Link
                  href="/cha-playground/"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  /cha-playground
                </Link>{' '}
                有反汇编视图；语法速查见系列文章与{' '}
                <a
                  href="https://github.com/huqinyuan923-hue/cha-lang#readme"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  README
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold">系列文章（已完结）</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {SERIES.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    手写一门编程语言 {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Container>
  )
}

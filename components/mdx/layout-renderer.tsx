import type { MDXComponents } from 'mdx/types'
import { useMDXComponent } from 'next-contentlayer2/hooks'

export interface MDXLayoutRenderer {
  code: string
  components?: MDXComponents
  [key: string]: unknown
}

export function MDXLayoutRenderer({ code, components, ...rest }: MDXLayoutRenderer) {
  const Mdx = useMDXComponent(code)
  return <Mdx components={components} {...rest} />
}

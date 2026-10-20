'use client'

import { clsx } from 'clsx'
import type { ImageProps as NextImageProps } from 'next/image'
import NextImage from 'next/image'
import IMAGE_VARIANTS from '~/data/image-variants.json'

const variants = IMAGE_VARIANTS as Record<string, string>

export interface ImageProps extends Omit<NextImageProps, 'src' | 'priority'> {
  src: string
}

export function Image(props: ImageProps) {
  const { alt, src, loading = 'lazy', style, className, ...rest } = props
  const resolvedSrc = variants[src] ?? src

  return (
    <div
      className={clsx(
        'image-container relative overflow-hidden bg-gray-100 dark:bg-gray-800/60',
        className
      )}
    >
      <NextImage
        className="h-full max-h-full w-full object-center"
        src={resolvedSrc}
        alt={alt}
        style={{ objectFit: 'cover', ...style }}
        loading={loading}
        priority={loading === 'eager'}
        quality={85}
        {...rest}
      />
    </div>
  )
}

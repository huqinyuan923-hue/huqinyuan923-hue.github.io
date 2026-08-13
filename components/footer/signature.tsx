import { Image } from '~/components/ui/image'

export function Signature({ className }: { className?: string }) {
  return (
    <Image
      src="/static/images/signature.jpg"
      alt="ADCakeyuan"
      width={260}
      height={260}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}

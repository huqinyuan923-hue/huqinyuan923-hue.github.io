/** 星屑漂浮层：纯 CSS 动画（.star-field 样式在 tailwind.css），reduced-motion 下静止 */
const STARS = [
  { top: '8%', left: '12%', size: 12, dur: 4.2, delay: 0 },
  { top: '18%', left: '82%', size: 9, dur: 5.1, delay: 0.6 },
  { top: '30%', left: '6%', size: 7, dur: 3.8, delay: 1.2 },
  { top: '12%', left: '38%', size: 8, dur: 4.8, delay: 0.3 },
  { top: '55%', left: '16%', size: 10, dur: 5.6, delay: 0.9 },
  { top: '62%', left: '88%', size: 12, dur: 4.4, delay: 1.5 },
  { top: '42%', left: '70%', size: 7, dur: 3.6, delay: 0.2 },
  { top: '70%', left: '38%', size: 8, dur: 5.2, delay: 1.8 },
  { top: '24%', left: '58%', size: 6, dur: 4.0, delay: 2.1 },
  { top: '78%', left: '68%', size: 7, dur: 4.6, delay: 1.1 },
  { top: '36%', left: '28%', size: 6, dur: 3.9, delay: 2.4 },
  { top: '8%', left: '92%', size: 8, dur: 5.0, delay: 0.8 },
]

export function StarField() {
  return (
    <div className="star-field absolute inset-0" aria-hidden="true">
      {STARS.map(({ top, left, size, dur, delay }, i) => (
        <span
          key={i}
          style={{
            top,
            left,
            fontSize: size,
            ['--tw-dur' as string]: `${dur}s`,
            ['--tw-delay' as string]: `${delay}s`,
          }}
        >
          {i % 3 === 0 ? '✦' : '✧'}
        </span>
      ))}
    </div>
  )
}

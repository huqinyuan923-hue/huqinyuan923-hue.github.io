/**
 * 节日换肤配置（参考站同机制）：MM-DD 区间命中后由 ThemeOverride
 * 设置 html[data-festival]，CSS 变量覆盖写在 tailwind.css 末尾。
 * start > end 表示跨年区间（如 12-31 → 01-02）。
 */
export type FestivalTheme = {
  key: string
  /** MM-DD */
  start: string
  /** MM-DD */
  end: string
  name: string
}

export const FESTIVAL_THEMES: FestivalTheme[] = [
  { key: 'newyear', start: '12-31', end: '01-02', name: '元旦' },
  { key: 'spring', start: '01-20', end: '01-28', name: '春节' },
  /** 致敬爱弥斯毕业 PV「祝福」：整个六月 */
  { key: 'graduation', start: '06-01', end: '06-30', name: '毕业快乐' },
]

export function matchFestival(date = new Date()): FestivalTheme | undefined {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return FESTIVAL_THEMES.find(({ start, end }) =>
    start > end ? mmdd >= start || mmdd <= end : mmdd >= start && mmdd <= end
  )
}

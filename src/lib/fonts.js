// Opsi font Kanji — diterapkan lewat CSS variable --font-jp & --font-serif-jp.

export const KANJI_FONTS = [
  {
    key: 'maru',
    label: 'Zen Maru Gothic',
    desc: 'Bulat & ramah (bawaan)',
    jp: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Yu Gothic', sans-serif",
    serif: "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif",
  },
  {
    key: 'gothic',
    label: 'Noto Sans JP',
    desc: 'Modern & bersih',
    jp: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif",
    serif: "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif",
  },
  {
    key: 'round',
    label: 'M PLUS Rounded',
    desc: 'Lembut, menggemaskan',
    jp: "'M PLUS Rounded 1c', 'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif",
    serif: "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif",
  },
  {
    key: 'mincho',
    label: 'Shippori Mincho',
    desc: 'Serif tradisional',
    jp: "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif",
    serif: "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif",
  },
  {
    key: 'serif',
    label: 'Noto Serif JP',
    desc: 'Serif elegan',
    jp: "'Noto Serif JP', 'Hiragino Mincho ProN', serif",
    serif: "'Noto Serif JP', 'Hiragino Mincho ProN', serif",
  },
  {
    key: 'ud',
    label: 'BIZ UDGothic',
    desc: 'Teknis & tegas',
    jp: "'BIZ UDGothic', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif",
    serif: "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif",
  },
]

export const DEFAULT_KANJI_FONT = 'maru'

export function kanjiFontOf(key) {
  return KANJI_FONTS.find((f) => f.key === key) || KANJI_FONTS[0]
}
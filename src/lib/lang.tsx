import { useState, useCallback, useContext, createContext } from 'react'
import type { Lang } from '../lib/i18n'
import { t as translate, STRINGS } from '../lib/i18n'

const LangContext = createContext<{ lang: Lang; t: (k: keyof typeof STRINGS) => string; toggle: () => void }>({
  lang: 'sw',
  t: () => '',
  toggle: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('kumbuka-lang')
    return (saved === 'en' || saved === 'sw') ? saved : 'sw'
  })

  const toggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'sw' ? 'en' : 'sw'
      localStorage.setItem('kumbuka-lang', next)
      return next
    })
  }, [])

  const t = useCallback((key: keyof typeof STRINGS) => translate(key, lang), [lang])

  return (
    <LangContext.Provider value={{ lang, t, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

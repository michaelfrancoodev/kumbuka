import { NavLink, useLocation } from 'react-router-dom'
import { Mic, ListChecks, BarChart3, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { useLang } from '../../lib/lang'

export function BottomNav() {
  const { lang } = useLang()
  const loc = useLocation()
  const items = [
    { to: '/', icon: Mic, label: lang === 'sw' ? 'Rekodi' : 'Record' },
    { to: '/records', icon: ListChecks, label: lang === 'sw' ? 'Rekodi' : 'Records' },
    { to: '/reports', icon: BarChart3, label: lang === 'sw' ? 'Ripoti' : 'Reports' },
    { to: '/ask', icon: Search, label: lang === 'sw' ? 'Uliza' : 'Ask' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-ink-600/40 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname === to
          return (
            <NavLink key={to} to={to} className="flex flex-col items-center gap-1 px-4 py-1.5 transition-all duration-200">
              <Icon
                className={clsx('w-5 h-5 transition-all duration-200', active ? 'text-gold-500' : 'text-ink-300')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={clsx('text-[10px] font-medium transition-all', active ? 'text-gold-500' : 'text-ink-300')}>
                {label}
              </span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bg-gold-500 rounded-full" />}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

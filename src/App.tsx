import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LangProvider, useLang } from './lib/lang'
import { BottomNav } from './components/shell/BottomNav'
import { RecordPage } from './pages/RecordPage'
import { RecordsPage } from './pages/RecordsPage'
import { ReportsPage } from './pages/ReportsPage'
import { AskPage } from './pages/AskPage'
import { registerWebMCPTools } from './lib/webmcp-register'

function LangToggle() {
  const { lang, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-30 px-3 py-1.5 glass rounded-lg text-xs font-medium text-ink-200 hover:text-gold-400 transition-colors"
    >
      {lang === 'sw' ? 'EN' : 'SW'}
    </button>
  )
}

function AppInner() {
  useEffect(() => {
    registerWebMCPTools()
  }, [])

  return (
    <div className="min-h-screen bg-ink-900">
      <LangToggle />
      <Routes>
        <Route path="/" element={<RecordPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/ask" element={<AskPage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  )
}

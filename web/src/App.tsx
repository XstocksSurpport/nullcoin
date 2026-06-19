import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Docs } from './components/Docs'
import { MintPanel } from './components/MintPanel'
import { StrikePanel } from './components/StrikePanel'
import { ShieldPanel } from './components/ShieldPanel'
import { DEFAULT_DOC_PAGE } from './docs/nav'

const PAGE_TITLE_KEYS: Record<string, string> = {
  mint: 'pages.presale',
  strike: 'pages.transfer',
  shield: 'pages.protection',
}

function App() {
  const { t } = useTranslation()
  const [active, setActive] = useState('overview')
  const [docsPage, setDocsPage] = useState(DEFAULT_DOC_PAGE)

  function navigate(id: string) {
    setActive(id)
    if (id === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (id !== 'docs') {
      requestAnimationFrame(() => {
        document.getElementById('protocol')?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('docs-mode', active === 'docs')
    return () => document.documentElement.classList.remove('docs-mode')
  }, [active])

  const isAppPanel = active === 'mint' || active === 'strike' || active === 'shield'

  return (
    <div className={`app${active === 'overview' ? ' app-landing' : ''}`}>
      <Nav active={active} onNavigate={navigate} />

      {active === 'overview' && (
        <div className="landing">
          <Hero onMint={() => navigate('mint')} />
        </div>
      )}

      {active === 'docs' && <Docs pageId={docsPage} onPageChange={setDocsPage} />}

      {isAppPanel && (
        <main className="main main-compact main-app">
          <header className="page-header">
            <h1>{t(PAGE_TITLE_KEYS[active])}</h1>
          </header>
          <div id="protocol" className="protocol-section">
            {active === 'mint' && <MintPanel />}
            {active === 'strike' && <StrikePanel />}
            {active === 'shield' && <ShieldPanel />}
          </div>
        </main>
      )}
    </div>
  )
}

export default App

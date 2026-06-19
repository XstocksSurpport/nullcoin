import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from './Logo'
import { DOCS_NAV, findDocPage } from '../docs/nav'
import { DocBody } from '../docs/content'

type DocsProps = {
  pageId: string
  onPageChange: (id: string) => void
}

export function Docs({ pageId, onPageChange }: DocsProps) {
  const { t } = useTranslation()
  const page = findDocPage(pageId) ?? findDocPage('about')!

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pageId])

  return (
    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label={t('docs.sidebar')}>
        <div className="docs-sidebar-head">
          <Logo markSize={28} />
          <span className="docs-sidebar-label">{t('docs.sidebar')}</span>
        </div>

        <nav className="docs-nav">
          {DOCS_NAV.map((group) => (
            <div key={group.groupId} className="docs-nav-group">
              <p className="docs-nav-group-label">{t(group.labelKey)}</p>
              <ul>
                {group.pages.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`docs-nav-link${p.id === page.id ? ' active' : ''}`}
                      onClick={() => onPageChange(p.id)}
                    >
                      {t(p.titleKey)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="docs-main">
        <div className="docs-mobile-nav">
          <label className="docs-mobile-nav-label" htmlFor="docs-page-select">
            {t('docs.sidebar')}
          </label>
          <select
            id="docs-page-select"
            className="docs-mobile-nav-select"
            value={page.id}
            onChange={(e) => onPageChange(e.target.value)}
          >
            {DOCS_NAV.map((group) => (
              <optgroup key={group.groupId} label={t(group.labelKey)}>
                {group.pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(p.titleKey)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <article className="docs-article">
          <header className="docs-article-head">
            <p className="docs-article-eyebrow">{t('docs.eyebrow')}</p>
            <h1>{t(page.titleKey)}</h1>
          </header>
          <div className="docs-prose">
            <DocBody pageId={page.id} />
          </div>
        </article>

        <aside className="docs-toc" aria-label={t('docs.onThisPage')}>
          <p className="docs-toc-label">{t('docs.onThisPage')}</p>
          <ul>
            {page.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="docs-toc-link">
                  {t(section.titleKey)}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

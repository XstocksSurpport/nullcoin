import { useTranslation } from 'react-i18next'
import { Logo } from './Logo'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <Logo markSize={36} className="footer-logo" />
      <p className="footer-copy">{t('footer.copy', { year: new Date().getFullYear() })}</p>
    </footer>
  )
}

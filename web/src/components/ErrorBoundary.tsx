import { Component, type ErrorInfo, type ReactNode } from 'react'
import { withTranslation, type WithTranslation } from 'react-i18next'

type Props = WithTranslation & {
  children: ReactNode
}

type State = {
  error: Error | null
}

class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error:', error, info.componentStack)
  }

  render() {
    const { t } = this.props

    if (this.state.error) {
      return (
        <div className="panel" style={{ margin: '2rem auto', maxWidth: 520 }}>
          <h2>{t('error.title')}</h2>
          <p className="muted">{this.state.error.message}</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => this.setState({ error: null })}
          >
            {t('error.retry')}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase)

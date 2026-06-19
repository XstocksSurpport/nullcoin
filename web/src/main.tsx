import { createRoot } from 'react-dom/client'
import './i18n'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import { PRIVY_APP_ID, privyConfig } from './privy'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 12_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <App />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  </ErrorBoundary>,
)

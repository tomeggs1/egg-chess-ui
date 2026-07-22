import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted Roboto (bundled into the build, served from our own origin so it
// renders identically on every device and needs no external font CDN).
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext'
import { PieceThemeProvider } from './pieces/PieceThemeContext'
import { BoardThemeProvider } from './board/BoardThemeContext'
import { queryClient } from './queryClient'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PieceThemeProvider>
            <BoardThemeProvider>
              <App />
            </BoardThemeProvider>
          </PieceThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

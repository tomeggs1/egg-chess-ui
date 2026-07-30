import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (bundled into the build, served from our own origin so they
// render identically on every device and need no external font CDN).
// Cinzel = display, EB Garamond = body, Roboto = numerals only (FONT.numeric),
// which keeps ratings, clocks and HP values tabular.
import '@fontsource/cinzel/400.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/cinzel/700.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/500.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/eb-garamond/700.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import App from './App.tsx'
import { theme } from './theme/muiTheme'
import { GlobalCss } from './theme/GlobalCss'
import { AuthProvider } from './auth/AuthContext'
import { PieceThemeProvider } from './pieces/PieceThemeContext'
import { BoardThemeProvider } from './board/BoardThemeContext'
import { SoundProvider } from './audio/SoundContext'
import { queryClient } from './queryClient'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalCss />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <PieceThemeProvider>
              <BoardThemeProvider>
                <SoundProvider>
                  <App />
                </SoundProvider>
              </BoardThemeProvider>
            </PieceThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)

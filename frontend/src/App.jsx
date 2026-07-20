import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { UserProvider } from './context/user.context'
import { ThemeProvider } from './context/theme.context'
import { Toaster } from 'react-hot-toast'

const App = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--nc-surface)',
              color: 'var(--nc-text-primary)',
              border: '1px solid var(--nc-border)',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <AppRoutes />
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
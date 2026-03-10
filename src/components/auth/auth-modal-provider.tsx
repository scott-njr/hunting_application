'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { AuthModal } from './auth-modal'

interface AuthModalContextValue {
  openAuthModal: (view?: 'login' | 'signup', redirectTo?: string) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextValue>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
})

export function useAuthModal() {
  return useContext(AuthModalContext)
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultView, setDefaultView] = useState<'login' | 'signup'>('login')
  const [redirectTo, setRedirectTo] = useState('/home')

  const openAuthModal = useCallback((view: 'login' | 'signup' = 'login', redirect?: string) => {
    setDefaultView(view)
    setRedirectTo(redirect ?? '/home')
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={closeAuthModal}
        defaultView={defaultView}
        redirectTo={redirectTo}
      />
    </AuthModalContext.Provider>
  )
}

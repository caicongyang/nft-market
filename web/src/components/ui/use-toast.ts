import { useState, useEffect, createContext, useContext } from "react"

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

type ToastType = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const ToastContext = createContext<{
  toasts: ToastType[]
  addToast: (toast: Omit<ToastType, "id">) => void
  removeToast: (id: string) => void
  updateToast: (id: string, toast: Partial<ToastType>) => void
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  updateToast: () => {},
})

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const addToast = (toast: Omit<ToastType, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, ...toast }])
    
    // Auto dismiss after 5 seconds
    if (toast.variant !== "destructive") {
      setTimeout(() => {
        removeToast(id)
      }, 5000)
    }
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const updateToast = (id: string, toast: Partial<ToastType>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...toast } : t))
    )
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  const { toasts, addToast, removeToast, updateToast } = context

  const toast = ({
    title,
    description,
    variant,
    action,
  }: {
    title?: React.ReactNode
    description?: React.ReactNode
    variant?: "default" | "destructive"
    action?: ToastActionElement
  }) => {
    addToast({ title, description, variant, action })
  }

  return { toast, toasts, dismissToast: removeToast, updateToast }
} 
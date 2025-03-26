"use client"

import * as React from "react"
import { 
  Toast, 
  ToastTitle, 
  ToastDescription,
  ToastProvider,
  ToastViewport
} from "@/components/ui/toast"
import { ToastContext, useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
          {action}
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

// 创建完整的 ToastWrapper 组件
export function ToastWrapper({ children }: { children: React.ReactNode }) {
  const value = useToast()

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
} 
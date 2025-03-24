"use client"

import * as React from "react"
import { useToast, ToastProvider } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          {title && <Toast.Title>{title}</Toast.Title>}
          {description && <Toast.Description>{description}</Toast.Description>}
          {action && <Toast.Action>{action}</Toast.Action>}
        </Toast>
      ))}
    </div>
  )
}

// 使用正确的 ToastProvider
export function ToastWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
} 
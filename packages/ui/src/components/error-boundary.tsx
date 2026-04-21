"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "./button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-black tracking-wide text-red-800 uppercase dark:text-red-200">
                Đã xảy ra lỗi
              </h3>
              <p className="text-sm font-medium text-red-600 dark:text-red-300">
                {this.state.error?.message || "Không thể tải dữ liệu."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="mt-2 border-red-200 bg-white font-bold text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

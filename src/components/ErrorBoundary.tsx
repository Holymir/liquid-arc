"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ background: "#0a141d" }}
        >
          {/* Ambient glow */}
          <div
            className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(245,158,11,0.04) 0%, transparent 60%)",
            }}
          />

          <div
            className="glass-panel rounded-2xl p-8 sm:p-10 max-w-lg w-full text-center relative z-10"
            style={{
              boxShadow:
                "0 8px 64px rgba(0,0,0,0.5), 0 0 48px rgba(245,158,11,0.06)",
            }}
          >
            {/* Warning Icon */}
            <div
              className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <AlertTriangle
                className="w-8 h-8"
                style={{ color: "#f59e0b" }}
              />
            </div>

            {/* Heading */}
            <h1
              className="text-2xl sm:text-3xl font-bold text-on-surface mb-3"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Something went wrong
            </h1>

            {/* Error message */}
            <div
              className="rounded-xl p-4 mb-6"
              style={{
                background: "rgba(255,180,171,0.06)",
                border: "1px solid rgba(255,180,171,0.12)",
              }}
            >
              <p
                className="text-sm leading-relaxed break-words"
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  color: "#ffb4ab",
                }}
              >
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="btn-primary px-6 py-3 text-sm w-full sm:w-auto transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Try Again
              </button>
              <a
                href="/"
                className="btn-secondary px-6 py-3 text-sm w-full sm:w-auto text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

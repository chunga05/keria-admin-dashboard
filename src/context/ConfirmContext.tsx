"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

// ─── Context ─────────────────────────────────────────────────────────────────
const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export const useConfirm = () => useContext(ConfirmContext);

// ─── Provider ────────────────────────────────────────────────────────────────
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  // Variant button styles
  const confirmBtnClass =
    state?.options.variant === "danger"
      ? "bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-red-900/20"
      : state?.options.variant === "warning"
      ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200 dark:shadow-orange-900/20"
      : "bg-brand-500 hover:bg-brand-600 shadow-brand-200 dark:shadow-brand-900/20";

  // Variant icon
  const iconEl =
    state?.options.variant === "danger" ? (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
    ) : state?.options.variant === "warning" ? (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
        <svg className="h-6 w-6 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
    ) : (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* ── Modal ── */}
      {state && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in fade-in zoom-in-95 duration-200">
            {/* Body */}
            <div className="flex items-start gap-4 p-6">
              <div className="shrink-0">{iconEl}</div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-base font-bold text-gray-800 dark:text-white">
                  {state.options.title}
                </h3>
                {state.options.message && (
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {state.options.message}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
              <button
                onClick={handleCancel}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {state.options.cancelLabel ?? "Huỷ"}
              </button>
              <button
                onClick={handleConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition ${confirmBtnClass}`}
              >
                {state.options.confirmLabel ?? "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

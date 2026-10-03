import React from "react";
import Link from "next/link";
import { Construction, Sparkles, Clock, ArrowLeft, Home, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UnderConstructionProps {
  title?: string;
  description?: string;
  featureName?: string;
  variant?: "page" | "card" | "inline" | "banner";
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  estimatedRelease?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function UnderConstruction({
  title = "Tính năng này đang được phát triển",
  description = "Module quản trị này đang được hoàn thiện. Vui lòng quay lại sau!",
  featureName,
  variant = "card",
  showBackButton,
  backButtonText = "Quay về Bảng điều khiển",
  backButtonHref = "/",
  estimatedRelease,
  className,
  children,
}: UnderConstructionProps) {
  const shouldShowBack = showBackButton ?? (variant === "page");

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-sm",
          className
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 shrink-0">
          <Construction className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {featureName ? `${featureName} - ` : ""}
            {title}
          </span>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        {children}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div className={cn("min-h-[60vh] flex flex-col items-center justify-center p-6 text-center", className)}>
        <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center mb-4">
            <Construction className="h-8 w-8" />
          </div>
          {featureName && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 mb-2">
              <Hammer className="h-3 w-3" />
              {featureName}
            </span>
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{description}</p>
          {shouldShowBack && (
            <Link
              href={backButtonHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Home className="h-4 w-4" />
              {backButtonText}
            </Link>
          )}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center bg-gray-50/50 dark:bg-gray-900/30 flex flex-col items-center justify-center min-h-[220px]",
        className
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-3">
        <Construction className="h-6 w-6" />
      </div>
      {featureName && (
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
          {featureName}
        </span>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mb-4">{description}</p>
      {shouldShowBack && (
        <Link
          href={backButtonHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backButtonText}
        </Link>
      )}
      {children}
    </div>
  );
}

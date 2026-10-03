import React from "react";
import UnderConstruction, { UnderConstructionProps } from "./UnderConstruction";
import { isFeatureEnabled, FeatureKey } from "@/config/features";

export interface FeatureFlagProps {
  flag: FeatureKey | boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  fallbackVariant?: "page" | "card" | "inline";
  featureName?: string;
  description?: string;
  title?: string;
  silent?: boolean;
  showBackButton?: boolean;
  backButtonHref?: string;
  className?: string;
}

export default function FeatureFlag({
  flag,
  children,
  fallback,
  fallbackVariant = "card",
  featureName,
  description,
  title,
  silent = false,
  showBackButton,
  backButtonHref,
  className,
}: FeatureFlagProps) {
  const enabled = typeof flag === "boolean" ? flag : isFeatureEnabled(flag);

  if (enabled) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  if (silent) {
    return null;
  }

  return (
    <UnderConstruction
      variant={fallbackVariant}
      featureName={featureName}
      title={title}
      description={description}
      showBackButton={showBackButton}
      backButtonHref={backButtonHref}
      className={className}
    />
  );
}

/**
 * Centralized Feature Flag Configuration for Admin Dashboard
 * 
 * Manages feature flags controlled via environment variables.
 * Safe fallback to `false` when env variable is missing or invalid.
 */

export interface FeatureFlagDefinition {
  name: string;
  envVar: string;
  defaultValue: boolean;
  description?: string;
}

export function parseBooleanEnv(value: string | undefined | null, defaultValue = false): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on", "enable", "enabled"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off", "disable", "disabled", ""].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

export const FEATURES = {
  ADVANCED_ANALYTICS: "advanced_analytics",
  BULK_EXPORT: "bulk_export",
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

export const FEATURE_DEFINITIONS: Record<FeatureKey, FeatureFlagDefinition> = {
  [FEATURES.ADVANCED_ANALYTICS]: {
    name: "Advanced Analytics",
    envVar: "NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS",
    defaultValue: false,
    description: "Báo cáo thống kê nâng cao",
  },
  [FEATURES.BULK_EXPORT]: {
    name: "Bulk Data Export",
    envVar: "NEXT_PUBLIC_ENABLE_BULK_EXPORT",
    defaultValue: false,
    description: "Tính năng xuất dữ liệu hàng loạt",
  },
};

export function isFeatureEnabled(key: FeatureKey | string): boolean {
  const def = (FEATURE_DEFINITIONS as Record<string, FeatureFlagDefinition>)[key];
  const defaultValue = def ? def.defaultValue : false;

  let rawEnvValue: string | undefined;

  switch (key) {
    case FEATURES.ADVANCED_ANALYTICS:
      rawEnvValue = process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS;
      break;
    case FEATURES.BULK_EXPORT:
      rawEnvValue = process.env.NEXT_PUBLIC_ENABLE_BULK_EXPORT;
      break;
    default:
      rawEnvValue = undefined;
  }

  return parseBooleanEnv(rawEnvValue, defaultValue);
}

export const featureFlags = {
  get advancedAnalytics() {
    return isFeatureEnabled(FEATURES.ADVANCED_ANALYTICS);
  },
  get bulkExport() {
    return isFeatureEnabled(FEATURES.BULK_EXPORT);
  },
};

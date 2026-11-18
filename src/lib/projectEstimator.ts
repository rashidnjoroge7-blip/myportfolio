export type ProjectCategory =
  | "landing"
  | "business"
  | "corporate"
  | "ecommerce"
  | "webapp";

export type ProjectSize = "small" | "medium" | "large" | "enterprise";
export type DesignLevel = "standard" | "custom" | "premium";

export type EstimatorFeature =
  | "booking"
  | "payments"
  | "accounts"
  | "dashboard"
  | "integrations"
  | "cms"
  | "seo";

export type EstimatorService = "hosting" | "maintenance";

export type EstimatorSelections = {
  category: ProjectCategory;
  size: ProjectSize;
  design: DesignLevel;
  features: EstimatorFeature[];
  services: EstimatorService[];
};

const categoryPricing: Record<ProjectCategory, [number, number]> = {
  landing: [15000, 25000],
  business: [35000, 50000],
  corporate: [60000, 85000],
  ecommerce: [75000, 120000],
  webapp: [100000, 180000],
};

const sizePricing: Record<ProjectSize, [number, number]> = {
  small: [0, 0],
  medium: [10000, 15000],
  large: [20000, 30000],
  enterprise: [40000, 60000],
};

const designPricing: Record<DesignLevel, [number, number]> = {
  standard: [0, 0],
  custom: [10000, 15000],
  premium: [20000, 30000],
};

const featurePricing: Record<EstimatorFeature, [number, number]> = {
  booking: [12000, 20000],
  payments: [15000, 25000],
  accounts: [15000, 25000],
  dashboard: [20000, 35000],
  integrations: [10000, 20000],
  cms: [8000, 15000],
  seo: [5000, 10000],
};

const servicePricing: Record<EstimatorService, [number, number]> = {
  hosting: [5000, 10000],
  maintenance: [8000, 15000],
};

const validCategories = Object.keys(categoryPricing);
const validSizes = Object.keys(sizePricing);
const validDesigns = Object.keys(designPricing);
const validFeatures = Object.keys(featurePricing);
const validServices = Object.keys(servicePricing);

export function validateEstimatorSelections(
  value: unknown,
): value is EstimatorSelections {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const selections = value as Record<string, unknown>;

  return (
    typeof selections.category === "string" &&
    validCategories.includes(selections.category) &&
    typeof selections.size === "string" &&
    validSizes.includes(selections.size) &&
    typeof selections.design === "string" &&
    validDesigns.includes(selections.design) &&
    Array.isArray(selections.features) &&
    selections.features.length <= validFeatures.length &&
    selections.features.every(
      (item) => typeof item === "string" && validFeatures.includes(item),
    ) &&
    new Set(selections.features).size === selections.features.length &&
    Array.isArray(selections.services) &&
    selections.services.length <= validServices.length &&
    selections.services.every(
      (item) => typeof item === "string" && validServices.includes(item),
    ) &&
    new Set(selections.services).size === selections.services.length
  );
}

export function calculateProjectEstimate(selections: EstimatorSelections) {
  const ranges: [number, number][] = [
    categoryPricing[selections.category],
    sizePricing[selections.size],
    designPricing[selections.design],
    ...selections.features.map((feature) => featurePricing[feature]),
    ...selections.services.map((service) => servicePricing[service]),
  ];

  const minimum = ranges.reduce((total, range) => total + range[0], 0);
  const maximum = ranges.reduce((total, range) => total + range[1], 0);

  return {
    minimum,
    maximum,
    currency: "KES" as const,
  };
}

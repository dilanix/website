"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import {
  CoreApiError,
  createAllocation,
  createBudget,
  createReport,
  createSavedView,
  deleteAllocation,
  deleteBudget,
  deleteReport,
  deleteSavedView,
  queryCostExplorer,
  runCostExplorerSavedView,
  updateAllocation,
  updateAnomalyStatus,
  updateBudget,
  updateReport,
  updateSavedView,
  type CoreAllocation,
  type CoreAnomaly,
  type CoreBudget,
  type CoreCostExplorerResponse,
  type CoreReport,
  type CoreSavedView,
  type CoreScopeCondition,
  type CostExplorerQueryInput,
} from "@/lib/core/api";

export type CostActionResult<T = undefined> = {
  data?: T;
  error?: string;
};

const BASE_PATH = "/dashboard/products/cost";

async function context() {
  const token = await getAccessToken();
  if (!token) throw new Error("Your session has expired.");
  const me = await getMe(token);
  const organization = me.organizations[0];
  if (!organization)
    throw new Error("Your account does not belong to an organization.");
  return { token, organizationId: organization.organization_id };
}

function message(error: unknown) {
  return error instanceof CoreApiError || error instanceof Error
    ? error.message
    : "Unable to complete the request.";
}

function validationMessage(result: z.ZodError) {
  return result.issues[0]?.message ?? "The submitted data is invalid.";
}

const idSchema = z.uuid();
const nameSchema = z.string().trim().min(1).max(255);
const descriptionSchema = z.string().trim().max(2000).nullable();
const recipientsSchema = z.array(z.email()).max(50);

const scopeConditionSchema = z
  .object({
    dimension: z.enum([
      "provider_name",
      "billing_account_id",
      "sub_account_id",
      "service_category",
      "service_name",
      "region_id",
      "resource_id",
      "resource_type",
      "charge_category",
      "tag",
    ]),
    tag_key: z.string().trim().min(1).max(200).nullable().optional(),
    operator: z.enum(["eq", "in", "not_in"]),
    value: z.union([
      z.string().trim().min(1).max(500),
      z.array(z.string().trim().min(1).max(500)).min(1).max(50),
    ]),
  })
  .refine(
    (condition) =>
      condition.dimension === "tag"
        ? Boolean(condition.tag_key)
        : !condition.tag_key,
    {
      message:
        "A tag key is required for tag scope, and must be left blank otherwise.",
      path: ["tag_key"],
    },
  )
  .refine(
    (condition) =>
      condition.operator === "eq"
        ? typeof condition.value === "string"
        : Array.isArray(condition.value),
    {
      message: "The scope value doesn't match the selected operator.",
      path: ["value"],
    },
  );

const scopeSchema = z.array(scopeConditionSchema).max(30);

function toScopeInput(scope: CoreScopeCondition[]) {
  return scope.map((condition) => ({
    dimension: condition.dimension,
    tag_key: condition.dimension === "tag" ? (condition.tag_key ?? "") : null,
    operator: condition.operator,
    value: condition.value,
  }));
}

const explorerGroupBySchema = z
  .object({
    dimension: scopeConditionSchema.shape.dimension,
    tag_key: z.string().trim().min(1).max(200).nullable().optional(),
  })
  .refine(
    (field) =>
      field.dimension === "tag" ? Boolean(field.tag_key) : !field.tag_key,
    {
      message:
        "A tag key is required for tag grouping, and must be left blank otherwise.",
      path: ["tag_key"],
    },
  );

const explorerQuerySchema = z
  .object({
    period_start: z.iso.datetime(),
    period_end: z.iso.datetime(),
    metric: z.enum([
      "billed_cost",
      "effective_cost",
      "list_cost",
      "contracted_cost",
    ]),
    granularity: z.enum(["daily", "weekly", "monthly"]).nullable(),
    group_by: z.array(explorerGroupBySchema).max(10),
    scope: scopeSchema,
  })
  .refine(
    (input) => Date.parse(input.period_end) > Date.parse(input.period_start),
    {
      message: "The period end must be after its start.",
      path: ["period_end"],
    },
  );

export async function queryCostExplorerAction(
  input: CostExplorerQueryInput,
): Promise<CostActionResult<CoreCostExplorerResponse>> {
  const parsed = explorerQuerySchema.safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await queryCostExplorer(organizationId, token, {
      ...parsed.data,
      scope: toScopeInput(parsed.data.scope),
    });
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

const savedViewQuerySchema = z
  .object({
    savedViewId: idSchema,
    periodStart: z.iso.datetime(),
    periodEnd: z.iso.datetime(),
  })
  .refine(
    (input) => Date.parse(input.periodEnd) > Date.parse(input.periodStart),
    {
      message: "The period end must be after its start.",
      path: ["periodEnd"],
    },
  );

export async function runCostExplorerSavedViewAction(
  input: z.infer<typeof savedViewQuerySchema>,
): Promise<CostActionResult<CoreCostExplorerResponse>> {
  const parsed = savedViewQuerySchema.safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await runCostExplorerSavedView(
      organizationId,
      parsed.data.savedViewId,
      token,
      {
        periodStart: parsed.data.periodStart,
        periodEnd: parsed.data.periodEnd,
      },
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

const budgetPeriodSchema = z.enum(["monthly", "quarterly", "annual", "custom"]);
const currencySchema = z
  .string()
  .trim()
  .length(3, "Use a 3-letter currency code.")
  .transform((value) => value.toUpperCase());
const amountSchema = z
  .string()
  .trim()
  .refine((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0;
  }, "Amount must be a number greater than 0.");
const alertThresholdsSchema = z.array(z.number().min(0).max(1000)).max(20);

const budgetInputSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    amount: amountSchema,
    currency: currencySchema,
    period: budgetPeriodSchema,
    periodStart: z.iso.datetime().nullable(),
    periodEnd: z.iso.datetime().nullable(),
    alertThresholds: alertThresholdsSchema,
    recipients: recipientsSchema,
    scope: scopeSchema,
  })
  .refine(
    (input) =>
      input.period !== "custom" || (input.periodStart && input.periodEnd),
    {
      message: "Custom budgets need both a start and end date.",
      path: ["periodStart"],
    },
  );

export async function createBudgetAction(
  input: z.infer<typeof budgetInputSchema>,
): Promise<CostActionResult<CoreBudget>> {
  const parsed = budgetInputSchema.safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createBudget(organizationId, token, {
      name: parsed.data.name,
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      period: parsed.data.period,
      period_start: parsed.data.periodStart,
      period_end: parsed.data.periodEnd,
      alert_thresholds: parsed.data.alertThresholds,
      recipients: parsed.data.recipients,
      scope: toScopeInput(parsed.data.scope),
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateBudgetAction(
  budgetId: string,
  input: Partial<z.infer<typeof budgetInputSchema>> & { enabled?: boolean },
): Promise<CostActionResult<CoreBudget>> {
  const idParsed = idSchema.safeParse(budgetId);
  if (!idParsed.success) return { error: "Invalid budget." };
  const parsed = budgetInputSchema.partial().safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateBudget(organizationId, idParsed.data, token, {
      name: parsed.data.name,
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      period: parsed.data.period,
      period_start: parsed.data.periodStart,
      period_end: parsed.data.periodEnd,
      alert_thresholds: parsed.data.alertThresholds,
      recipients: parsed.data.recipients,
      enabled: input.enabled,
      scope: parsed.data.scope ? toScopeInput(parsed.data.scope) : undefined,
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteBudgetAction(
  budgetId: string,
): Promise<CostActionResult<{ deletedId: string }>> {
  const parsed = idSchema.safeParse(budgetId);
  if (!parsed.success) return { error: "Invalid budget." };

  try {
    const { token, organizationId } = await context();
    await deleteBudget(organizationId, parsed.data, token);
    revalidatePath(BASE_PATH);
    return { data: { deletedId: parsed.data } };
  } catch (error) {
    return { error: message(error) };
  }
}

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------

const allocationInputSchema = z.object({
  name: nameSchema,
  targetLabel: z.string().trim().min(1).max(255),
  priority: z.number().int().min(0).max(100000),
  scope: scopeSchema,
});

export async function createAllocationAction(
  input: z.infer<typeof allocationInputSchema>,
): Promise<CostActionResult<CoreAllocation>> {
  const parsed = allocationInputSchema.safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createAllocation(organizationId, token, {
      name: parsed.data.name,
      target_label: parsed.data.targetLabel,
      priority: parsed.data.priority,
      scope: toScopeInput(parsed.data.scope),
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateAllocationAction(
  allocationId: string,
  input: Partial<z.infer<typeof allocationInputSchema>> & {
    enabled?: boolean;
  },
): Promise<CostActionResult<CoreAllocation>> {
  const idParsed = idSchema.safeParse(allocationId);
  if (!idParsed.success) return { error: "Invalid allocation." };
  const parsed = allocationInputSchema.partial().safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateAllocation(organizationId, idParsed.data, token, {
      name: parsed.data.name,
      target_label: parsed.data.targetLabel,
      priority: parsed.data.priority,
      enabled: input.enabled,
      scope: parsed.data.scope ? toScopeInput(parsed.data.scope) : undefined,
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteAllocationAction(
  allocationId: string,
): Promise<CostActionResult<{ deletedId: string }>> {
  const parsed = idSchema.safeParse(allocationId);
  if (!parsed.success) return { error: "Invalid allocation." };

  try {
    const { token, organizationId } = await context();
    await deleteAllocation(organizationId, parsed.data, token);
    revalidatePath(BASE_PATH);
    return { data: { deletedId: parsed.data } };
  } catch (error) {
    return { error: message(error) };
  }
}

// ---------------------------------------------------------------------------
// Anomalies
// ---------------------------------------------------------------------------

export async function updateAnomalyStatusAction(
  anomalyId: string,
  status: "acknowledged" | "resolved",
): Promise<CostActionResult<CoreAnomaly>> {
  const parsed = z
    .object({
      anomalyId: idSchema,
      status: z.enum(["acknowledged", "resolved"]),
    })
    .safeParse({ anomalyId, status });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateAnomalyStatus(
      organizationId,
      parsed.data.anomalyId,
      token,
      parsed.data.status,
    );
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

// ---------------------------------------------------------------------------
// Saved views
// ---------------------------------------------------------------------------

const savedViewInputSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  groupBy: z
    .array(
      z.enum([
        "provider_name",
        "billing_account_id",
        "sub_account_id",
        "service_category",
        "service_name",
        "region_id",
        "resource_id",
        "resource_type",
        "charge_category",
      ]),
    )
    .max(10),
  granularity: z.enum(["daily", "weekly", "monthly"]),
  visibility: z.enum(["private", "organization"]),
  scope: scopeSchema,
});

export async function createSavedViewAction(
  input: z.infer<typeof savedViewInputSchema>,
): Promise<CostActionResult<CoreSavedView>> {
  const parsed = savedViewInputSchema.safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createSavedView(organizationId, token, {
      name: parsed.data.name,
      description: parsed.data.description,
      group_by: parsed.data.groupBy,
      granularity: parsed.data.granularity,
      visibility: parsed.data.visibility,
      scope: toScopeInput(parsed.data.scope),
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateSavedViewAction(
  savedViewId: string,
  input: Partial<z.infer<typeof savedViewInputSchema>>,
): Promise<CostActionResult<CoreSavedView>> {
  const idParsed = idSchema.safeParse(savedViewId);
  if (!idParsed.success) return { error: "Invalid saved view." };
  const parsed = savedViewInputSchema.partial().safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateSavedView(organizationId, idParsed.data, token, {
      name: parsed.data.name,
      description: parsed.data.description,
      group_by: parsed.data.groupBy,
      granularity: parsed.data.granularity,
      visibility: parsed.data.visibility,
      scope: parsed.data.scope ? toScopeInput(parsed.data.scope) : undefined,
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteSavedViewAction(
  savedViewId: string,
): Promise<CostActionResult<{ deletedId: string }>> {
  const parsed = idSchema.safeParse(savedViewId);
  if (!parsed.success) return { error: "Invalid saved view." };

  try {
    const { token, organizationId } = await context();
    await deleteSavedView(organizationId, parsed.data, token);
    revalidatePath(BASE_PATH);
    return { data: { deletedId: parsed.data } };
  } catch (error) {
    return { error: message(error) };
  }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const reportInputSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  format: z.enum(["csv", "pdf"]),
  recipients: recipientsSchema,
  scheduleCron: z.string().trim().min(1).max(120).nullable(),
  scope: scopeSchema,
});

export async function createReportAction(
  input: z.infer<typeof reportInputSchema>,
): Promise<CostActionResult<CoreReport>> {
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createReport(organizationId, token, {
      name: parsed.data.name,
      description: parsed.data.description,
      format: parsed.data.format,
      recipients: parsed.data.recipients,
      schedule_cron: parsed.data.scheduleCron,
      scope: toScopeInput(parsed.data.scope),
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateReportAction(
  reportId: string,
  input: Partial<z.infer<typeof reportInputSchema>> & { enabled?: boolean },
): Promise<CostActionResult<CoreReport>> {
  const idParsed = idSchema.safeParse(reportId);
  if (!idParsed.success) return { error: "Invalid report." };
  const parsed = reportInputSchema.partial().safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateReport(organizationId, idParsed.data, token, {
      name: parsed.data.name,
      description: parsed.data.description,
      format: parsed.data.format,
      recipients: parsed.data.recipients,
      schedule_cron: parsed.data.scheduleCron,
      enabled: input.enabled,
      scope: parsed.data.scope ? toScopeInput(parsed.data.scope) : undefined,
    });
    revalidatePath(BASE_PATH);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteReportAction(
  reportId: string,
): Promise<CostActionResult<{ deletedId: string }>> {
  const parsed = idSchema.safeParse(reportId);
  if (!parsed.success) return { error: "Invalid report." };

  try {
    const { token, organizationId } = await context();
    await deleteReport(organizationId, parsed.data, token);
    revalidatePath(BASE_PATH);
    return { data: { deletedId: parsed.data } };
  } catch (error) {
    return { error: message(error) };
  }
}

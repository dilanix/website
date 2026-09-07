"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import {
  CoreApiError,
  createApplication,
  createApplicationEnvironment,
  createTelemetryIngestionToken,
  createTelemetrySource,
  revokeTelemetryIngestionToken,
  updateApplication,
  updateApplicationEnvironment,
  updateTelemetrySource,
  type CoreApplication,
  type CoreApplicationEnvironment,
  type CoreTelemetryIngestionToken,
  type CoreTelemetryIngestionTokenCreated,
  type CoreTelemetrySource,
} from "@/lib/core/api";

export type ApplicationActionResult<T = undefined> = {
  data?: T;
  error?: string;
};

const idSchema = z.uuid();
const nameSchema = z.string().trim().min(1).max(255);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens.",
  );
const statusSchema = z.enum(["active", "archived"]);
const sourceTypeSchema = z.enum([
  "otlp",
  "dilanix_python",
  "dilanix_php",
  "dilanix_go",
  "dilanix_node",
  "custom_http",
  "aws_cloudwatch",
  "cloudflare",
  "kubernetes",
]);
const ingestionScopeSchema = z.enum([
  "telemetry:logs:write",
  "telemetry:traces:write",
  "telemetry:metrics:write",
  "telemetry:events:write",
]);

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

export async function createApplicationAction(input: {
  name: string;
  slug: string;
  description: string | null;
}): Promise<ApplicationActionResult<CoreApplication>> {
  const parsed = z
    .object({
      name: nameSchema,
      slug: slugSchema,
      description: z.string().trim().max(5000).nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createApplication(organizationId, token, parsed.data);
    revalidatePath("/dashboard/applications");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateApplicationAction(
  applicationId: string,
  input: { name?: string; description?: string; status?: string },
): Promise<ApplicationActionResult<CoreApplication>> {
  const parsed = z
    .object({
      applicationId: idSchema,
      input: z.object({
        name: nameSchema.optional(),
        description: z.string().trim().max(5000).optional(),
        status: statusSchema.optional(),
      }),
    })
    .safeParse({ applicationId, input });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateApplication(
      organizationId,
      parsed.data.applicationId,
      token,
      parsed.data.input,
    );
    revalidatePath("/dashboard/applications");
    revalidatePath(`/dashboard/applications/${applicationId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function createEnvironmentAction(
  applicationId: string,
  input: { name: string; slug: string },
): Promise<ApplicationActionResult<CoreApplicationEnvironment>> {
  const parsed = z
    .object({ applicationId: idSchema, name: nameSchema, slug: slugSchema })
    .safeParse({ applicationId, ...input });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createApplicationEnvironment(
      organizationId,
      parsed.data.applicationId,
      token,
      { name: parsed.data.name, slug: parsed.data.slug },
    );
    revalidatePath(`/dashboard/applications/${applicationId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateEnvironmentAction(
  applicationId: string,
  environmentId: string,
  input: { name?: string; status?: string },
): Promise<ApplicationActionResult<CoreApplicationEnvironment>> {
  const parsed = z
    .object({
      applicationId: idSchema,
      environmentId: idSchema,
      input: z.object({
        name: nameSchema.optional(),
        status: statusSchema.optional(),
      }),
    })
    .safeParse({ applicationId, environmentId, input });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateApplicationEnvironment(
      organizationId,
      parsed.data.applicationId,
      parsed.data.environmentId,
      token,
      parsed.data.input,
    );
    revalidatePath(`/dashboard/applications/${applicationId}`);
    revalidatePath(
      `/dashboard/applications/${applicationId}/environments/${environmentId}`,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function createTelemetrySourceAction(
  applicationId: string,
  environmentId: string,
  input: {
    name: string;
    sourceType: string;
    integrationTargetId: string | null;
    configuration: Record<string, unknown>;
  },
): Promise<ApplicationActionResult<CoreTelemetrySource>> {
  const parsed = z
    .object({
      applicationId: idSchema,
      environmentId: idSchema,
      name: nameSchema,
      sourceType: sourceTypeSchema,
      integrationTargetId: idSchema.nullable(),
      configuration: z.record(z.string(), z.unknown()),
    })
    .safeParse({ applicationId, environmentId, ...input });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createTelemetrySource(
      organizationId,
      parsed.data.applicationId,
      parsed.data.environmentId,
      token,
      {
        name: parsed.data.name,
        source_type: parsed.data.sourceType,
        integration_target_id: parsed.data.integrationTargetId,
        configuration: parsed.data.configuration,
      },
    );
    revalidatePath(
      `/dashboard/applications/${applicationId}/environments/${environmentId}`,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateTelemetrySourceAction(
  applicationId: string,
  environmentId: string,
  sourceId: string,
  input: {
    name?: string;
    status?: string;
    configuration?: Record<string, unknown>;
  },
): Promise<ApplicationActionResult<CoreTelemetrySource>> {
  const parsed = z
    .object({
      applicationId: idSchema,
      environmentId: idSchema,
      sourceId: idSchema,
      input: z.object({
        name: nameSchema.optional(),
        status: statusSchema.optional(),
        configuration: z.record(z.string(), z.unknown()).optional(),
      }),
    })
    .safeParse({ applicationId, environmentId, sourceId, input });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await updateTelemetrySource(
      organizationId,
      parsed.data.applicationId,
      parsed.data.environmentId,
      parsed.data.sourceId,
      token,
      parsed.data.input,
    );
    revalidatePath(
      `/dashboard/applications/${applicationId}/environments/${environmentId}`,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function createTelemetryTokenAction(
  applicationId: string,
  environmentId: string,
  sourceId: string,
  input: { scopes: string[]; expiresAt: string | null },
): Promise<ApplicationActionResult<CoreTelemetryIngestionTokenCreated>> {
  const parsed = z
    .object({
      applicationId: idSchema,
      environmentId: idSchema,
      sourceId: idSchema,
      scopes: z.array(ingestionScopeSchema).min(1),
      expiresAt: z.iso.datetime().nullable(),
    })
    .safeParse({ applicationId, environmentId, sourceId, ...input });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await createTelemetryIngestionToken(
      organizationId,
      parsed.data.applicationId,
      parsed.data.environmentId,
      parsed.data.sourceId,
      token,
      { scopes: parsed.data.scopes, expires_at: parsed.data.expiresAt },
    );
    revalidatePath(
      `/dashboard/applications/${applicationId}/environments/${environmentId}`,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function revokeTelemetryTokenAction(
  applicationId: string,
  environmentId: string,
  sourceId: string,
  ingestionTokenId: string,
): Promise<ApplicationActionResult<CoreTelemetryIngestionToken>> {
  const parsed = z
    .object({
      applicationId: idSchema,
      environmentId: idSchema,
      sourceId: idSchema,
      ingestionTokenId: idSchema,
    })
    .safeParse({ applicationId, environmentId, sourceId, ingestionTokenId });
  if (!parsed.success) return { error: validationMessage(parsed.error) };

  try {
    const { token, organizationId } = await context();
    const data = await revokeTelemetryIngestionToken(
      organizationId,
      parsed.data.applicationId,
      parsed.data.environmentId,
      parsed.data.sourceId,
      parsed.data.ingestionTokenId,
      token,
    );
    revalidatePath(
      `/dashboard/applications/${applicationId}/environments/${environmentId}`,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

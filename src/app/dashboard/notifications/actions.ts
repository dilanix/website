"use server";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import {
  createNotificationChannel,
  updateNotificationChannel,
  deleteNotificationChannel,
  sendTestNotification,
  createNotificationDestination,
  updateNotificationDestination,
  deleteNotificationDestination,
  CoreApiError,
  type CoreNotificationChannel,
  type CreateNotificationChannelInput,
  type UpdateNotificationChannelInput,
  type CoreNotificationDelivery,
  type CoreNotificationDestination,
  type CreateNotificationDestinationInput,
  type UpdateNotificationDestinationInput,
} from "@/lib/core/api";

type ActionResult<T = undefined> = { data?: T; error?: string };

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

export async function createNotificationChannelAction(
  input: CreateNotificationChannelInput,
): Promise<ActionResult<CoreNotificationChannel>> {
  try {
    const { token, organizationId } = await context();
    const data = await createNotificationChannel(organizationId, token, input);
    revalidatePath("/dashboard/notifications");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateNotificationChannelAction(
  channelId: string,
  input: UpdateNotificationChannelInput,
): Promise<ActionResult<CoreNotificationChannel>> {
  try {
    const { token, organizationId } = await context();
    const data = await updateNotificationChannel(
      organizationId,
      channelId,
      token,
      input,
    );
    revalidatePath("/dashboard/notifications");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteNotificationChannelAction(
  channelId: string,
): Promise<ActionResult> {
  try {
    const { token, organizationId } = await context();
    await deleteNotificationChannel(organizationId, channelId, token);
    revalidatePath("/dashboard/notifications");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function sendTestNotificationAction(
  channelId: string,
  destinationId: string,
): Promise<ActionResult<CoreNotificationDelivery>> {
  try {
    const { token, organizationId } = await context();
    const data = await sendTestNotification(
      organizationId,
      channelId,
      token,
      destinationId,
    );
    revalidatePath("/dashboard/notifications");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function createNotificationDestinationAction(
  input: CreateNotificationDestinationInput,
): Promise<ActionResult<CoreNotificationDestination>> {
  try {
    const { token, organizationId } = await context();
    const data = await createNotificationDestination(
      organizationId,
      token,
      input,
    );
    revalidatePath("/dashboard/notifications");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateNotificationDestinationAction(
  destinationId: string,
  input: UpdateNotificationDestinationInput,
): Promise<ActionResult<CoreNotificationDestination>> {
  try {
    const { token, organizationId } = await context();
    const data = await updateNotificationDestination(
      organizationId,
      destinationId,
      token,
      input,
    );
    revalidatePath("/dashboard/notifications");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteNotificationDestinationAction(
  destinationId: string,
): Promise<ActionResult> {
  try {
    const { token, organizationId } = await context();
    await deleteNotificationDestination(organizationId, destinationId, token);
    revalidatePath("/dashboard/notifications");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

import { db } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/stripe';

export interface AuthPayload {
  userId: string;
  organizationId: string;
  role: string;
  [key: string]: any;
}

/**
 * Check if a user is exempt from plan limits (ADMIN users)
 */
export function isExemptFromLimits(authPayload: AuthPayload): boolean {
  return authPayload.role === 'ADMIN';
}

/**
 * Check if FREE TRIAL has expired
 */
export function isTrialExpired(trialEndsAt: Date): boolean {
  return new Date() > trialEndsAt;
}

/**
 * Check if user can create a new tour based on plan limits
 */
export async function canCreateTour(authPayload: AuthPayload): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // ADMIN users are exempt from limits
  if (isExemptFromLimits(authPayload)) {
    return { allowed: true };
  }

  // Get organization
  const org = await db.organization.findUnique({
    where: { id: authPayload.organizationId },
  });

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    };
  }

  // Check if trial has expired for FREE_TRIAL plan
  if (org.plan === 'FREE_TRIAL' && isTrialExpired(org.trialEndsAt)) {
    return {
      allowed: false,
      reason: 'Your free trial has expired. Please upgrade your plan.',
    };
  }

  // Check tour limit
  const tourCount = await db.tour.count({
    where: { organizationId: authPayload.organizationId },
  });

  const planLimits = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS];
  if (!planLimits) {
    return {
      allowed: false,
      reason: 'Invalid plan type',
    };
  }

  // -1 means unlimited
  if (planLimits.maxTours !== -1 && tourCount >= planLimits.maxTours) {
    return {
      allowed: false,
      reason: `You have reached the maximum number of tours (${planLimits.maxTours}) for your plan. Please upgrade.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can add images to a tour based on plan limits
 */
export async function canAddImagesToTour(
  authPayload: AuthPayload,
  tourId: string,
  imageCountToAdd: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // ADMIN users are exempt from limits
  if (isExemptFromLimits(authPayload)) {
    return { allowed: true };
  }

  // Get organization
  const org = await db.organization.findUnique({
    where: { id: authPayload.organizationId },
  });

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    };
  }

  // Check if trial has expired
  if (org.plan === 'FREE_TRIAL' && isTrialExpired(org.trialEndsAt)) {
    return {
      allowed: false,
      reason: 'Your free trial has expired. Please upgrade your plan.',
    };
  }

  // Get current image count in this tour
  const imageCount = await db.tourImage.count({
    where: { tourId },
  });

  const planLimits = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS];
  if (!planLimits) {
    return {
      allowed: false,
      reason: 'Invalid plan type',
    };
  }

  // -1 means unlimited
  if (
    planLimits.maxImages !== -1 &&
    imageCount + imageCountToAdd > planLimits.maxImages
  ) {
    return {
      allowed: false,
      reason: `You can only have ${planLimits.maxImages} scenes per tour. You currently have ${imageCount} and are trying to add ${imageCountToAdd}. Please upgrade your plan.`,
    };
  }

  return { allowed: true };
}

/**
 * Check storage limit
 */
export async function canAddStorage(
  authPayload: AuthPayload,
  additionalMb: number
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // ADMIN users are exempt from limits
  if (isExemptFromLimits(authPayload)) {
    return { allowed: true };
  }

  const org = await db.organization.findUnique({
    where: { id: authPayload.organizationId },
  });

  if (!org) {
    return {
      allowed: false,
      reason: 'Organization not found',
    };
  }

  const planLimits = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS];
  if (!planLimits) {
    return {
      allowed: false,
      reason: 'Invalid plan type',
    };
  }

  // -1 means unlimited
  if (
    planLimits.storageMb !== -1 &&
    org.usedStorageMb + additionalMb > planLimits.storageMb
  ) {
    return {
      allowed: false,
      reason: `Storage limit exceeded. You have ${planLimits.storageMb}MB available and ${org.usedStorageMb}MB used. This upload would exceed your limit by ${
        org.usedStorageMb + additionalMb - planLimits.storageMb
      }MB. Please upgrade your plan or delete some files.`,
    };
  }

  return { allowed: true };
}

import { db } from '@/lib/db';

export interface AuthPayload {
  userId: string;
  organizationId: string;
  role: string;
  [key: string]: any;
}

/**
 * Check if user can view/edit a tour
 * Only users in the same organization can access tours
 * VIEWER role can only view (read-only)
 */
export async function canAccessTour(
  authPayload: AuthPayload,
  tourId: string,
  action: 'read' | 'write' = 'read'
): Promise<{ allowed: boolean; reason?: string }> {
  const tour = await db.tour.findUnique({
    where: { id: tourId },
    select: { organizationId: true },
  });

  if (!tour) {
    return { allowed: false, reason: 'Tour not found' };
  }

  // Check organization membership
  if (tour.organizationId !== authPayload.organizationId) {
    return {
      allowed: false,
      reason: 'You do not have access to this tour',
    };
  }

  // VIEWER can only read
  if (action === 'write' && authPayload.role === 'VIEWER') {
    return {
      allowed: false,
      reason: 'VIEWER role cannot modify tours',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can view/edit an image in a tour
 */
export async function canAccessImage(
  authPayload: AuthPayload,
  imageId: string,
  action: 'read' | 'write' = 'read'
): Promise<{ allowed: boolean; reason?: string }> {
  const image = await db.tourImage.findUnique({
    where: { id: imageId },
    select: {
      tour: {
        select: { organizationId: true },
      },
    },
  });

  if (!image) {
    return { allowed: false, reason: 'Image not found' };
  }

  // Check organization membership
  if (image.tour.organizationId !== authPayload.organizationId) {
    return {
      allowed: false,
      reason: 'You do not have access to this image',
    };
  }

  // VIEWER can only read
  if (action === 'write' && authPayload.role === 'VIEWER') {
    return {
      allowed: false,
      reason: 'VIEWER role cannot modify images',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can view/edit a hotspot
 */
export async function canAccessHotspot(
  authPayload: AuthPayload,
  hotspotId: string,
  action: 'read' | 'write' = 'read'
): Promise<{ allowed: boolean; reason?: string }> {
  const hotspot = await db.hotspot.findUnique({
    where: { id: hotspotId },
    select: {
      image: {
        select: {
          tour: {
            select: { organizationId: true },
          },
        },
      },
    },
  });

  if (!hotspot) {
    return { allowed: false, reason: 'Hotspot not found' };
  }

  // Check organization membership
  if (hotspot.image.tour.organizationId !== authPayload.organizationId) {
    return {
      allowed: false,
      reason: 'You do not have access to this hotspot',
    };
  }

  // VIEWER can only read
  if (action === 'write' && authPayload.role === 'VIEWER') {
    return {
      allowed: false,
      reason: 'VIEWER role cannot modify hotspots',
    };
  }

  return { allowed: true };
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        changes: changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging failure should not break the main operation
  }
}

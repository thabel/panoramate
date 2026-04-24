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
  const tour = await db.queryOne(
    'SELECT organizationId FROM tours WHERE id = ?',
    [tourId]
  );

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
  const image = await db.queryOne(
    `SELECT t.organizationId
     FROM tour_images ti
     JOIN tours t ON ti.tourId = t.id
     WHERE ti.id = ?`,
    [imageId]
  );

  if (!image) {
    return { allowed: false, reason: 'Image not found' };
  }

  // Check organization membership
  if (image.organizationId !== authPayload.organizationId) {
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
  const hotspot = await db.queryOne(
    `SELECT t.organizationId
     FROM hotspots h
     JOIN tour_images ti ON h.imageId = ti.id
     JOIN tours t ON ti.tourId = t.id
     WHERE h.id = ?`,
    [hotspotId]
  );

  if (!hotspot) {
    return { allowed: false, reason: 'Hotspot not found' };
  }

  // Check organization membership
  if (hotspot.organizationId !== authPayload.organizationId) {
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
    await db.execute(
      `INSERT INTO audit_logs (id, userId, action, resourceType, resourceId, changes, ipAddress, userAgent, createdAt)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        changes ? JSON.stringify(changes) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging failure should not break the main operation
  }
}

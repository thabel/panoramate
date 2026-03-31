import { PlanType, UserRole, TourStatus, HotspotType, SubscriptionStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
}

export interface TourImage {
  id: string;
  tourId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeMb: number;
  width: number;
  height: number;
  order: number;
  title?: string;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  createdAt: Date;
}

export interface Hotspot {
  id: string;
  imageId: string;
  type: HotspotType;
  yaw: number;
  pitch: number;
  rotation: number;
  targetImageId?: string;
  title?: string;
  content?: string;
  url?: string;
  videoUrl?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageWithHotspots extends TourImage {
  hotspots: Hotspot[];
}

export interface TourWithImages {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  status: TourStatus;
  shareToken: string;
  isPublic: boolean;
  viewCount: number;
  customLogoUrl?: string;
  backgroundAudioUrl?: string;
  backgroundAudioVolume?: number;
  settings: any;
  organizationId: string;
  organization?: Organization;
  createdById: string;
  images: TourImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  trialEndsAt: Date;
  currentPeriodEnd?: Date;
  maxTours: number;
  maxImagesPerTour: number;
  totalStorageMb: number;
  usedStorageMb: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateTourInput {
  title: string;
  description?: string;
  settings?: {
    autorotate?: boolean;
    mouseViewMode?: boolean;
    showControls?: boolean;
  };
}

export interface CreateHotspotInput {
  type: HotspotType;
  yaw: number;
  pitch: number;
  rotation?: number;
  targetImageId?: string;
  title?: string;
  content?: string;
  url?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface UpdateHotspotInput extends Partial<CreateHotspotInput> {
  hotspotId: string;
}

export interface PlanLimits {
  maxTours: number;
  maxImages: number;
  storageMb: number;
}

export interface InviteUserInput {
  email: string;
  role: UserRole;
}

export interface AcceptInviteInput {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

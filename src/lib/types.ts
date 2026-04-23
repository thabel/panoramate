// Enums
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum PlanType {
  FREE_TRIAL = 'FREE_TRIAL',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
}

export enum TourStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum HotspotType {
  LINK = 'LINK',
  INFO = 'INFO',
  URL = 'URL',
  VIDEO = 'VIDEO',
  LINK_SCENE = 'LINK_SCENE',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  OTHER = 'OTHER',
}

export enum AnimationType {
  NONE = 'NONE',
  PULSE = 'PULSE',
  GLOW = 'GLOW',
  BOUNCE = 'BOUNCE',
  FLOAT = 'FLOAT',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

export enum InscriptionType {
  FREE = 'FREE',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum InscriptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Models
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  trialEndsAt: Date;
  currentPeriodEnd?: Date | null;
  maxTours: number;
  maxImagesPerTour: number;
  totalStorageMb: number;
  usedStorageMb: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: UserRole;
  isVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
  organizationId: string;
  invitedById: string;
}

export interface Tour {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  status: TourStatus;
  shareToken: string;
  isPublic: boolean;
  viewCount: number;
  settings: any;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  customLogoUrl?: string | null;
  backgroundAudioUrl?: string | null;
  backgroundAudioVolume: number;
  showSceneMenu: boolean;
  showHotspotTitles: boolean;
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
  title?: string | null;
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
  targetImageId?: string | null;
  title?: string | null;
  content?: string | null;
  url?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  imageUrls?: string | null;
  animationType: AnimationType;
  iconUrl?: string | null;
  iconName?: string | null;
  color?: string | null;
  scale: number;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  planType: PlanType;
  priceMonthly: number;
  priceYearly: number;
  stripePriceMonthlyId?: string | null;
  stripePriceYearlyId?: string | null;
  maxTours: number;
  maxImagesPerTour: number;
  maxStorageMb: number;
  features: any;
  isActive: boolean;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  organizationId: string;
  stripeInvoiceId: string;
  invoiceNumber?: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  description?: string | null;
  pdfUrl?: string | null;
  hostedUrl?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
}

export interface Comparison {
  id: string;
  title?: string | null;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComparisonImage {
  id: string;
  comparisonId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeMb: number;
  width: number;
  height: number;
  captureDate: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: any | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface InscriptionRequest {
  id: string;
  type: InscriptionType;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  numberOfTours?: number | null;
  imagesPerTour?: number | null;
  teamMembers?: number | null;
  frequency?: string | null;
  status: InscriptionStatus;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

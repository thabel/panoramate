import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { TourWithImages } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/ui/StatsCard';
import { UsageBar } from '@/components/ui/UsageBar';
import { ToursGrid } from '@/components/dashboard/ToursGrid';
import { Plus, Image, Eye, Users, FileStack } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  console.log('DashboardPage - token from cookies:', token);
  if (!token) {
    redirect('/login');
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    redirect('/login');
  }

  const { organizationId, userId } = payload;

  // Fetch organization
  const organization: any = await db.queryOne(
    'SELECT * FROM organizations WHERE id = ?',
    [organizationId]
  );

  if (!organization) {
    redirect('/login');
  }

  // Fetch stats
  const [statsResult, imagesResult, usersResult]: any = await Promise.all([
    db.queryOne(
      'SELECT COUNT(*) as totalTours, SUM(viewCount) as totalViews FROM tours WHERE organizationId = ?',
      [organizationId]
    ),
    db.queryOne(
      'SELECT COUNT(*) as totalImages FROM tour_images ti JOIN tours t ON ti.tourId = t.id WHERE t.organizationId = ?',
      [organizationId]
    ),
    db.queryOne(
      'SELECT COUNT(*) as totalUsers FROM users WHERE organizationId = ?',
      [organizationId]
    ),
  ]);

  const totalTours = statsResult?.totalTours || 0;
  const totalViews = statsResult?.totalViews || 0;
  const totalImages = imagesResult?.totalImages || 0;
  const totalUsers = usersResult?.totalUsers || 0;

  // Fetch recent tours (limit 6)
  const toursRaw: any = await db.query(
    `
      SELECT
        t.*,
        u.firstName as createdBy_firstName,
        u.lastName as createdBy_lastName,
        u.email as createdBy_email,
        ti.id as firstImage_id,
        ti.filename as firstImage_filename,
        ti.originalName as firstImage_originalName,
        ti.mimeType as firstImage_mimeType,
        ti.sizeMb as firstImage_sizeMb,
        ti.width as firstImage_width,
        ti.height as firstImage_height,
        ti.order as firstImage_order,
        ti.title as firstImage_title,
        ti.initialYaw as firstImage_initialYaw,
        ti.initialPitch as firstImage_initialPitch,
        ti.initialFov as firstImage_initialFov,
        ti.createdAt as firstImage_createdAt,
        ti.tourId as firstImage_tourId
      FROM tours t
      LEFT JOIN users u ON t.createdById = u.id
      LEFT JOIN (
        SELECT ti1.*
        FROM tour_images ti1
        INNER JOIN (
          SELECT tourId, MIN(\`order\`) as minOrder
          FROM tour_images
          GROUP BY tourId
        ) ti2 ON ti1.tourId = ti2.tourId AND ti1.\`order\` = ti2.minOrder
      ) ti ON t.id = ti.tourId
      WHERE t.organizationId = ?
      ORDER BY t.createdAt DESC
      LIMIT 6
    `,
    [organizationId]
  );

  const tours: TourWithImages[] = toursRaw.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.coverImageUrl,
    status: row.status,
    shareToken: row.shareToken,
    isPublic: !!row.isPublic,
    viewCount: row.viewCount,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    organizationId: row.organizationId,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customLogoUrl: row.customLogoUrl,
    backgroundAudioUrl: row.backgroundAudioUrl,
    backgroundAudioVolume: row.backgroundAudioVolume,
    showSceneMenu: !!row.showSceneMenu,
    showHotspotTitles: !!row.showHotspotTitles,
    createdBy: {
      firstName: row.createdBy_firstName,
      lastName: row.createdBy_lastName,
      email: row.createdBy_email,
    },
    images: row.firstImage_id ? [{
      id: row.firstImage_id,
      tourId: row.firstImage_tourId,
      filename: row.firstImage_filename,
      originalName: row.firstImage_originalName,
      mimeType: row.firstImage_mimeType,
      sizeMb: row.firstImage_sizeMb,
      width: row.firstImage_width,
      height: row.firstImage_height,
      order: row.firstImage_order,
      title: row.firstImage_title,
      initialYaw: row.firstImage_initialYaw,
      initialPitch: row.firstImage_initialPitch,
      initialFov: row.firstImage_initialFov,
      createdAt: row.firstImage_createdAt,
    }] : [],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400">Welcome back! Here's your tour overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={FileStack}
          label="Total Tours"
          value={totalTours}
        />
        <StatsCard
          icon={Image}
          label="Total Scenes"
          value={totalImages}
        />
        <StatsCard
          icon={Eye}
          label="Total Views"
          value={totalViews}
        />
        <StatsCard
          icon={Users}
          label="Team Members"
          value={totalUsers}
        />
      </div>

      {/* Storage Usage */}
      <div className="p-6 border rounded-lg bg-dark-800 border-dark-700">
        <h2 className="mb-4 text-xl font-semibold text-white">Storage Usage</h2>
        <UsageBar
          label="Total Storage"
          used={organization.usedStorageMb}
          max={organization.totalStorageMb}
          unit=" MB"
        />
        <p className="mt-2 text-sm text-dark-400">
          {organization.usedStorageMb} MB of {organization.totalStorageMb} MB used
        </p>
      </div>

      {/* Recent Tours */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Tours</h2>
          <Link href="/tours/new">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Plus size={18} />
              New Tour
            </Button>
          </Link>
        </div>

        <ToursGrid initialTours={tours} />
      </div>
    </div>
  );
}

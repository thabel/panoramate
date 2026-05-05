import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function verifySuperAdminAuth(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');

    let tokenToVerify = token;
    if (authHeader?.startsWith('Bearer ')) {
      tokenToVerify = authHeader.slice(7);
    }

    if (!tokenToVerify) {
      return null;
    }

    const payload = await verifyJWT(tokenToVerify);
    if (!payload || !payload.userId) {
      return null;
    }

    // Get user and check if SUPER_ADMIN
    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [payload.userId as string, 'SUPER_ADMIN']
    );

    return user ? (user as any) : null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify SUPER_ADMIN auth
    const superAdmin = await verifySuperAdminAuth(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    // Fetch all stats in parallel
    const [
      freeTrialCount,
      starterCount,
      professionalCount,
      enterpriseCount,
      activeAccountsResult,
      inactiveAccountsResult,
      pendingInscriptionsResult,
      totalToursResult,
      totalStorageResult,
      totalUsersResult,
      activeThisMonthResult,
    ] = await Promise.all([
      // Count accounts by plan type
      db.queryOne(
        'SELECT COUNT(*) as count FROM organizations WHERE plan = ?',
        ['FREE_TRIAL']
      ),
      db.queryOne(
        'SELECT COUNT(*) as count FROM organizations WHERE plan = ?',
        ['STARTER']
      ),
      db.queryOne(
        'SELECT COUNT(*) as count FROM organizations WHERE plan = ?',
        ['PROFESSIONAL']
      ),
      db.queryOne(
        'SELECT COUNT(*) as count FROM organizations WHERE plan = ?',
        ['ENTERPRISE']
      ),
      // Count active accounts (subscriptionStatus = 'ACTIVE')
      db.queryOne(
        `SELECT COUNT(*) as count FROM organizations
         WHERE subscriptionStatus = 'ACTIVE'`
      ),
      // Count inactive accounts (expired or canceled)
      db.queryOne(
        `SELECT COUNT(*) as count FROM organizations
         WHERE (subscriptionStatus IN ('CANCELED', 'PAST_DUE', 'INCOMPLETE')
         OR (subscriptionStatus = 'TRIALING' AND trialEndsAt < NOW()))`
      ),
      // Count pending inscriptions
      db.queryOne(
        'SELECT COUNT(*) as count FROM inscription_requests WHERE status = ?',
        ['PENDING']
      ),
      // Total tours
      db.queryOne(
        'SELECT COUNT(*) as count FROM tours'
      ),
      // Total storage used
      db.queryOne(
        'SELECT SUM(usedStorageMb) as total FROM organizations'
      ),
      // Total users
      db.queryOne(
        'SELECT COUNT(*) as count FROM users'
      ),
      // Active users this month
      db.queryOne(
        `SELECT COUNT(*) as count FROM users
         WHERE lastLoginAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      ),
    ]);

    // Calculate totals
    const freeTrialCountValue = (freeTrialCount as any)?.count || 0;
    const starterCountValue = (starterCount as any)?.count || 0;
    const professionalCountValue = (professionalCount as any)?.count || 0;
    const enterpriseCountValue = (enterpriseCount as any)?.count || 0;

    const totalFreeAccounts = freeTrialCountValue;
    const totalPaidAccounts = starterCountValue + professionalCountValue + enterpriseCountValue;
    const totalAccounts = totalFreeAccounts + totalPaidAccounts;

    const activeAccounts = (activeAccountsResult as any)?.count || 0;
    const inactiveAccounts = (inactiveAccountsResult as any)?.count || 0;
    const pendingInscriptions = (pendingInscriptionsResult as any)?.count || 0;
    const totalTours = (totalToursResult as any)?.count || 0;
    const totalStorageMb = (totalStorageResult as any)?.total || 0;
    const totalUsers = (totalUsersResult as any)?.count || 0;
    const activeThisMonth = (activeThisMonthResult as any)?.count || 0;

    logger.info({
      event: 'super_admin_fetch_stats',
      superAdminId: superAdmin.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          accounts: {
            total: totalAccounts,
            free: totalFreeAccounts,
            paid: totalPaidAccounts,
            byPlan: {
              freeTrial: freeTrialCountValue,
              starter: starterCountValue,
              professional: professionalCountValue,
              enterprise: enterpriseCountValue,
            },
            active: activeAccounts,
            inactive: inactiveAccounts,
            pendingValidation: pendingInscriptions,
          },
          usage: {
            totalTours,
            totalStorageMb,
            totalStorageGb: parseFloat((totalStorageMb / 1024).toFixed(2)),
            totalUsers,
            activeThisMonth,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      event: 'admin_fetch_stats_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}

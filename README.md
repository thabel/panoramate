# Panoramate - Virtual Tour Creator SaaS

A complete SaaS platform for creating and sharing stunning 360° virtual tours. Built with Next.js 14, Prisma, MySQL, and Stripe integration.

## Features

- **360° Tour Creator**: Upload equirectangular images and create immersive virtual tours
- **Interactive Hotspots**: Add links, info boxes, URLs, and videos to panoramic images
- **Team Collaboration**: Invite team members with role-based permissions
- **Public Sharing**: Generate shareable links and embed code for your tours
- **Subscription Plans**: Free trial (14 days), Starter ($29/mo), Professional ($79/mo), Enterprise ($199/mo)
- **Storage Management**: Track and manage storage usage with plan-based limits
- **Marzipano Integration**: High-performance 360° viewer
- **Dark Theme UI**: Modern dark interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **Backend**: Next.js API Routes, Node.js
- **Database**: MySQL, Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Payments**: Stripe
- **File Upload**: Multer, Sharp
- **Toast Notifications**: react-hot-toast

## Prerequisites

- Node.js 18+
- MySQL 8+
- Stripe Account (for payments)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd panoramate
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
DATABASE_URL="mysql://user:password@localhost:3306/panoramate"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

STRIPE_PRICE_STARTER_MONTHLY="price_..."
STRIPE_PRICE_PROFESSIONAL_MONTHLY="price_..."
STRIPE_PRICE_ENTERPRISE_MONTHLY="price_..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB="50"
```

### 3. Database Setup

Create the database:

```bash
mysql -u root -p
CREATE DATABASE panoramate;
```

Push schema to database:

```bash
npx prisma db push
```

Seed with demo data:

```bash
npm run db:seed
```

### 4. Stripe Setup

Create price IDs in Stripe Dashboard:

1. Go to Products → Create a product for each plan (Starter, Professional, Enterprise)
2. Create monthly price for each plan
3. Copy price IDs to `.env.local`:
   - `STRIPE_PRICE_STARTER_MONTHLY=price_...`
   - `STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...`
   - `STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...`

Configure Webhook:

1. Go to Developers → Webhooks
2. Add endpoint: `http://localhost:3000/api/billing/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
4. Copy Webhook Secret to `STRIPE_WEBHOOK_SECRET`

### 5. Create uploads directory

```bash
mkdir -p uploads
```

## Running Locally

Development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Account

```
Email: demo@panoramate.com
Password: Demo1234!
```

## Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server
npm run db:push     # Push schema changes
npm run db:seed     # Seed database
npm run db:studio   # Open Prisma Studio
npm run db:migrate  # Create migration
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Login/Register pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   ├── tour/              # Public tour viewer
│   └── layout.tsx         # Root layout
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   ├── ui/                # Reusable UI components
│   └── viewer/            # 360° viewer components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
├── middleware.ts          # Next.js middleware
└── types/                 # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
└── seed.ts               # Database seeding script

public/                    # Static assets
uploads/                   # User-uploaded files
```

## API Routes

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Tours

- `GET /api/tours` - List tours
- `POST /api/tours` - Create tour
- `GET /api/tours/:id` - Get tour details
- `PATCH /api/tours/:id` - Update tour
- `DELETE /api/tours/:id` - Delete tour

### Images

- `POST /api/tours/:id/images` - Upload images
- `DELETE /api/tours/:id/images` - Delete image

### Hotspots

- `GET /api/tours/:id/images/:imageId/hotspots` - List hotspots
- `POST /api/tours/:id/images/:imageId/hotspots` - Create hotspot
- `PATCH /api/tours/:id/images/:imageId/hotspots` - Update hotspot
- `DELETE /api/tours/:id/images/:imageId/hotspots` - Delete hotspot

### Sharing

- `GET /api/tours/:id/share` - Get share info
- `POST /api/tours/:id/share` - Create share link
- `DELETE /api/tours/:id/share` - Revoke share link
- `GET /api/tours/:shareToken/public` - View public tour

### Billing

- `GET /api/billing/plans` - List plans
- `POST /api/billing/subscribe` - Create checkout session
- `POST /api/billing/portal` - Open billing portal
- `GET /api/billing/invoices` - List invoices

### Team

- `GET /api/team` - List team members
- `POST /api/team` - Invite member
- `PATCH /api/team/:memberId` - Update member role
- `DELETE /api/team/:memberId` - Remove member
- `POST /api/team/accept-invite` - Accept invitation

## Marzipano Integration

The Marzipano viewer is loaded from a CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/marzipano@0.10.2/dist/marzipano.min.js"></script>
```

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Manual Deployment

```bash
npm run build
npm run db:push
npm start
```

## Database Migrations

Create migration:

```bash
npx prisma migrate dev --name your_migration_name
```

Apply migrations:

```bash
npx prisma migrate deploy
```

## Troubleshooting

### Port 3000 already in use

```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database connection failed

```bash
# Test connection
npx prisma db execute --stdin --file=query.sql
```

### Stripe webhook not working

1. Check webhook endpoint is public and accessible
2. Verify webhook secret in `.env.local`
3. Test with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push: `git push origin feature/amazing-feature`
4. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Panoramate

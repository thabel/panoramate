# Docker Setup Guide for Panoramate

This guide explains how to run Panoramate using Docker and Docker Compose.

## Prerequisites

- **Docker** (version 20+)
- **Docker Compose** (version 2.0+)

## Quick Start

### 1. Prepare Environment Variables

Copy the Docker environment template to your local env file:

```bash
cp .env.docker .env.local
```

Then edit `.env.local` with your actual configuration. **IMPORTANT:** Update these secrets:

```bash
# REQUIRED - Database URL (no defaults, must set explicitly)
DATABASE_URL=mysql://panoramate_user:your_strong_password@db:3306/panoramate

# REQUIRED - JWT Secret (min 32 characters)
JWT_SECRET=your-32-character-minimum-secret-key-change-this

# Database Config (for Docker container initialization)
DB_ROOT_PASSWORD=your_strong_root_password_here
DB_PASSWORD=your_strong_db_password_here
DB_NAME=panoramate
DB_USER=panoramate_user

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# ... other Stripe keys
```

**⚠️ SECURITY WARNING:**
- **Never commit `.env.local` to git** (it's in `.gitignore`)
- `DATABASE_URL` must be explicitly set - no secrets in docker-compose.yml
- Use strong, unique passwords - never use defaults
- Rotate secrets regularly in production
- Keep `.env.docker` as a template only - never commit real secrets

### 2. Start Services

Start all services (MySQL, Next.js app, MailHog):

```bash
docker-compose up
```

For detached mode (background):

```bash
docker-compose up -d
```

### 3. Initialize Database

In a new terminal window, run Prisma migrations:

```bash
docker-compose exec app npm run db:push
```

Or create a test user:

```bash
docker-compose exec app npm run db:create-test-user
```

### 4. Access the Application

- **App**: http://localhost:3000
- **MailHog (Email Testing)**: http://localhost:1080
- **MySQL**: `localhost:3306`

## Service Details

### MySQL Database (`db`)
- **Container**: `panoramate-db`
- **Port**: 3306 (configurable via `DB_PORT`)
- **Database**: `panoramate`
- **User**: `panoramate_user`
- **Volumes**: `db_data` (persistent storage)
- **Health Check**: Enabled

### Next.js Application (`app`)
- **Container**: `panoramate-app`
- **Port**: 3000 (configurable via `APP_PORT`)
- **Volume Mounts**:
  - `./uploads` → `/app/uploads` (user uploads)
  - `./src` → `/app/src` (hot reload for dev)
  - `/app/node_modules` (excluded from mount)
  - `/app/.next` (excluded from mount)
- **Mode**: Development (runs `npm run dev`)
- **Health Check**: Enabled

### MailHog (`mailhog`)
- **Container**: `panoramate-mailhog`
- **Web UI Port**: 1080 (configurable via `MAILHOG_WEB_PORT`)
- **SMTP Port**: 1025 (configurable via `MAILHOG_SMTP_PORT`)
- **Purpose**: Local email testing (all emails are captured here)

## Common Commands

### View Logs

View logs from all services:
```bash
docker-compose logs -f
```

View logs from specific service:
```bash
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f mailhog
```

### Execute Commands in Container

Run npm commands:
```bash
docker-compose exec app npm run db:migrate -- --name migration_name
docker-compose exec app npm run db:seed
```

Access MySQL CLI:
```bash
docker-compose exec db mysql -u panoramate_user -p panoramate
# Password: panoramate_pass
```

### Stop Services

Stop all services:
```bash
docker-compose down
```

Stop and remove volumes:
```bash
docker-compose down -v
```

Restart services:
```bash
docker-compose restart
```

## File Structure

```
panoramate/
├── Dockerfile                 # Multi-stage build for Next.js
├── docker-compose.yml         # Service orchestration
├── .dockerignore              # Files excluded from Docker build
├── .env.docker                # Docker environment template
├── docker/
│   └── mysql/
│       └── init.sql          # MySQL initialization script
└── uploads/                   # User-uploaded files (created on first run)
```

## Environment Variables

### Database Variables
- `DB_ROOT_PASSWORD`: MySQL root password
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database user password
- `DB_PORT`: MySQL port (default: 3306)

### Application Variables
- `NODE_ENV`: development/production
- `APP_PORT`: Application port (default: 3000)
- `JWT_SECRET`: JWT signing key (min 32 chars)
- `NEXTAUTH_URL`: Auth URL
- `NEXT_PUBLIC_APP_URL`: Public app URL

### Email Variables
- `EMAIL_PROVIDER`: smtp/sendgrid/mailgun
- For SMTP: `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`
- `EMAIL_FROM_NAME`: From address name
- `EMAIL_FROM_ADDRESS`: From email address

### Stripe Variables
- `STRIPE_SECRET_KEY`: Secret key
- `STRIPE_PUBLISHABLE_KEY`: Public key
- `STRIPE_WEBHOOK_SECRET`: Webhook secret
- `STRIPE_PRICE_*`: Price IDs for plans

## Development Workflow

### 1. Development Mode
```bash
# Edit code, changes auto-reload
docker-compose up

# In another terminal:
docker-compose exec app npm run db:migrate -- --name your_migration
```

### 2. Database Changes
```bash
# After editing prisma/schema.prisma:
docker-compose exec app npm run db:migrate -- --name descriptive_name

# Reset database (WARNING: deletes all data):
docker-compose down -v
docker-compose up
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed
```

### 3. Testing Emails
Open http://localhost:1080 in your browser to see all emails sent by the application.

### 4. Production Build
To test the production build locally:
```bash
docker build -t panoramate:latest .
docker run -p 3000:3000 --env-file .env.local panoramate:latest
```

## Troubleshooting

### Container Fails to Start

Check logs:
```bash
docker-compose logs app
```

Common issues:
- **Database connection error**: Ensure `db` service is running: `docker-compose logs db`
- **Port already in use**: Change `APP_PORT` or `DB_PORT` in `.env.local`
- **Missing env vars**: Copy `.env.docker` to `.env.local` and fill in required values

### Database Issues

Check MySQL logs:
```bash
docker-compose logs db
```

Access MySQL directly:
```bash
docker-compose exec db mysql -u root -prootpassword
```

Reset database completely:
```bash
docker-compose down -v
docker-compose up
```

### Node Modules Issues

Rebuild without cache:
```bash
docker-compose down
docker build --no-cache -t panoramate:dev .
docker-compose up
```

Clean reinstall:
```bash
docker-compose exec app rm -rf node_modules package-lock.json
docker-compose exec app npm install
```

## Performance Tips

### Limit MailHog Storage
Edit `docker-compose.yml`, uncomment:
```yaml
environment:
  MH_STORAGE: memory  # Only keep emails in RAM
```

### Increase Build Context
For faster rebuilds, ensure `.dockerignore` is complete.

### Persistent Data
Database data is stored in `db_data` volume automatically.

## Next Steps

- Configure Stripe keys in `.env.local`
- Set up email provider (SMTP/SendGrid/Mailgun)
- Customize MySQL settings in `docker-compose.yml` if needed
- See README.md for application-specific setup

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Docker](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch-sql)

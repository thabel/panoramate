# Docker & Docker Compose Setup

## ✅ Current Status

The Docker configuration has been updated to work with **mysql2** driver (instead of Prisma).

### Changes Made
- ✅ Removed `RUN npx prisma generate` from Dockerfile
- ✅ Removed `COPY --from=builder /app/prisma ./prisma` from production stage
- ✅ Updated docker-compose.yml to use individual DATABASE_* environment variables
- ✅ Updated .env.example and .env.docker with mysql2 configuration

## 📋 Prerequisites

```bash
# Required
- Docker (v20+)
- Docker Compose (v2.0+)

# Verify installation
docker --version
docker compose version
```

## 🚀 Quick Start

### 1. Configure Environment

Copy the docker environment file:
```bash
cp .env.docker .env.local
```

Then edit `.env.local` and update these variables:
```env
# Database (mysql2 driver)
DATABASE_HOST=db              # hostname of MySQL container
DATABASE_PORT=3306            # MySQL port
DATABASE_NAME=bativy          # database name
DATABASE_USER=bativy          # database user
DATABASE_PASSWORD=bativy_password  # database password

# MySQL Root Password (for docker-compose db service)
DB_ROOT_PASSWORD=change_this_root_password_in_env_local

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-must-be-at-least-32-characters-long!!

# Stripe Keys (add your test keys from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
```

### 2. Start Services

```bash
# Start all services (db, app, mailhog)
docker compose up

# Or in detached mode
docker compose up -d

# Or rebuild and start (if you made changes)
docker compose up --build
```

### 3. Access Application

- **App**: http://localhost:3000
- **MailHog (Email Testing)**: http://localhost:1080
- **MySQL**: localhost:3306

### 4. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app    # Application
docker compose logs -f db     # Database
docker compose logs -f mailhog # Email testing
```

## 🛑 Stop Services

```bash
# Stop all containers (keeps data)
docker compose stop

# Remove all containers and volumes (deletes data)
docker compose down

# Remove everything including volumes
docker compose down -v
```

## 🔧 Common Commands

```bash
# Check service status
docker compose ps

# Execute command in running container
docker compose exec app npm run build

# Restart a service
docker compose restart app

# View resource usage
docker stats
```

## 📊 Service Configuration

### MySQL Database
- Image: `mysql:8.0`
- Container: `bativy-db`
- Volumes: `db_data:/var/lib/mysql`
- Charset: `utf8mb4`
- Port: 3306 (exposed)

### Next.js App
- Container: `bativy-app`
- Port: 3000 (exposed)
- Volumes:
  - Current directory mounted at `/app`
  - node_modules (isolated)
  - .next (isolated)
- Depends on: MySQL database (healthcheck)

### MailHog (Email Testing)
- Image: `mailhog/mailhog:latest`
- Container: `bativy-mailhog`
- Web UI: http://localhost:1080
- SMTP: localhost:1025

## ⚠️ Important Notes

### For Development
1. Database data persists in `db_data` volume
2. Use MailHog for email testing (web UI at http://localhost:1080)
3. Application hot-reloads on file changes
4. Database connection: Check `.env.local` variables match docker-compose

### For Production
1. Use `.env` file with production secrets
2. Set `NODE_ENV=production` in environment
3. Use strong database passwords and JWT secrets
4. Configure proper Stripe keys
5. Set up proper email provider (not MailHog)
6. Use reverse proxy (nginx, traefik) for HTTPS

### Database Connection

The application uses **mysql2** driver with these environment variables:
- `DATABASE_HOST` - MySQL hostname
- `DATABASE_PORT` - MySQL port (default: 3306)
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name

Example mysql2 connection in code:
```typescript
import { db } from '@/lib/db';

// Connection pool created automatically
const result = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
```

## 🔍 Troubleshooting

### Database Connection Error
```bash
# Check database is running
docker compose ps

# Check database logs
docker compose logs db

# Verify environment variables in running app
docker compose exec app env | grep DATABASE
```

### App won't start
```bash
# Check app logs
docker compose logs app

# Ensure database is healthy before app starts
docker compose logs db --tail 20
```

### Port already in use
```bash
# Change port in .env.local
APP_PORT=3001  # or any available port

# Or kill existing process
lsof -i :3000  # find process on port 3000
kill -9 <PID>   # kill the process
```

### Rebuild from scratch
```bash
docker compose down -v  # Remove everything
docker compose build --no-cache  # Rebuild
docker compose up  # Start fresh
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [mysql2 Documentation](https://github.com/sidorares/node-mysql2)

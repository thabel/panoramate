#!/bin/bash

# Panoramate Docker Start Script
# This script simplifies starting the Docker environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Panoramate Docker Environment Setup   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker Compose is not installed${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local not found${NC}"
    echo -e "${BLUE}➜ Creating .env.local from .env.docker...${NC}"
    cp .env.docker .env.local
    echo -e "${GREEN}✓ .env.local created${NC}"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Please edit .env.local with your configuration:${NC}"
    echo ""
    echo -e "${YELLOW}  🔒 REQUIRED (Security):${NC}"
    echo "     - DB_ROOT_PASSWORD (use strong password)"
    echo "     - DB_PASSWORD (use strong password)"
    echo "     - JWT_SECRET (min 32 characters)"
    echo ""
    echo -e "${YELLOW}  📱 Integration:${NC}"
    echo "     - STRIPE_SECRET_KEY"
    echo "     - STRIPE_PUBLISHABLE_KEY"
    echo "     - Stripe price IDs"
    echo ""
    echo -e "${YELLOW}  📧 Email (optional):${NC}"
    echo "     - EMAIL_PROVIDER and credentials"
    echo ""
    echo -e "${YELLOW}  ⚠️  Never commit .env.local to git!${NC}"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}➜ Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Start services
echo -e "${BLUE}➜ Starting Docker services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${BLUE}➜ Waiting for services to be ready...${NC}"
sleep 5

# Check if app is running
if docker-compose exec -T app curl -s http://localhost:3000/api/health &> /dev/null; then
    echo -e "${GREEN}✓ App is running${NC}"
else
    echo -e "${YELLOW}⚠ App is still starting, check logs: docker-compose logs -f app${NC}"
fi

# Check if database is running
if docker-compose exec -T db mysqladmin ping -h localhost &> /dev/null; then
    echo -e "${GREEN}✓ Database is running${NC}"
else
    echo -e "${YELLOW}⚠ Database is still starting${NC}"
fi

echo ""
echo -e "${GREEN}✓ Docker environment is ready!${NC}"
echo ""
echo -e "${BLUE}Services available:${NC}"
echo "  • App:      http://localhost:3000"
echo "  • MailHog:  http://localhost:1080"
echo "  • Database: localhost:3306"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  docker-compose logs -f          # View all logs"
echo "  docker-compose logs -f app      # View app logs"
echo "  docker-compose exec app npm run db:migrate -- --name migration_name"
echo "  docker-compose exec app npm run db:seed"
echo "  docker-compose down             # Stop services"
echo ""

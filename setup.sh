#!/bin/bash

# ============================================================
# Football AI - One-Click Setup Script
# ============================================================
# This script sets up everything automatically
# ============================================================

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════╗"
echo "║     🏆 Football AI - Auto Setup Script               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js not found!${NC}"
    echo "Please install Node.js from: https://nodejs.org"
    echo "Download the LTS version and install it."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"

# Check Node version (must be 18+)
NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "${RED}❌ Node.js version must be 18 or higher!${NC}"
    echo "Current version: $NODE_VERSION"
    echo "Please upgrade from: https://nodejs.org"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
echo "${GREEN}✅ Dependencies installed!${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env from template..."
    cp .env.example .env
    echo "${GREEN}✅ .env created!${NC}"
    echo ""
    echo "${YELLOW}⚠️  IMPORTANT: Please edit .env file and add your:${NC}"
    echo "   1. API_FOOTBALL_KEY (from api-football.com)"
    echo "   2. MONGODB_URI (from mongodb.com/atlas)"
    echo "   3. JWT_SECRET (any random long text)"
    echo "   4. ADMIN_PASSWORD (your admin password)"
    echo ""
    echo "Press Enter when you're ready to continue..."
    read
fi

# Check if MongoDB URI is set
if grep -q "your_api_football_key_here" .env; then
    echo "${YELLOW}⚠️  Please edit .env and add your API_FOOTBALL_KEY${NC}"
    echo "Press Enter when ready..."
    read
fi

if grep -q "username:password" .env; then
    echo "${YELLOW}⚠️  Please edit .env and add your MONGODB_URI${NC}"
    echo "Press Enter when ready..."
    read
fi

# Seed admin user
echo ""
echo "👤 Creating admin user..."
npm run seed
echo "${GREEN}✅ Admin user created!${NC}"

# Start the server
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     🚀 Starting Football AI Server...                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "${GREEN}✅ Server is starting!${NC}"
echo ""
echo "📱 Open your browser and go to:"
echo "   ${YELLOW}http://localhost:10000${NC}"
echo ""
echo "🔐 Admin Panel: ${YELLOW}http://localhost:10000/admin${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start

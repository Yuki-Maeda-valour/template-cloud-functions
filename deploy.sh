#!/bin/bash

# Cloud Functions Deployment Script
# Usage: ./deploy.sh [environment] [project-id]
# Environment: dev, staging, prod (default: dev)

set -e

ENVIRONMENT=${1:-dev}
PROJECT_ID=${2}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Cloud Functions Deployment Script${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set project if provided
if [ ! -z "$PROJECT_ID" ]; then
    echo -e "${BLUE}📝 Setting project to: $PROJECT_ID${NC}"
    gcloud config set project $PROJECT_ID
fi

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project)
echo -e "${BLUE}📦 Current project: ${YELLOW}$CURRENT_PROJECT${NC}"

# Confirm deployment
echo -e "${YELLOW}⚠️  Are you sure you want to deploy to $ENVIRONMENT? (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

# Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build

# Deploy based on environment
case $ENVIRONMENT in
    "dev")
        echo -e "${BLUE}🚀 Deploying to development...${NC}"
        npm run deploy:dev
        ;;
    "staging")
        echo -e "${BLUE}🚀 Deploying to staging...${NC}"
        gcloud functions deploy main-staging \
            --gen2 \
            --runtime=nodejs18 \
            --source=. \
            --entry-point=main \
            --trigger=http \
            --set-env-vars NODE_ENV=staging
        ;;
    "prod")
        echo -e "${BLUE}🚀 Deploying to production...${NC}"
        npm run deploy:prod
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo -e "Valid environments: dev, staging, prod"
        exit 1
        ;;
esac

# Get function URL
echo -e "${BLUE}📋 Getting function URL...${NC}"
FUNCTION_URL=$(gcloud functions describe main --gen2 --format="value(serviceConfig.uri)" 2>/dev/null || echo "Unable to get URL")

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${BLUE}🌐 Function URL: ${YELLOW}$FUNCTION_URL${NC}"
echo -e "${BLUE}📊 View logs: ${YELLOW}npm run logs${NC}"
echo -e "${BLUE}📈 Monitor: ${YELLOW}npm run logs:tail${NC}"
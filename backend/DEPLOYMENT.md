# Backend Deployment Guide

## Overview

The backend is deployed to Google Cloud Run automatically via GitHub Actions when changes are pushed to `main`.

## Hardcoded Values (in workflow)

- **GCP Project ID**: `atomify-ee7b5`
- **Firebase Project ID**: `atomify-ee7b5` (same as GCP)
- **Region**: `europe-west1`
- **Service Name**: `atomify-api`
- **Database URL**: `sqlite+aiosqlite:////data/atomify.db` (SQLite file path)
- **GCS Bucket Name**: `atomify-user-files`
- **CORS Origins**: `http://localhost:3000,https://andeplane.github.io`

## Required GitHub Secrets

Set these in your GitHub repository: **Settings → Secrets and variables → Actions**

### 1. `GCP_SA_KEY`
- **Description**: Service account JSON key for CI/CD deployment
- **Service account**: `github-actions@atomify-ee7b5.iam.gserviceaccount.com`
- **Roles**:
  - `Cloud Run Admin` — deploy services
  - `Service Account User` — impersonate runtime SA
  - `Storage Object Admin` — push Docker images to GCR

### 2. `GCP_SERVICE_ACCOUNT_EMAIL`
- **Description**: Email of the service account that Cloud Run uses at runtime
- **Value**: `atomify-api@atomify-ee7b5.iam.gserviceaccount.com`
- **Roles**:
  - `Storage Object Admin` — access GCS buckets
- **Note**: No Firebase role needed — token verification uses public keys

## Cloud Run Setup

### 1. Enable APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  storage-api.googleapis.com
```

### 2. Create Service Account for Cloud Run

```bash
gcloud iam service-accounts create atomify-api \
  --display-name="Atomify API Service Account"

gcloud projects add-iam-policy-binding atomify-ee7b5 \
  --member="serviceAccount:atomify-api@atomify-ee7b5.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 3. Create GCS Bucket

**Note**: Billing must be enabled for the project first.

```bash
gcloud storage buckets create gs://atomify-user-files \
  --project=atomify-ee7b5 \
  --location=europe-west1

gcloud storage buckets add-iam-policy-binding gs://atomify-user-files \
  --member="serviceAccount:atomify-api@atomify-ee7b5.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 4. Create Database Bucket (for SQLite persistence)

SQLite is persisted via GCS FUSE mount:

```bash
# Create bucket for SQLite database
gcloud storage buckets create gs://atomify-db \
  --project=atomify-ee7b5 \
  --location=europe-west1

# Grant runtime service account access
gcloud storage buckets add-iam-policy-binding gs://atomify-db \
  --member="serviceAccount:atomify-api@atomify-ee7b5.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

The deploy command mounts this bucket at `/data` using Cloud Storage FUSE.

## Database Migrations

Migrations are **NOT** run automatically in the container startup to avoid race conditions.

### Option 1: Manual Migration (Recommended)

Before deploying, run migrations manually:

```bash
# Build and run migration container
docker build -t atomify-api:migrate ./backend
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  atomify-api:migrate \
  alembic upgrade head
```

### Option 2: Cloud Run Job

Create a Cloud Run Job for migrations:

```bash
gcloud run jobs create atomify-api-migrate \
  --image=gcr.io/atomify-ee7b5/atomify-api:latest \
  --region=europe-west1 \
  --set-env-vars="DATABASE_URL=$DATABASE_URL" \
  --command="alembic" \
  --args="upgrade,head"

# Run before each deployment
gcloud run jobs execute atomify-api-migrate --region=europe-west1 --wait
```

## Manual Deployment

If you need to deploy manually:

```bash
# Build and push
docker build -t gcr.io/atomify-ee7b5/atomify-api:latest ./backend
docker push gcr.io/atomify-ee7b5/atomify-api:latest

# Deploy
gcloud run deploy atomify-api \
  --image=gcr.io/atomify-ee7b5/atomify-api:latest \
  --region=europe-west1 \
  --platform=managed \
  --execution-environment=gen2 \
  --allow-unauthenticated \
  --service-account=atomify-api@atomify-ee7b5.iam.gserviceaccount.com \
  --set-env-vars="DATABASE_URL=sqlite+aiosqlite:////data/atomify.db,FIREBASE_PROJECT_ID=atomify-ee7b5,GCS_BUCKET_NAME=atomify-user-files,CORS_ORIGINS=http://localhost:3000,https://andeplane.github.io" \
  --add-volume=name=db-volume,type=cloud-storage,bucket=atomify-db \
  --add-volume-mount=volume=db-volume,mount-path=/data \
  --memory=512Mi \
  --cpu=1 \
  --port=8000
```

## Monitoring

- **Logs**: `gcloud run services logs read atomify-api --region=europe-west1`
- **Metrics**: Google Cloud Console → Cloud Run → atomify-api
- **Health Check**: `https://atomify-api-xxx.run.app/health`

## Troubleshooting

### Service won't start
- Check logs: `gcloud run services logs read atomify-api --region=europe-west1`
- Verify environment variables are set correctly
- Check service account permissions

### Database connection fails
- Verify `DATABASE_URL` is correct
- For Cloud SQL: Ensure Cloud SQL Admin API is enabled
- For SQLite volume: Ensure volume is mounted at `/data`

### Firebase Auth fails
- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Token verification uses public keys (no special permissions needed)
- Ensure Firebase Admin SDK is initialized correctly

### GCS access fails
- Verify `GCS_BUCKET_NAME` exists
- Check service account has `Storage Object Admin` role
- Verify bucket IAM allows the service account


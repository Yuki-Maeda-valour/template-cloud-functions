#!/bin/bash

# GCP Cloud Functions デプロイスクリプト

set -e

echo "🚀 Starting GCP deployment..."

# 環境変数の確認
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
  echo "❌ Error: GOOGLE_CLOUD_PROJECT environment variable is not set"
  echo "Please set it with: export GOOGLE_CLOUD_PROJECT=your-project-id"
  exit 1
fi

# プロジェクトの設定
echo "📋 Project: $GOOGLE_CLOUD_PROJECT"
gcloud config set project $GOOGLE_CLOUD_PROJECT

# 関数名の設定（デフォルト: functions）
FUNCTION_NAME=${FUNCTION_NAME:-"functions"}

echo "🔧 Deploying function: $FUNCTION_NAME"

# Cloud Functions のデプロイ
gcloud functions deploy $FUNCTION_NAME \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --source . \
  --entry-point httpHandler \
  --memory 256MB \
  --timeout 60s \
  --region ${REGION:-"us-central1"}

echo "✅ Deployment completed successfully!"
echo "🌐 Function URL: https://${REGION:-"us-central1"}-${GOOGLE_CLOUD_PROJECT}.cloudfunctions.net/${FUNCTION_NAME}"

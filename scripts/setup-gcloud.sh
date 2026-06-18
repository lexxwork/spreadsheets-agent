#!/usr/bin/env bash
# Creates a GCP project, enables the required APIs, and generates credentials.json
# for a service account with access to Google Sheets.
#
# Usage:
#   chmod +x setup-gcloud.sh
#   ./setup-gcloud.sh [PROJECT_ID] [SA_NAME]
#
# PROJECT_ID  - unique project ID (default: spreadsheets-agent-XXXX)
# SA_NAME     - service account name (default: sheets-editor)

set -euo pipefail

# Parameters
RAND=$(cat /proc/sys/kernel/random/uuid | tr -dc 'a-z0-9' | head -c 4 || true)
PROJECT_ID="${1:-spreadsheets-agent-${RAND}}"
SA_NAME="${2:-sheets-editor}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="credentials.json"

# Colors
bold=$'\033[1m'; green=$'\033[32m'; yellow=$'\033[33m'; reset=$'\033[0m'
step() { echo "${bold}${green}▶ $*${reset}"; }
warn() { echo "${yellow}⚠  $*${reset}"; }

# Check gcloud
if ! command -v gcloud &>/dev/null; then
  echo "gcloud not found. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# 1. Authorization
step "Checking gcloud authentication..."
if ! gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>/dev/null | grep -q '@'; then
  warn "No active account found, starting login..."
  gcloud auth login
fi

# 2. Create project
step "Creating project: ${PROJECT_ID}"
if gcloud projects describe "${PROJECT_ID}" &>/dev/null; then
  warn "Project ${PROJECT_ID} already exists, skipping creation."
else
  gcloud projects create "${PROJECT_ID}" --name="Spreadsheets Agent"
fi

gcloud config set project "${PROJECT_ID}"

# 3. Link billing account (optional)
# Sheets API and Drive API are free to use, so billing is not required.
# If a billing account is available, we link it anyway.
BILLING_ACCOUNT=$(gcloud billing accounts list \
  --filter="open=true" \
  --format="value(name)" \
  --limit=1 2>/dev/null || true)

if [[ -n "${BILLING_ACCOUNT}" ]]; then
  step "Linking billing account: ${BILLING_ACCOUNT}"
  gcloud billing projects link "${PROJECT_ID}" \
    --billing-account="${BILLING_ACCOUNT}" || true
else
  warn "No billing account found. It is not required for Sheets/Drive API, continuing."
fi

# 4. Enable Google Sheets API and Drive API
step "Enabling Sheets API and Drive API..."
gcloud services enable sheets.googleapis.com drive.googleapis.com \
  --project="${PROJECT_ID}"

# 5. Create service account
step "Creating service account: ${SA_NAME}"
if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" &>/dev/null; then
  warn "Service account ${SA_EMAIL} already exists, skipping."
else
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Sheets Editor" \
    --project="${PROJECT_ID}"
fi

# 6. Grant roles
step "Granting roles to the service account..."
# Access is mainly controlled via Google Sheets sharing,
# but having at least viewer at the project level is still useful.
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/viewer" \
  --condition=None \
  --quiet

# 7. Generate key
step "Generating key -> ${KEY_FILE}"
if [[ -f "${KEY_FILE}" ]]; then
  warn "File ${KEY_FILE} already exists. Overwriting..."
fi
gcloud iam service-accounts keys create "${KEY_FILE}" \
  --iam-account="${SA_EMAIL}" \
  --project="${PROJECT_ID}"

# Summary
echo ""
echo "${bold}${green}✅ Done!${reset}"
echo ""
echo "  Project:          ${PROJECT_ID}"
echo "  Service account:  ${SA_EMAIL}"
echo "  Key saved to:     ${KEY_FILE}"
echo ""
echo "${bold}Next step:${reset} open the target Google Sheet and grant edit access"
echo "to this address:"
echo ""
echo "  ${bold}${SA_EMAIL}${reset}"
echo ""
echo "Share it via: File -> Share -> Add member."

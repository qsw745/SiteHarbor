#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER="${SERVER:-root@101.37.21.147}"
REMOTE_DIR="${REMOTE_DIR:-/opt/siteharbor}"
BRANCH="${BRANCH:-main}"
IMAGE_NAME="${IMAGE_NAME:-siteharbor-siteharbor:latest}"
PLATFORM="${PLATFORM:-linux/amd64}"
STAMP="$(date +%Y%m%d%H%M%S)"
LOCAL_IMAGE_TAR="/tmp/siteharbor-image-${STAMP}.tar"
LOCAL_IMAGE_ARCHIVE="${LOCAL_IMAGE_TAR}.gz"
LOCAL_BUNDLE="/tmp/siteharbor-${BRANCH}-${STAMP}.bundle"
REMOTE_IMAGE_ARCHIVE="/tmp/siteharbor-image-${STAMP}.tar.gz"
REMOTE_BUNDLE="/tmp/siteharbor-${BRANCH}-${STAMP}.bundle"

cleanup() {
  rm -f "$LOCAL_IMAGE_TAR" "$LOCAL_IMAGE_ARCHIVE" "$LOCAL_BUNDLE"
}
trap cleanup EXIT

cd "$ROOT_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes before deploying." >&2
  git status --short
  exit 1
fi

echo "Running local checks..."
npm run lint
npm run typecheck

echo "Building ${IMAGE_NAME} for ${PLATFORM} locally..."
docker buildx build \
  --platform "$PLATFORM" \
  -t "$IMAGE_NAME" \
  --output "type=docker,dest=${LOCAL_IMAGE_TAR}" \
  .

echo "Compressing image archive..."
gzip -f "$LOCAL_IMAGE_TAR"

echo "Creating git bundle for ${BRANCH}..."
git bundle create "$LOCAL_BUNDLE" "$BRANCH"

echo "Uploading image and git bundle to ${SERVER}..."
scp "$LOCAL_IMAGE_ARCHIVE" "$LOCAL_BUNDLE" "${SERVER}:/tmp/"

echo "Loading image and restarting SiteHarbor on ${SERVER}..."
ssh "$SERVER" "REMOTE_DIR='$REMOTE_DIR' BRANCH='$BRANCH' IMAGE_ARCHIVE='$REMOTE_IMAGE_ARCHIVE' BUNDLE='$REMOTE_BUNDLE' bash -s" <<'REMOTE'
set -euo pipefail

cd "$REMOTE_DIR"
COMPOSE_FILES="-f docker-compose.yml"
if [ -f docker-compose.server.yml ]; then
  COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.server.yml"
fi

git fetch "$BUNDLE" "$BRANCH"
git merge --ff-only FETCH_HEAD

docker load -i "$IMAGE_ARCHIVE"
docker compose $COMPOSE_FILES up -d --no-build --force-recreate
docker compose $COMPOSE_FILES ps

for attempt in $(seq 1 20); do
  if curl -fsSI http://127.0.0.1:3000 >/tmp/siteharbor-healthcheck.txt; then
    break
  fi
  if [ "$attempt" = "20" ]; then
    cat /tmp/siteharbor-healthcheck.txt >&2 || true
    exit 1
  fi
  sleep 2
done

rm -f "$IMAGE_ARCHIVE" "$BUNDLE"
REMOTE

echo "Deployment finished. Health check passed at http://127.0.0.1:3000 on the server."

#!/bin/sh
set -eu

export HUSKY=0
export CI=1

if [ -z "${NODE_OPTIONS:-}" ]; then
  export NODE_OPTIONS="--max-old-space-size=4096"
fi

npm --workspace=app run build
npm --workspace=app run api:build
npm prune --omit=dev

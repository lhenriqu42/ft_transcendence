#!/bin/sh

set -e

: "${REDIS_SESSIONS_AUTH_USERNAME:?missing}"
: "${REDIS_SESSIONS_AUTH_PASSWORD:?missing}"
: "${REDIS_SESSIONS_BFF_USERNAME:?missing}"
: "${REDIS_SESSIONS_BFF_PASSWORD:?missing}"

TMP_ACL_FILE=/tmp/users.acl

cat > "$TMP_ACL_FILE" <<EOF
user default off

user ${REDIS_SESSIONS_AUTH_USERNAME} on >${REDIS_SESSIONS_AUTH_PASSWORD} ~* +@all

user ${REDIS_SESSIONS_BFF_USERNAME} on >${REDIS_SESSIONS_BFF_PASSWORD} ~session:* +get +exists +mget +ping +info
EOF

exec redis-server \
  --aclfile "$TMP_ACL_FILE" \
  --maxmemory 256mb \
  --maxmemory-policy noeviction \
  --appendonly yes
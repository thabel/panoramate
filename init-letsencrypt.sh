#!/bin/bash
# Run once on the production server to bootstrap the first SSL certificate.
# After this, certbot renews automatically every 12 hours inside the container.
#
# Usage: bash init-letsencrypt.sh

set -e

DOMAINS=(bativy.com www.bativy.com)
EMAIL="azmiayoub50@gmail.com"
RSA_KEY_SIZE=4096
DATA_PATH="./certbot"
STAGING=0  # Set to 1 to test against Let's Encrypt staging (avoids rate limits)

# ── Confirm before overwriting existing certs ───────────────────────────────
if [ -d "$DATA_PATH" ]; then
  read -p "Existing certbot data found. Replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# ── Download recommended TLS parameters ─────────────────────────────────────
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$DATA_PATH/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    > "$DATA_PATH/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    > "$DATA_PATH/conf/ssl-dhparams.pem"
fi

# ── Create a dummy certificate so nginx can start before real certs exist ───
LIVE_PATH="$DATA_PATH/conf/live/${DOMAINS[0]}"
echo "### Creating dummy certificate for ${DOMAINS[0]} ..."
mkdir -p "$LIVE_PATH"
docker compose -f docker-compose.yml --env-file .env run --rm --entrypoint \
  "/bin/sh -c 'mkdir -p /etc/letsencrypt/live/${DOMAINS[0]} && \
    openssl req -x509 -nodes -newkey rsa:${RSA_KEY_SIZE} -days 1 \
      -keyout /etc/letsencrypt/live/${DOMAINS[0]}/privkey.pem \
      -out    /etc/letsencrypt/live/${DOMAINS[0]}/fullchain.pem \
      -subj \"/CN=localhost\"'" \
  certbot

# ── Start nginx with the dummy cert ─────────────────────────────────────────
echo "### Starting nginx ..."
docker compose -f docker-compose.yml --env-file .env up --force-recreate -d nginx

# ── Delete dummy cert so certbot can issue a real one ───────────────────────
echo "### Removing dummy certificate ..."
docker compose -f docker-compose.yml --env-file .env run --rm --entrypoint \
  "rm -Rf /etc/letsencrypt/live/${DOMAINS[0]} \
          /etc/letsencrypt/archive/${DOMAINS[0]} \
          /etc/letsencrypt/renewal/${DOMAINS[0]}.conf" \
  certbot

# ── Build domain args (-d bativy.com -d www.bativy.com) ─────────────────────
DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
  echo "### (Using Let's Encrypt STAGING environment)"
fi

# ── Request the real certificate ─────────────────────────────────────────────
echo "### Requesting Let's Encrypt certificate for ${DOMAINS[*]} ..."
docker compose -f docker-compose.yml --env-file .env run --rm --entrypoint \
  "certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    $DOMAIN_ARGS \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --force-renewal" \
  certbot

# ── Reload nginx with the real certificate ───────────────────────────────────
echo "### Reloading nginx ..."
docker compose -f docker-compose.yml --env-file .env exec nginx nginx -s reload

echo ""
echo "Done! Your site is live at https://${DOMAINS[0]}"

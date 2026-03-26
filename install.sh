#!/bin/bash
set -e
echo "=== OEPP v5.0 Installation ==="
# Generate .env if not exists
if [ ! -f .env ]; then
    echo "Generating .env file..."
    ADMIN_PASSWORD=$(openssl rand -hex 16)
    DB_PASSWORD=$(openssl rand -hex 16)
    REDIS_PASSWORD=$(openssl rand -hex 16)
    SECRET_KEY=$(openssl rand -hex 32)
    cat > .env << EOF
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
SECRET_KEY=$SECRET_KEY
ADMIN_PASSWORD=$ADMIN_PASSWORD
DEBUG=false
CORS_ORIGINS=https://oepp.example.com,http://localhost:3000
ALLOWED_HOSTS=oepp.example.com,localhost
DOMAIN=oepp.example.com
SSL_EMAIL=admin@example.com
GRAFANA_PASSWORD=$(openssl rand -hex 16)
EOF
    echo "Admin password: $ADMIN_PASSWORD (save it)"
fi

# Create SSL certs if not exist
if [ ! -f nginx/ssl/fullchain.pem ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Create directories
mkdir -p data/{certbot/{conf,www},logs,reports,uploads,backups}
mkdir -p monitoring/grafana/{dashboards,datasources}
mkdir -p nginx/ssl

# Pull images
docker-compose pull

# Build and start
docker-compose build
docker-compose up -d

echo "=== Installation complete ==="
echo "Access: https://localhost (self-signed) or http://localhost"
echo "Admin password: $(grep ADMIN_PASSWORD .env | cut -d= -f2)"

# 🐘 PostgreSQL Setup Guide

## Quick Start với Docker

### 1. Start PostgreSQL + Redis
```bash
docker-compose up -d
```

### 2. Verify containers running
```bash
docker-compose ps
```

Expected output:
```
NAME            STATUS    PORTS
ath-postgres    running   0.0.0.0:5432->5432/tcp
ath-redis       running   0.0.0.0:6379->6379/tcp
```

### 3. Update .env file
```bash
# Copy từ env.example hoặc update trực tiếp
DATABASE_URL="postgresql://anhthoxay:anhthoxay_dev_2024@localhost:5432/anhthoxay_dev?schema=public"
```

### 4. Run Prisma migration
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Hoặc tạo migration (production)
npx prisma migrate dev --name init
```

### 5. Verify connection
```bash
# Start API
pnpm dev:api

# Check health endpoint
curl http://localhost:4202/health
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Reset database (xóa data)
docker-compose down -v
docker-compose up -d

# Connect to PostgreSQL CLI
docker exec -it ath-postgres psql -U anhthoxay -d anhthoxay_dev
```

## Connection Details

| Service    | Host      | Port | User       | Password            | Database       |
|------------|-----------|------|------------|---------------------|----------------|
| PostgreSQL | localhost | 5432 | anhthoxay  | anhthoxay_dev_2024  | anhthoxay_dev  |
| Redis      | localhost | 6379 | -          | -                   | -              |

## Troubleshooting

### Port already in use
```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# Kill process (Windows)
taskkill /PID <PID> /F
```

### Permission denied
```bash
# Windows: Run Docker Desktop as Administrator
# Linux: Add user to docker group
sudo usermod -aG docker $USER
```

### Connection refused
```bash
# Check if container is running
docker-compose ps

# Check container logs
docker-compose logs postgres
```

## Data Persistence

Data được lưu trong Docker volumes:
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data

Để backup:
```bash
# Backup PostgreSQL
docker exec ath-postgres pg_dump -U anhthoxay anhthoxay_dev > backup.sql

# Restore PostgreSQL
docker exec -i ath-postgres psql -U anhthoxay anhthoxay_dev < backup.sql
```

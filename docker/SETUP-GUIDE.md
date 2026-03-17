# 🚀 Hướng Dẫn Setup Database cho Testing

## Bước 1: Cài Đặt Docker

### macOS

```bash
# Cài Docker Desktop
brew install --cask docker

# Hoặc tải từ: https://www.docker.com/products/docker-desktop
```

Sau khi cài, **mở Docker Desktop** và đợi nó khởi động hoàn tất.

### Linux

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### Windows

Tải và cài đặt [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

## Bước 2: Verify Docker

```bash
# Check Docker version
docker --version
docker compose version

# Test Docker
docker run hello-world
```

## Bước 3: Start Local Database

```bash
# Start database (sẽ tự động pull image nếu chưa có)
npm run docker:dev

# Verify database đang chạy
docker ps

# Expected output:
# CONTAINER ID   IMAGE                 STATUS         PORTS                    NAMES
# xxx            postgres:16-alpine    Up 2 seconds   0.0.0.0:5432->5432/tcp   auth_shop_db_dev
```

## Bước 4: Setup Database Schema

```bash
# Run migrations để tạo tables
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres npm run db:migrate

# Seed test data (optional)
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres npm run db:seed:e2e
```

Hoặc dùng script tự động:

```bash
npm run db:migrate
```

## Bước 5: Run Tests

```bash
# Unit tests
npm run test:unit:local

# Security tests
npm run test:security:local

# E2E tests
npm run test:e2e:local

# All tests
npm run test:all:local
```

## Bước 6: Verify Performance

Chạy benchmark để xem cải thiện tốc độ:

```bash
# Với remote database (slow)
time npm run test:unit

# Với local test database (fast)
time npm run test:unit:local
```

Bạn sẽ thấy sự khác biệt lớn! 🚀

## Troubleshooting

### "Cannot connect to Docker daemon"

```bash
# Kiểm tra Docker có chạy không
docker ps

# Nếu lỗi, start Docker Desktop hoặc:
sudo systemctl start docker  # Linux
```

### "Port 5433 already in use"

```bash
# Check port
lsof -i :5433

# Stop container
npm run docker:dev:down
```

### "Database connection refused"

```bash
# Wait a few seconds cho database khởi động
sleep 5

# Check logs
npm run docker:logs

# Restart
npm run docker:dev:down
npm run docker:dev
```

### "Permission denied"

```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker ps
```

## Next Steps

1. Đọc chi tiết trong [TESTING.md](../TESTING.md)
2. Xem cấu hình trong [README.md](./README.md)
3. Tùy chỉnh `docker-compose.yml` nếu cần

## Quick Reference

```bash
# Start & Stop
npm run docker:dev            # Start
npm run docker:dev:down       # Stop
npm run docker:logs           # Logs

# Database Management
npm run db:migrate            # Migrations
DATABASE_URL=... npm run db:reset    # Reset

# Testing
npm run test:unit:local       # Unit tests
npm run test:security:local   # Security tests
npm run test:e2e:local        # E2E tests
npm run test:all:local        # All tests
```

## Performance Tips

1. **Allocate more RAM to Docker**: Docker Desktop → Settings → Resources
2. **Use SSD**: Ensure Docker stores data on SSD (already using tmpfs in test DB)
3. **Close unused apps**: Free up memory for Docker
4. **Keep Docker updated**: Latest version has performance improvements

## Support

Nếu gặp vấn đề:

1. Check Docker Desktop đã chạy chưa
2. Xem logs: `npm run docker:logs`
3. Restart: `npm run docker:dev:down && npm run docker:dev`
4. Check Docker resources: Docker Desktop → Settings → Resources

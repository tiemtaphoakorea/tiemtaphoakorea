# Docker Setup for Auth Shop Platform

## Quick Start

### Development Database

Khởi động PostgreSQL cho development:

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker compose logs -f postgres

# Start with pgAdmin (optional)
docker compose --profile tools up -d
```

Truy cập pgAdmin tại: http://localhost:5050

- Email: admin@admin.com
- Password: admin

## Configuration

### Development Database

- **Port**: 5432
- **User**: postgres
- **Password**: password
- **Database**: postgres
- **Data**: Persistent (stored in Docker volume)

## Environment Variables

Cập nhật file `.env` của bạn:

```bash
# Development
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres

# Testing
# Hiện tại unit tests sử dụng in-memory DB (PGlite) nên không cần Docker Postgres riêng.
```

## Database Management

### Run Migrations

```bash
# Development
npm run db:migrate

# Test database - cần set DATABASE_URL trước
DATABASE_URL=postgresql://postgres:password@localhost:5433/postgres_test npm run db:migrate
```

### Reset Database

```bash
# Development
npm run db:reset

# Test database
DATABASE_URL=postgresql://postgres:password@localhost:5433/postgres_test npm run db:reset
```

### Seed Data

```bash
# E2E test data
npm run db:seed:e2e
```

## Running Tests

### Unit & Security Tests (Vitest)

```bash
# Sử dụng test database
DATABASE_URL=postgresql://postgres:password@localhost:5433/postgres_test npm run test:unit
DATABASE_URL=postgresql://postgres:password@localhost:5433/postgres_test npm run test:security
```

## Troubleshooting

### Port already in use

```bash
# Check port
lsof -i :5432

# Stop containers
docker compose down
```

### Database connection refused

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs postgres

# Restart container
docker compose restart postgres
```

### Clear all data

```bash
# Development (removes volume)
docker compose down -v
```

## CI/CD Integration

Trong CI pipeline, sử dụng test database:

```yaml
# .github/workflows/test.yml example
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_PASSWORD: password
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
      --tmpfs /var/lib/postgresql/data:rw
      -c fsync=off
      -c synchronous_commit=off
```

## Resources

- PostgreSQL Performance Tuning: https://wiki.postgresql.org/wiki/Performance_Optimization
- Docker Compose Reference: https://docs.docker.com/compose/
- tmpfs in Docker: https://docs.docker.com/storage/tmpfs/

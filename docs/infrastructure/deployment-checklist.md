# Deployment Checklist

This document provides a comprehensive checklist for deploying the ANH THỢ XÂY platform.

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests pass (`pnpm nx run-many --target=test --all`)
- [ ] Linting passes (`pnpm nx run-many --target=lint --all`)
- [ ] Type checking passes (`pnpm nx run-many --target=typecheck --all`)
- [ ] No security vulnerabilities (`pnpm audit`)
- [ ] Code review approved
- [ ] PR merged to main branch

### Database

- [ ] Database migrations reviewed
- [ ] Migration tested on staging
- [ ] Backup created before migration
- [ ] Rollback script prepared (if applicable)
- [ ] No breaking schema changes (or migration plan in place)

### Configuration

- [ ] Environment variables updated
- [ ] Secrets rotated (if scheduled)
- [ ] Feature flags configured
- [ ] Rate limits appropriate for expected traffic

### Dependencies

- [ ] All dependencies up to date
- [ ] No deprecated packages
- [ ] License compliance verified
- [ ] Security patches applied

### Infrastructure

- [ ] Auto-scaling configured correctly
- [ ] Health checks verified
- [ ] Load balancer configured
- [ ] CDN cache rules updated (if needed)
- [ ] SSL certificates valid (> 30 days)

## Deployment Steps

### Step 1: Notify Team

```bash
# Post to Slack/Teams
"🚀 Starting deployment of version X.Y.Z to production"
```

- [ ] Notify development team
- [ ] Notify operations team
- [ ] Update status page (if applicable)

### Step 2: Create Backup

```bash
# Database snapshot
aws rds create-db-snapshot \
  --db-instance-identifier ath-production \
  --db-snapshot-identifier pre-deploy-$(date +%Y%m%d-%H%M)

# Redis snapshot
redis-cli BGSAVE
```

- [ ] Database backup created
- [ ] Redis backup created
- [ ] Backup verified

### Step 3: Run Database Migrations

```bash
# Apply migrations
pnpm db:push

# Verify migration
pnpm prisma migrate status
```

- [ ] Migrations applied successfully
- [ ] Data integrity verified
- [ ] No errors in migration logs

### Step 4: Deploy Application

```bash
# Build and push Docker image
docker build -t ath-api:latest .
docker push registry.example.com/ath-api:latest

# Update ECS service
aws ecs update-service \
  --cluster ath-production \
  --service ath-api \
  --force-new-deployment
```

- [ ] Docker image built
- [ ] Image pushed to registry
- [ ] Deployment initiated

### Step 5: Monitor Deployment

```bash
# Watch deployment progress
aws ecs wait services-stable \
  --cluster ath-production \
  --services ath-api

# Check task status
aws ecs describe-services \
  --cluster ath-production \
  --services ath-api \
  --query 'services[0].deployments'
```

- [ ] New tasks starting
- [ ] Health checks passing
- [ ] Old tasks draining
- [ ] Deployment complete

### Step 6: Verify Deployment

```bash
# Health check
curl https://api.example.com/health/ready

# Version check
curl https://api.example.com/health/ready | jq '.version'

# Smoke tests
pnpm test:smoke
```

- [ ] Health endpoint returns 200
- [ ] Correct version deployed
- [ ] Smoke tests pass
- [ ] No errors in logs

## Post-Deployment Checklist

### Monitoring

- [ ] Check error rates (should be < 0.1%)
- [ ] Check latency (p95 < 500ms)
- [ ] Check CPU/memory usage
- [ ] Check database connections
- [ ] Check Redis connections

### Verification

- [ ] Critical user flows working
- [ ] API responses correct
- [ ] No increase in error logs
- [ ] No performance degradation

### Documentation

- [ ] Release notes updated
- [ ] Changelog updated
- [ ] API documentation updated (if changed)
- [ ] Runbook updated (if needed)

### Communication

- [ ] Team notified of successful deployment
- [ ] Status page updated
- [ ] Stakeholders informed

## Rollback Procedure

### When to Rollback

- Error rate > 1%
- p95 latency > 2 seconds
- Critical functionality broken
- Security vulnerability discovered

### Rollback Steps

```bash
# 1. Revert to previous task definition
aws ecs update-service \
  --cluster ath-production \
  --service ath-api \
  --task-definition ath-api:previous-version

# 2. Wait for rollback
aws ecs wait services-stable \
  --cluster ath-production \
  --services ath-api

# 3. Verify rollback
curl https://api.example.com/health/ready | jq '.version'
```

### Database Rollback

```bash
# If migration needs rollback
# 1. Restore from pre-deployment snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ath-production-rollback \
  --db-snapshot-identifier pre-deploy-YYYYMMDD-HHMM

# 2. Update application to use rollback instance
# 3. Verify data integrity
```

### Post-Rollback

- [ ] Notify team of rollback
- [ ] Document reason for rollback
- [ ] Create incident report
- [ ] Plan fix for next deployment

## Emergency Deployment

For critical security patches or hotfixes:

### Fast-Track Checklist

- [ ] Critical fix verified
- [ ] Minimal code change
- [ ] Tests pass
- [ ] Two approvers signed off
- [ ] Backup created
- [ ] Rollback plan ready

### Emergency Deploy Command

```bash
# Skip staging, deploy directly to production
# Only for critical security fixes!

# 1. Build and push
docker build -t ath-api:hotfix-$(date +%Y%m%d) .
docker push registry.example.com/ath-api:hotfix-$(date +%Y%m%d)

# 2. Deploy with immediate effect
aws ecs update-service \
  --cluster ath-production \
  --service ath-api \
  --force-new-deployment \
  --deployment-configuration "minimumHealthyPercent=50,maximumPercent=200"
```

## Deployment Schedule

### Regular Deployments

- **Frequency**: Weekly (Tuesday 10:00 AM UTC)
- **Maintenance Window**: 30 minutes
- **Notification**: 24 hours in advance

### Hotfix Deployments

- **Frequency**: As needed
- **Maintenance Window**: 15 minutes
- **Notification**: Immediate

### Major Releases

- **Frequency**: Monthly
- **Maintenance Window**: 2 hours
- **Notification**: 1 week in advance

## Contacts

### On-Call

- Primary: [On-call engineer]
- Secondary: [Backup engineer]
- Escalation: [Team lead]

### External

- AWS Support: [Support case]
- CDN Support: [Cloudflare dashboard]
- Database Support: [RDS support]

## Appendix

### Environment Variables Checklist

```bash
# Required for production
DATABASE_URL=
DATABASE_REPLICA_URL=
REDIS_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
ENCRYPTION_KEY=
CDN_DOMAIN=
CDN_PURGE_API_KEY=
S3_BUCKET=
S3_REGION=
SENTRY_DSN=
```

### Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/health/live` | Liveness probe | `{ "status": "healthy" }` |
| `/health/ready` | Readiness probe | `{ "status": "healthy", "checks": {...} }` |

### Monitoring Dashboards

- [Grafana Dashboard](https://grafana.example.com/d/ath-api)
- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch)
- [Sentry Issues](https://sentry.io/organizations/ath)

### Useful Commands

```bash
# Check current deployment
aws ecs describe-services --cluster ath-production --services ath-api

# View recent logs
aws logs tail /ecs/ath-api --follow

# Check auto-scaling status
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names ath-api-asg

# Force cache invalidation
curl -X POST https://api.example.com/api/admin/cdn/purge-all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

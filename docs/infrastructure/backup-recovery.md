# Backup and Recovery Procedures

This document describes the backup and recovery procedures for the ANH THỢ XÂY platform.

## Overview

### Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RTO** (Recovery Time Objective) | 1 hour | Maximum acceptable downtime |
| **RPO** (Recovery Point Objective) | 15 minutes | Maximum acceptable data loss |

### Backup Strategy

- **Database**: Continuous backup with point-in-time recovery
- **Redis**: Periodic snapshots + AOF persistence
- **Media Files**: Cross-region replication
- **Configuration**: Version controlled in Git

## Database Backup

### Automated Backups

```yaml
database_backup:
  # Continuous backup (AWS RDS)
  automated_backup:
    enabled: true
    retention_period: 35  # days
    backup_window: "03:00-04:00"  # UTC
    
  # Point-in-time recovery
  pitr:
    enabled: true
    retention: 35  # days
    
  # Manual snapshots
  manual_snapshots:
    retention: 90  # days
    naming: "ath-db-{date}-{type}"
```

### Backup Schedule

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Continuous (PITR) | Real-time | 35 days | AWS RDS |
| Daily Snapshot | Daily 03:00 UTC | 35 days | AWS RDS |
| Weekly Snapshot | Sunday 03:00 UTC | 90 days | S3 |
| Monthly Snapshot | 1st of month | 1 year | S3 Glacier |

### Manual Backup Commands

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier ath-production \
  --db-snapshot-identifier ath-manual-$(date +%Y%m%d)

# Export to S3
aws rds start-export-task \
  --export-task-identifier ath-export-$(date +%Y%m%d) \
  --source-arn arn:aws:rds:region:account:snapshot:ath-manual-$(date +%Y%m%d) \
  --s3-bucket-name ath-backups \
  --iam-role-arn arn:aws:iam::account:role/rds-export-role \
  --kms-key-id arn:aws:kms:region:account:key/key-id
```

## Redis Backup

### Persistence Configuration

```yaml
redis_persistence:
  # RDB snapshots
  rdb:
    enabled: true
    save_rules:
      - "900 1"    # Save if 1 key changed in 15 min
      - "300 10"   # Save if 10 keys changed in 5 min
      - "60 10000" # Save if 10000 keys changed in 1 min
      
  # AOF (Append Only File)
  aof:
    enabled: true
    fsync: everysec  # Sync every second
    rewrite_percentage: 100
    rewrite_min_size: 64mb
```

### Backup Schedule

| Type | Frequency | Retention |
|------|-----------|-----------|
| RDB Snapshot | Every 15 min | 24 hours |
| Daily Export | Daily 04:00 UTC | 7 days |
| Weekly Export | Sunday 04:00 UTC | 30 days |

### Manual Backup Commands

```bash
# Trigger RDB snapshot
redis-cli BGSAVE

# Export to S3
aws s3 cp /var/lib/redis/dump.rdb \
  s3://ath-backups/redis/dump-$(date +%Y%m%d).rdb
```

## Media Files Backup

### S3 Configuration

```yaml
media_storage:
  primary_bucket: ath-media-production
  backup_bucket: ath-media-backup
  
  # Cross-region replication
  replication:
    enabled: true
    destination_region: ap-southeast-2
    
  # Versioning
  versioning:
    enabled: true
    
  # Lifecycle rules
  lifecycle:
    - name: archive_old_versions
      prefix: ""
      noncurrent_version_transition:
        days: 30
        storage_class: GLACIER
      noncurrent_version_expiration:
        days: 365
```

### Backup Verification

```bash
# Verify replication status
aws s3api get-bucket-replication \
  --bucket ath-media-production

# Compare object counts
aws s3 ls s3://ath-media-production --recursive | wc -l
aws s3 ls s3://ath-media-backup --recursive | wc -l
```

## Configuration Backup

### Git-Based Configuration

All configuration is stored in Git:

```
.kiro/
├── steering/          # Steering rules
├── specs/             # Feature specifications
infra/
├── prisma/            # Database schema
├── docker/            # Docker configurations
docs/
├── infrastructure/    # Infrastructure docs
```

### Environment Variables

```bash
# Export current environment
env | grep -E "^(DATABASE|REDIS|JWT|CDN)" > .env.backup

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name ath/production/env \
  --secret-string file://.env.backup
```

## Recovery Procedures

### Database Recovery

#### Point-in-Time Recovery

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ath-production \
  --target-db-instance-identifier ath-recovery \
  --restore-time "2024-01-15T10:30:00Z" \
  --db-instance-class db.r6g.xlarge

# Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier ath-recovery

# Update application to use recovered instance
# (Update DATABASE_URL in environment)
```

#### Snapshot Recovery

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier ath-production

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ath-recovery \
  --db-snapshot-identifier ath-manual-20240115 \
  --db-instance-class db.r6g.xlarge
```

### Redis Recovery

#### From RDB Snapshot

```bash
# Stop Redis
sudo systemctl stop redis

# Replace dump file
sudo cp /backup/dump-20240115.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb

# Start Redis
sudo systemctl start redis

# Verify data
redis-cli INFO keyspace
```

#### From AOF

```bash
# Stop Redis
sudo systemctl stop redis

# Replace AOF file
sudo cp /backup/appendonly-20240115.aof /var/lib/redis/appendonly.aof
sudo chown redis:redis /var/lib/redis/appendonly.aof

# Start Redis
sudo systemctl start redis
```

### Media Files Recovery

```bash
# Restore from backup bucket
aws s3 sync s3://ath-media-backup s3://ath-media-production

# Restore specific file version
aws s3api get-object \
  --bucket ath-media-production \
  --key path/to/file.jpg \
  --version-id "version-id" \
  restored-file.jpg
```

### Full System Recovery

#### Step 1: Infrastructure

```bash
# Deploy infrastructure (if needed)
cd infra/terraform
terraform apply -target=module.vpc
terraform apply -target=module.rds
terraform apply -target=module.redis
terraform apply -target=module.ecs
```

#### Step 2: Database

```bash
# Restore database from latest snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ath-production \
  --db-snapshot-identifier $(aws rds describe-db-snapshots \
    --db-instance-identifier ath-production \
    --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
    --output text)
```

#### Step 3: Redis

```bash
# Redis will recover from AOF/RDB automatically on start
# Verify cluster health
redis-cli CLUSTER INFO
```

#### Step 4: Application

```bash
# Deploy latest application version
aws ecs update-service \
  --cluster ath-production \
  --service ath-api \
  --force-new-deployment
```

#### Step 5: Verification

```bash
# Check health endpoints
curl https://api.example.com/health/ready

# Verify database connectivity
curl https://api.example.com/health/ready | jq '.checks.database'

# Verify Redis connectivity
curl https://api.example.com/health/ready | jq '.checks.redis'
```

## Disaster Recovery

### DR Strategy

| Scenario | Strategy | RTO | RPO |
|----------|----------|-----|-----|
| Single instance failure | Auto-scaling replacement | 5 min | 0 |
| AZ failure | Multi-AZ failover | 15 min | 0 |
| Region failure | Cross-region restore | 1 hour | 15 min |
| Data corruption | Point-in-time recovery | 30 min | 15 min |

### Cross-Region DR

```yaml
dr_configuration:
  primary_region: ap-southeast-1
  dr_region: ap-southeast-2
  
  # Replicated resources
  database:
    type: cross_region_read_replica
    promotion_time: 10  # minutes
    
  redis:
    type: global_datastore
    failover_time: 5  # minutes
    
  media:
    type: cross_region_replication
    lag: near_real_time
```

### DR Runbook

1. **Detect** - Monitoring alerts on primary region failure
2. **Assess** - Determine scope and expected duration
3. **Decide** - Trigger DR if outage > 30 minutes expected
4. **Execute** - Follow DR procedure
5. **Verify** - Confirm DR environment is operational
6. **Communicate** - Notify stakeholders
7. **Monitor** - Watch for issues in DR environment
8. **Failback** - Return to primary when resolved

## Testing

### Backup Verification

Monthly verification:

```bash
# 1. Restore database to test instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ath-backup-test \
  --db-snapshot-identifier latest-snapshot

# 2. Run data integrity checks
psql -h ath-backup-test.xxx.rds.amazonaws.com \
  -U admin -d ath \
  -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM projects;"

# 3. Clean up test instance
aws rds delete-db-instance \
  --db-instance-identifier ath-backup-test \
  --skip-final-snapshot
```

### DR Drill

Quarterly DR drill:

1. Announce maintenance window
2. Simulate primary region failure
3. Execute DR procedure
4. Verify application functionality
5. Measure actual RTO/RPO
6. Document lessons learned
7. Failback to primary

## Monitoring

### Backup Monitoring

```yaml
backup_alerts:
  - name: BackupFailed
    condition: backup_status != "completed"
    action: notify_ops_urgent
    
  - name: BackupLate
    condition: last_backup_age > 24h
    action: notify_ops
    
  - name: ReplicationLag
    condition: replication_lag > 1h
    action: notify_ops
```

### Recovery Testing Metrics

Track monthly:

- Backup success rate (target: 100%)
- Recovery test success rate (target: 100%)
- Actual RTO vs target
- Actual RPO vs target

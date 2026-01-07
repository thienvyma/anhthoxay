# Auto-Scaling Configuration

This document describes the auto-scaling configuration for the ANH THỢ XÂY platform.

## Overview

The platform uses horizontal auto-scaling to handle varying traffic loads. Auto-scaling is configured at multiple layers:

1. **Application Layer** - API instances
2. **Cache Layer** - Redis cluster
3. **Database Layer** - Read replicas
4. **Queue Layer** - BullMQ workers

## Application Auto-Scaling

### Scaling Metrics

| Metric | Scale Up Threshold | Scale Down Threshold | Cooldown |
|--------|-------------------|---------------------|----------|
| CPU Utilization | > 70% for 3 min | < 30% for 10 min | 5 min |
| Memory Utilization | > 80% for 3 min | < 40% for 10 min | 5 min |
| Request Latency (p95) | > 500ms for 2 min | < 200ms for 10 min | 5 min |
| Request Rate | > 1000 req/s | < 200 req/s | 5 min |

### Instance Configuration

```yaml
# Minimum and maximum instances
min_instances: 2
max_instances: 10
desired_instances: 3

# Instance specifications
instance_type: t3.medium  # 2 vCPU, 4GB RAM
```

### Scaling Policies

#### Scale Up Policy

```yaml
scale_up:
  adjustment_type: ChangeInCapacity
  scaling_adjustment: 2  # Add 2 instances
  cooldown: 300  # 5 minutes
  
  triggers:
    - metric: CPUUtilization
      threshold: 70
      comparison: GreaterThanThreshold
      period: 180  # 3 minutes
      evaluation_periods: 1
      
    - metric: TargetResponseTime
      threshold: 0.5  # 500ms
      comparison: GreaterThanThreshold
      period: 120  # 2 minutes
      evaluation_periods: 1
```

#### Scale Down Policy

```yaml
scale_down:
  adjustment_type: ChangeInCapacity
  scaling_adjustment: -1  # Remove 1 instance
  cooldown: 600  # 10 minutes
  
  triggers:
    - metric: CPUUtilization
      threshold: 30
      comparison: LessThanThreshold
      period: 600  # 10 minutes
      evaluation_periods: 2
```

### Health Check Configuration

```yaml
health_check:
  path: /health/ready
  interval: 30  # seconds
  timeout: 5  # seconds
  healthy_threshold: 2
  unhealthy_threshold: 3
```

## Redis Cluster Scaling

### Cluster Configuration

```yaml
redis_cluster:
  mode: cluster
  nodes: 6  # 3 primary + 3 replica
  node_type: cache.r6g.large
  
  # Auto-scaling based on memory
  scale_up_memory_threshold: 75%
  scale_down_memory_threshold: 25%
```

### Scaling Triggers

| Metric | Scale Up | Scale Down |
|--------|----------|------------|
| Memory Usage | > 75% | < 25% |
| CPU Usage | > 70% | < 20% |
| Network I/O | > 80% capacity | < 20% capacity |

## Database Scaling

### Read Replica Configuration

```yaml
database:
  primary:
    instance_type: db.r6g.xlarge
    storage: 500GB
    iops: 3000
    
  replicas:
    min_count: 1
    max_count: 5
    instance_type: db.r6g.large
    
  # Replica scaling triggers
  scale_up:
    - read_latency > 100ms for 5 min
    - cpu_utilization > 70% for 5 min
    - connections > 80% max for 5 min
    
  scale_down:
    - read_latency < 20ms for 30 min
    - cpu_utilization < 20% for 30 min
```

### Connection Pooling

```yaml
connection_pool:
  min_connections: 5
  max_connections: 20
  idle_timeout: 60000  # 1 minute
  connection_timeout: 10000  # 10 seconds
```

## Queue Worker Scaling

### Worker Configuration

```yaml
queue_workers:
  min_workers: 2
  max_workers: 10
  
  # Scale based on queue depth
  scale_up:
    queue_depth: 1000
    wait_time: 60  # seconds
    
  scale_down:
    queue_depth: 100
    idle_time: 300  # 5 minutes
```

## Load Balancer Configuration

### Target Group Settings

```yaml
target_group:
  protocol: HTTP
  port: 4202
  health_check:
    path: /health/live
    interval: 10
    timeout: 5
    healthy_threshold: 2
    unhealthy_threshold: 3
    
  # Sticky sessions (disabled for stateless API)
  stickiness:
    enabled: false
    
  # Deregistration delay for graceful shutdown
  deregistration_delay: 30  # seconds
```

### Connection Draining

```yaml
connection_draining:
  enabled: true
  timeout: 30  # seconds
```

## Scheduled Scaling

For predictable traffic patterns:

```yaml
scheduled_scaling:
  # Scale up before business hours (Vietnam timezone)
  - name: morning_scale_up
    schedule: "0 7 * * MON-FRI"
    min_instances: 4
    desired_instances: 5
    
  # Scale down after business hours
  - name: evening_scale_down
    schedule: "0 22 * * MON-FRI"
    min_instances: 2
    desired_instances: 2
    
  # Weekend minimal
  - name: weekend_minimal
    schedule: "0 0 * * SAT,SUN"
    min_instances: 2
    desired_instances: 2
```

## Emergency Scaling

### Manual Override

```bash
# Scale to specific count immediately
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name ath-api-asg \
  --desired-capacity 10

# Temporarily disable scale-down
aws autoscaling suspend-processes \
  --auto-scaling-group-name ath-api-asg \
  --scaling-processes Terminate
```

### Emergency Mode Triggers

When emergency mode is activated:

1. Minimum instances increased to 5
2. Scale-down policies suspended
3. Aggressive scale-up (add 3 instances per trigger)
4. Alert sent to operations team

## Monitoring & Alerts

### CloudWatch Alarms

```yaml
alarms:
  - name: HighCPU
    metric: CPUUtilization
    threshold: 85
    period: 300
    action: notify_ops
    
  - name: HighLatency
    metric: TargetResponseTime
    threshold: 1.0  # 1 second
    period: 300
    action: notify_ops
    
  - name: ScalingFailure
    metric: GroupDesiredCapacity
    comparison: NotEqualTo
    threshold: GroupInServiceInstances
    period: 600
    action: notify_ops_urgent
```

### Metrics Dashboard

Key metrics to monitor:

1. **Instance Count** - Current vs desired
2. **CPU/Memory** - Per instance and average
3. **Request Rate** - Requests per second
4. **Latency** - p50, p95, p99
5. **Error Rate** - 4xx and 5xx responses
6. **Queue Depth** - Pending jobs

## Cost Optimization

### Reserved Capacity

- Reserve 2 instances (minimum) for baseline
- Use spot instances for scale-up capacity (up to 50%)

### Right-Sizing

Review monthly:
- Instance utilization patterns
- Memory vs CPU bottlenecks
- Network throughput requirements

## Troubleshooting

### Common Issues

1. **Scaling too slow**
   - Reduce cooldown period
   - Lower scale-up threshold
   - Use predictive scaling

2. **Scaling too aggressive**
   - Increase cooldown period
   - Raise scale-up threshold
   - Add evaluation periods

3. **Instances not healthy**
   - Check health check path
   - Verify security groups
   - Review application logs

### Debug Commands

```bash
# Check scaling activities
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name ath-api-asg

# Check instance health
aws autoscaling describe-auto-scaling-instances

# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

# ADR-004: Async Processing Roadmap

## Status
Proposed

## Context
Identify operations suitable for background job queues to improve response times and reliability.

## Operations for Background Processing

### High Priority (Blocking User Experience)

| Operation | Current | Proposed | Queue |
|-----------|---------|----------|-------|
| Email notifications | Sync | Async | notifications |
| PDF generation | Sync | Async | documents |
| Image optimization | Sync | Async | media |

### Medium Priority (Resource Intensive)

| Operation | Current | Proposed | Queue |
|-----------|---------|----------|-------|
| Ranking calculations | Cron job | Queue | rankings |
| Badge calculations | Cron job | Queue | badges |
| Review reminders | Cron job | Queue | reminders |
| Scheduled notifications | Cron job | Queue | notifications |

### Low Priority (Can Be Deferred)

| Operation | Current | Proposed | Queue |
|-----------|---------|----------|-------|
| Google Sheets sync | Sync | Async | integrations |
| Audit log cleanup | Manual | Scheduled | maintenance |
| Session cleanup | Manual | Scheduled | maintenance |

## Queue Structure

```
queues/
├── notifications/     # Email, SMS, push notifications
├── documents/         # PDF generation
├── media/            # Image processing
├── rankings/         # Contractor ranking calculations
├── badges/           # Badge calculations
├── reminders/        # Review reminders
├── integrations/     # External service sync
└── maintenance/      # Cleanup jobs
```

## Implementation Plan

### Phase 1: BullMQ Setup
1. Add Redis for queue storage
2. Install BullMQ
3. Create queue infrastructure

### Phase 2: Notification Queue
1. Move email sending to queue
2. Add retry logic
3. Add dead letter queue

### Phase 3: Document Queue
1. Move PDF generation to queue
2. Store generated PDFs
3. Notify user on completion

### Phase 4: Full Migration
1. Move all identified operations
2. Add monitoring/dashboard
3. Set up alerting

## Decision
Implement BullMQ with Redis for background job processing.

## Consequences
- Faster API response times
- Better reliability with retries
- Need Redis infrastructure
- Need worker processes

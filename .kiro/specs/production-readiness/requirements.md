# 🎯 Production Readiness - Requirements

## Mục tiêu
Đưa hệ thống ANH THỢ XÂY lên production với độ ổn định và bảo mật cao.

## Phạm vi
- API App (Hono backend)
- Admin App (React dashboard)
- Landing App (React public website)
- Portal App (React user portal)

## Yêu cầu chức năng

### FR-1: Database Migration
- **FR-1.1:** Migrate từ SQLite sang PostgreSQL
- **FR-1.2:** Đảm bảo data integrity trong quá trình migration
- **FR-1.3:** Setup connection pooling
- **FR-1.4:** Verify tất cả indexes đã được tạo

### FR-2: Security Hardening
- **FR-2.1:** Fix tất cả XSS vulnerabilities (9 files với dangerouslySetInnerHTML)
- **FR-2.2:** Remove tất cả console.log/warn/error trong production code
- **FR-2.3:** Add environment validation tại startup
- **FR-2.4:** Add CSP và HSTS headers

### FR-3: Caching & Rate Limiting
- **FR-3.1:** Setup Redis cho rate limiting
- **FR-3.2:** Migrate in-memory rate limiter sang Redis
- **FR-3.3:** Implement response caching cho static data
- **FR-3.4:** Setup session storage với Redis

### FR-4: Code Refactoring
- **FR-4.1:** Refactor furniture-product.service.ts (1,212 lines → <300 lines/file)
- **FR-4.2:** Refactor admin/api/furniture.ts (1,070 lines → <300 lines/file)
- **FR-4.3:** Refactor QuotationResult.tsx (1,052 lines → <300 lines/file)

### FR-5: Monitoring & Observability
- **FR-5.1:** Setup health check endpoints
- **FR-5.2:** Add response time monitoring
- **FR-5.3:** Setup error tracking
- **FR-5.4:** Add structured logging

## Yêu cầu phi chức năng

### NFR-1: Performance
- API response time < 200ms (p95)
- Database query time < 50ms
- Page load time < 3s

### NFR-2: Scalability
- Support 1000+ concurrent users
- Horizontal scaling capability
- No single point of failure

### NFR-3: Security
- Security score > 80/100
- No critical vulnerabilities
- All inputs validated

### NFR-4: Reliability
- Uptime > 99.9%
- Graceful degradation
- Automated backups

## Constraints
- Không thay đổi business logic
- Backward compatible với existing data
- Minimal downtime during migration

## Dependencies
- PostgreSQL database server
- Redis server
- Domain và SSL certificates

## Timeline
- Phase 1 (Week 1): Security fixes
- Phase 2 (Week 2-3): Database + Redis
- Phase 3 (Week 4): Refactoring
- Phase 4 (Week 5): Testing + Monitoring

## Success Criteria
- [ ] Tất cả tests pass
- [ ] Security scan pass
- [ ] Performance benchmarks met
- [ ] Zero critical issues
- [ ] Documentation complete

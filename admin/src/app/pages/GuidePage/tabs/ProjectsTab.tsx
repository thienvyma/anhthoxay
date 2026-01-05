/**
 * ProjectsTab - Projects Management Guide
 *
 * Provides project lifecycle diagram, approval/rejection guide,
 * bid management, and escrow/fee management instructions.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 5.1, 5.2, 5.3, 5.4**
 */

import { tokens } from '../../../../theme';
import {
  Section,
  Heading1,
  Heading2,
  Paragraph,
  List,
  ListItem,
  InfoBox,
  WarningBox,
  Step,
  Card,
  Grid,
} from '../components';

export function ProjectsTab() {
  return (
    <div>
      {/* Introduction */}
      <Section>
        <Heading1 icon="ri-building-line">Quản lý Công trình</Heading1>
        <Paragraph>
          Công trình là các dự án xây dựng/sửa chữa do chủ nhà đăng lên hệ thống.
          Admin có thể duyệt, từ chối công trình và quản lý quá trình đấu thầu.
        </Paragraph>
        <InfoBox title="Tính năng đang phát triển">
          Tính năng quản lý công trình và đấu thầu đang trong giai đoạn phát triển.
          Một số chức năng có thể chưa khả dụng.
        </InfoBox>
      </Section>

      {/* Project Lifecycle */}
      <Section>
        <Heading1 icon="ri-flow-chart">Vòng đời công trình</Heading1>
        <Paragraph>
          Mỗi công trình trải qua các giai đoạn sau:
        </Paragraph>

        {/* Lifecycle Diagram */}
        <div
          style={{
            padding: 24,
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            marginBottom: 24,
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 800, flexWrap: 'nowrap' }}>
            {/* DRAFT */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${tokens.color.muted}20`,
                  border: `1px solid ${tokens.color.muted}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.muted,
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                NHÁP
              </div>
            </div>
            <i className="ri-arrow-right-line" style={{ color: tokens.color.muted, flexShrink: 0 }} />
            
            {/* PENDING_APPROVAL */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${tokens.color.warning}20`,
                  border: `1px solid ${tokens.color.warning}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.warning,
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                CHỜ DUYỆT
              </div>
            </div>
            <i className="ri-arrow-right-line" style={{ color: tokens.color.muted, flexShrink: 0 }} />
            
            {/* OPEN */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${tokens.color.success}20`,
                  border: `1px solid ${tokens.color.success}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.success,
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                ĐANG MỞ
              </div>
            </div>
            <i className="ri-arrow-right-line" style={{ color: tokens.color.muted, flexShrink: 0 }} />
            
            {/* BIDDING_CLOSED */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${tokens.color.info}20`,
                  border: `1px solid ${tokens.color.info}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.info,
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                ĐÓNG ĐẤU THẦU
              </div>
            </div>
            <i className="ri-arrow-right-line" style={{ color: tokens.color.muted, flexShrink: 0 }} />
            
            {/* MATCHED */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${tokens.color.primary}20`,
                  border: `1px solid ${tokens.color.primary}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.primary,
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                ĐÃ GHÉP
              </div>
            </div>
            <i className="ri-arrow-right-line" style={{ color: tokens.color.muted, flexShrink: 0 }} />
            
            {/* IN_PROGRESS */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${tokens.color.accent}20`,
                  border: `1px solid ${tokens.color.accent}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.accent,
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                ĐANG THI CÔNG
              </div>
            </div>
            <i className="ri-arrow-right-line" style={{ color: tokens.color.muted, flexShrink: 0 }} />
            
            {/* COMPLETED */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: `${tokens.color.success}20`,
                  border: `1px solid ${tokens.color.success}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.success,
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                HOÀN THÀNH
              </div>
            </div>
          </div>
        </div>

        <Grid columns={2} gap={16}>
          <Card icon="ri-draft-line" title="Nháp (DRAFT)">
            Chủ nhà đang soạn thảo, chưa gửi duyệt.
          </Card>
          <Card icon="ri-time-line" title="Chờ duyệt (PENDING_APPROVAL)">
            Đã gửi, đang chờ Admin duyệt.
          </Card>
          <Card icon="ri-door-open-line" title="Đang mở (OPEN)">
            Đã duyệt, nhà thầu có thể gửi báo giá.
          </Card>
          <Card icon="ri-auction-line" title="Đóng đấu thầu (BIDDING_CLOSED)">
            Hết hạn hoặc đủ số lượng báo giá.
          </Card>
          <Card icon="ri-link" title="Đã ghép (MATCHED)">
            Chủ nhà đã chọn nhà thầu.
          </Card>
          <Card icon="ri-hammer-line" title="Đang thi công (IN_PROGRESS)">
            Công trình đang được thực hiện.
          </Card>
        </Grid>
      </Section>

      {/* Approval/Rejection */}
      <Section>
        <Heading1 icon="ri-checkbox-circle-line">Duyệt/Từ chối công trình</Heading1>
        
        <Heading2 icon="ri-check-double-line">Duyệt công trình</Heading2>
        <Step number={1} title="Xem danh sách chờ duyệt">
          Vào trang "Công trình", lọc theo trạng thái "Chờ duyệt".
        </Step>
        <Step number={2} title="Kiểm tra thông tin">
          Click vào công trình để xem chi tiết: tiêu đề, mô tả, địa chỉ, ngân sách, hình ảnh.
        </Step>
        <Step number={3} title="Duyệt">
          Click nút <strong>"Duyệt"</strong>. Công trình sẽ chuyển sang trạng thái "Đang mở" và hiển thị cho nhà thầu.
        </Step>

        <Heading2 icon="ri-close-circle-line">Từ chối công trình</Heading2>
        <Step number={1} title="Xem chi tiết công trình">
          Mở công trình cần từ chối.
        </Step>
        <Step number={2} title="Click Từ chối">
          Click nút <strong>"Từ chối"</strong>.
        </Step>
        <Step number={3} title="Nhập lý do">
          Nhập lý do từ chối để chủ nhà biết cần sửa gì. Lý do này sẽ được gửi cho chủ nhà.
        </Step>

        <InfoBox title="Lưu ý">
          Chủ nhà có thể sửa và gửi lại công trình bị từ chối. Hãy ghi rõ lý do để họ biết cần điều chỉnh gì.
        </InfoBox>
      </Section>

      {/* Bid Management */}
      <Section>
        <Heading1 icon="ri-file-list-3-line">Quản lý báo giá (Bids)</Heading1>
        <Paragraph>
          Khi công trình ở trạng thái "Đang mở", nhà thầu có thể gửi báo giá. Admin cần duyệt báo giá trước khi chủ nhà xem được.
        </Paragraph>

        <Heading2 icon="ri-check-line">Duyệt báo giá</Heading2>
        <List ordered>
          <ListItem>Vào trang "Báo giá" hoặc xem trong chi tiết công trình</ListItem>
          <ListItem>Kiểm tra thông tin: giá đề xuất, timeline, mô tả chi tiết</ListItem>
          <ListItem>Kiểm tra hồ sơ nhà thầu: kinh nghiệm, đánh giá, chứng chỉ</ListItem>
          <ListItem>Click "Duyệt" nếu hợp lệ hoặc "Từ chối" nếu không phù hợp</ListItem>
        </List>

        <WarningBox title="Quan trọng">
          Chỉ báo giá đã duyệt mới hiển thị cho chủ nhà. Thông tin nhà thầu sẽ bị ẩn cho đến khi chủ nhà chọn.
        </WarningBox>
      </Section>

      {/* Escrow and Fee */}
      <Section>
        <Heading1 icon="ri-money-dollar-circle-line">Quản lý Escrow và Phí</Heading1>
        
        <Heading2 icon="ri-safe-2-line">Escrow (Tiền đặt cọc)</Heading2>
        <Paragraph>
          Khi chủ nhà chọn nhà thầu, hệ thống tạo escrow để bảo vệ cả hai bên.
        </Paragraph>
        <List>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Xác nhận đặt cọc:</strong> Khi chủ nhà đã chuyển tiền, Admin xác nhận để escrow chuyển sang "Đang giữ"
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Giải phóng:</strong> Khi công trình hoàn thành, Admin giải phóng tiền cho nhà thầu
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Hoàn tiền:</strong> Nếu có vấn đề, Admin có thể hoàn tiền cho chủ nhà
          </ListItem>
        </List>

        <Heading2 icon="ri-percent-line">Phí dịch vụ</Heading2>
        <Paragraph>
          Nhà thầu thắng thầu phải trả phí dịch vụ cho hệ thống.
        </Paragraph>
        <List>
          <ListItem icon="ri-checkbox-circle-line">
            Xem danh sách phí trong trang "Phí giao dịch"
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            Đánh dấu "Đã thanh toán" khi nhà thầu đã trả phí
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            Hủy phí nếu match bị hủy
          </ListItem>
        </List>
      </Section>
    </div>
  );
}

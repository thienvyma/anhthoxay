/**
 * ContractorsTab - Contractors Management Guide
 *
 * Provides verification workflow, document checklist,
 * approval/rejection guide, and ranking system explanation.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 6.1, 6.2, 6.3, 6.4**
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

export function ContractorsTab() {
  return (
    <div>
      {/* Introduction */}
      <Section>
        <Heading1 icon="ri-user-star-line">Quản lý Nhà thầu</Heading1>
        <Paragraph>
          Nhà thầu là các đơn vị/cá nhân đăng ký tham gia đấu thầu trên hệ thống.
          Admin cần xác minh hồ sơ trước khi nhà thầu có thể gửi báo giá cho công trình.
        </Paragraph>
        <InfoBox title="Tính năng đang phát triển">
          Tính năng quản lý nhà thầu đang trong giai đoạn phát triển.
          Một số chức năng có thể chưa khả dụng.
        </InfoBox>
      </Section>

      {/* Verification Workflow */}
      <Section>
        <Heading1 icon="ri-flow-chart">Quy trình xác minh</Heading1>
        
        {/* Workflow Diagram */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* PENDING */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                padding: '12px 20px',
                background: `${tokens.color.warning}20`,
                border: `1px solid ${tokens.color.warning}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.warning,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              CHỜ XÁC MINH
            </div>
            <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 8 }}>
              Nhà thầu mới đăng ký
            </div>
          </div>
          
          <i className="ri-arrow-right-line" style={{ color: tokens.color.muted, fontSize: 24 }} />
          
          {/* Decision */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '12px 20px',
                  background: `${tokens.color.success}20`,
                  border: `1px solid ${tokens.color.success}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.success,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                ĐÃ XÁC MINH
              </div>
              <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 8 }}>
                Có thể tham gia đấu thầu
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  padding: '12px 20px',
                  background: `${tokens.color.error}20`,
                  border: `1px solid ${tokens.color.error}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.color.error,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                TỪ CHỐI
              </div>
              <div style={{ fontSize: 12, color: tokens.color.muted, marginTop: 8 }}>
                Có thể gửi lại hồ sơ
              </div>
            </div>
          </div>
        </div>

        <Paragraph>
          Khi nhà thầu đăng ký và gửi hồ sơ xác minh, Admin cần kiểm tra và quyết định duyệt hoặc từ chối.
          Nhà thầu bị từ chối có thể cập nhật hồ sơ và gửi lại.
        </Paragraph>
      </Section>

      {/* Document Checklist */}
      <Section>
        <Heading1 icon="ri-file-list-line">Danh sách tài liệu cần kiểm tra</Heading1>
        <Paragraph>
          Khi xác minh nhà thầu, hãy kiểm tra các tài liệu sau:
        </Paragraph>

        <Grid columns={2} gap={16}>
          <Card icon="ri-id-card-line" title="CMND/CCCD">
            <List>
              <ListItem>Ảnh mặt trước và mặt sau rõ ràng</ListItem>
              <ListItem>Thông tin khớp với đăng ký</ListItem>
              <ListItem>Còn hạn sử dụng</ListItem>
            </List>
          </Card>
          <Card icon="ri-file-text-line" title="Giấy phép kinh doanh">
            <List>
              <ListItem>Đúng ngành nghề xây dựng</ListItem>
              <ListItem>Còn hiệu lực</ListItem>
              <ListItem>Thông tin công ty chính xác</ListItem>
            </List>
          </Card>
          <Card icon="ri-award-line" title="Chứng chỉ nghề">
            <List>
              <ListItem>Chứng chỉ hành nghề xây dựng</ListItem>
              <ListItem>Chứng chỉ an toàn lao động</ListItem>
              <ListItem>Các chứng chỉ chuyên môn khác</ListItem>
            </List>
          </Card>
          <Card icon="ri-image-line" title="Portfolio">
            <List>
              <ListItem>Hình ảnh công trình đã thực hiện</ListItem>
              <ListItem>Chất lượng hình ảnh tốt</ListItem>
              <ListItem>Mô tả công trình rõ ràng</ListItem>
            </List>
          </Card>
        </Grid>

        <WarningBox title="Lưu ý quan trọng">
          Kiểm tra kỹ tính xác thực của tài liệu. Tài liệu giả mạo có thể gây hại cho chủ nhà và uy tín hệ thống.
        </WarningBox>
      </Section>

      {/* Approval/Rejection */}
      <Section>
        <Heading1 icon="ri-checkbox-circle-line">Duyệt/Từ chối nhà thầu</Heading1>
        
        <Heading2 icon="ri-check-double-line">Duyệt nhà thầu</Heading2>
        <Step number={1} title="Xem danh sách chờ xác minh">
          Vào trang "Nhà thầu", lọc theo trạng thái "Chờ xác minh".
        </Step>
        <Step number={2} title="Kiểm tra hồ sơ">
          Click vào nhà thầu để xem chi tiết: thông tin cá nhân, kinh nghiệm, tài liệu đính kèm.
        </Step>
        <Step number={3} title="Xác minh tài liệu">
          Kiểm tra từng tài liệu theo checklist ở trên.
        </Step>
        <Step number={4} title="Duyệt">
          Nếu hồ sơ hợp lệ, click <strong>"Duyệt"</strong>. Nhà thầu sẽ được thông báo và có thể bắt đầu gửi báo giá.
        </Step>

        <Heading2 icon="ri-close-circle-line">Từ chối nhà thầu</Heading2>
        <Step number={1} title="Xem hồ sơ">
          Mở hồ sơ nhà thầu cần từ chối.
        </Step>
        <Step number={2} title="Click Từ chối">
          Click nút <strong>"Từ chối"</strong>.
        </Step>
        <Step number={3} title="Nhập lý do chi tiết">
          Ghi rõ lý do từ chối và những gì cần bổ sung/sửa đổi. Ví dụ:
          <List>
            <ListItem>"Ảnh CMND không rõ, vui lòng chụp lại"</ListItem>
            <ListItem>"Giấy phép kinh doanh đã hết hạn"</ListItem>
            <ListItem>"Cần bổ sung chứng chỉ hành nghề"</ListItem>
          </List>
        </Step>

        <InfoBox title="Mẹo">
          Ghi lý do từ chối càng chi tiết càng tốt để nhà thầu biết cần làm gì để được duyệt.
        </InfoBox>
      </Section>

      {/* Ranking System */}
      <Section>
        <Heading1 icon="ri-trophy-line">Hệ thống xếp hạng</Heading1>
        <Paragraph>
          Nhà thầu được xếp hạng dựa trên nhiều tiêu chí để giúp chủ nhà lựa chọn dễ dàng hơn.
        </Paragraph>

        <Heading2 icon="ri-calculator-line">Công thức tính điểm</Heading2>
        <Grid columns={2} gap={16}>
          <Card icon="ri-star-line" title="Điểm đánh giá (40%)">
            Trung bình đánh giá từ chủ nhà sau khi hoàn thành công trình.
          </Card>
          <Card icon="ri-building-line" title="Số công trình (30%)">
            Số lượng công trình đã hoàn thành thành công.
          </Card>
          <Card icon="ri-timer-line" title="Tốc độ phản hồi (15%)">
            Thời gian trung bình phản hồi tin nhắn và báo giá.
          </Card>
          <Card icon="ri-verified-badge-line" title="Xác minh (15%)">
            Mức độ hoàn thiện hồ sơ và chứng chỉ.
          </Card>
        </Grid>

        <Heading2 icon="ri-medal-line">Huy hiệu đặc biệt</Heading2>
        <List>
          <ListItem icon="ri-fire-line">
            <strong>Hoạt động tích cực:</strong> Gửi ≥5 báo giá trong 30 ngày
          </ListItem>
          <ListItem icon="ri-award-line">
            <strong>Chất lượng cao:</strong> Đánh giá ≥4.5 sao với ≥5 reviews
          </ListItem>
          <ListItem icon="ri-flashlight-line">
            <strong>Phản hồi nhanh:</strong> Thời gian phản hồi trung bình ≤24 giờ
          </ListItem>
        </List>

        <InfoBox title="Nhà thầu nổi bật">
          Admin có thể đánh dấu nhà thầu là "Nổi bật" để hiển thị ưu tiên trên trang chủ.
          Chỉ nên chọn những nhà thầu có hồ sơ tốt và đánh giá cao.
        </InfoBox>
      </Section>
    </div>
  );
}

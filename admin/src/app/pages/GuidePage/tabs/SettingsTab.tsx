/**
 * SettingsTab - Settings Management Guide
 *
 * Provides explanations for bidding settings, service fees management,
 * region management, and notification templates.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 7.1, 7.2, 7.3, 7.4**
 */

import {
  Section,
  Heading1,
  Heading2,
  Paragraph,
  List,
  ListItem,
  InfoBox,
  WarningBox,
  Card,
  Grid,
} from '../components';

export function SettingsTab() {
  return (
    <div>
      {/* Introduction */}
      <Section>
        <Heading1 icon="ri-settings-3-line">Cài đặt hệ thống</Heading1>
        <Paragraph>
          Trang cài đặt cho phép Admin cấu hình các thông số quan trọng của hệ thống
          bao gồm đấu thầu, phí dịch vụ, khu vực và mẫu thông báo.
        </Paragraph>
        <InfoBox title="Chỉ Admin">
          Chỉ tài khoản Admin mới có quyền truy cập và thay đổi cài đặt hệ thống.
        </InfoBox>
      </Section>

      {/* Bidding Settings */}
      <Section>
        <Heading1 icon="ri-auction-line">Cài đặt đấu thầu</Heading1>
        <Paragraph>
          Cấu hình các thông số liên quan đến quy trình đấu thầu công trình.
        </Paragraph>

        <Grid columns={2} gap={16}>
          <Card icon="ri-file-list-3-line" title="Số báo giá tối đa">
            Giới hạn số lượng báo giá mỗi công trình có thể nhận. Mặc định: 20.
          </Card>
          <Card icon="ri-calendar-line" title="Thời hạn đấu thầu">
            Số ngày mặc định để nhận báo giá. Có thể cấu hình min/max.
          </Card>
          <Card icon="ri-percent-line" title="Tỷ lệ đặt cọc">
            Phần trăm giá trị công trình cần đặt cọc. Mặc định: 10%.
          </Card>
          <Card icon="ri-money-dollar-circle-line" title="Đặt cọc tối thiểu/tối đa">
            Giới hạn số tiền đặt cọc để bảo vệ cả hai bên.
          </Card>
        </Grid>

        <Heading2 icon="ri-edit-line">Cách thay đổi cài đặt</Heading2>
        <List ordered>
          <ListItem>Vào <strong>Settings → Cài đặt chung</strong></ListItem>
          <ListItem>Chọn tab <strong>"Đấu thầu"</strong></ListItem>
          <ListItem>Điều chỉnh các thông số theo nhu cầu</ListItem>
          <ListItem>Click <strong>"Lưu"</strong> để áp dụng</ListItem>
        </List>

        <WarningBox title="Cẩn thận">
          Thay đổi cài đặt đấu thầu sẽ ảnh hưởng đến tất cả công trình mới.
          Công trình đang diễn ra sẽ giữ nguyên cài đặt cũ.
        </WarningBox>
      </Section>

      {/* Service Fees */}
      <Section>
        <Heading1 icon="ri-money-dollar-box-line">Quản lý phí dịch vụ</Heading1>
        <Paragraph>
          Cấu hình các loại phí mà nhà thầu phải trả khi sử dụng hệ thống.
        </Paragraph>

        <Grid columns={2} gap={16}>
          <Card icon="ri-verified-badge-line" title="Phí xác minh">
            Phí một lần khi nhà thầu đăng ký xác minh hồ sơ. Mặc định: 500,000 VNĐ.
          </Card>
          <Card icon="ri-trophy-line" title="Phí thắng thầu">
            Phần trăm giá trị hợp đồng khi nhà thầu được chọn. Mặc định: 5%.
          </Card>
        </Grid>

        <Heading2 icon="ri-add-line">Thêm/Sửa phí dịch vụ</Heading2>
        <List ordered>
          <ListItem>Vào <strong>Settings → Cài đặt chung</strong></ListItem>
          <ListItem>Chọn tab <strong>"Phí dịch vụ"</strong></ListItem>
          <ListItem>Click <strong>"Thêm phí"</strong> hoặc chọn phí cần sửa</ListItem>
          <ListItem>Điền thông tin: Tên, Mã, Loại (Cố định/Phần trăm), Giá trị</ListItem>
          <ListItem>Click <strong>"Lưu"</strong></ListItem>
        </List>

        <InfoBox title="Loại phí">
          <List>
            <ListItem><strong>Cố định (FIXED):</strong> Số tiền cố định, ví dụ: 500,000 VNĐ</ListItem>
            <ListItem><strong>Phần trăm (PERCENTAGE):</strong> Tính theo % giá trị, ví dụ: 5%</ListItem>
          </List>
        </InfoBox>
      </Section>

      {/* Region Management */}
      <Section>
        <Heading1 icon="ri-map-pin-line">Quản lý khu vực</Heading1>
        <Paragraph>
          Cấu hình danh sách khu vực (tỉnh/thành, quận/huyện, phường/xã) để nhà thầu và chủ nhà chọn.
        </Paragraph>

        <Heading2 icon="ri-organization-chart">Cấu trúc phân cấp</Heading2>
        <List>
          <ListItem icon="ri-map-2-line">
            <strong>Cấp 1:</strong> Tỉnh/Thành phố (ví dụ: TP. Hồ Chí Minh, Hà Nội)
          </ListItem>
          <ListItem icon="ri-map-pin-2-line">
            <strong>Cấp 2:</strong> Quận/Huyện (ví dụ: Quận 1, Bình Thạnh)
          </ListItem>
          <ListItem icon="ri-map-pin-line">
            <strong>Cấp 3:</strong> Phường/Xã (ví dụ: Phường Bến Nghé)
          </ListItem>
        </List>

        <Heading2 icon="ri-add-circle-line">Thêm khu vực mới</Heading2>
        <List ordered>
          <ListItem>Vào trang <strong>"Khu vực"</strong> từ sidebar</ListItem>
          <ListItem>Click <strong>"Thêm khu vực"</strong></ListItem>
          <ListItem>Chọn cấp và khu vực cha (nếu có)</ListItem>
          <ListItem>Nhập tên và slug (URL thân thiện)</ListItem>
          <ListItem>Click <strong>"Lưu"</strong></ListItem>
        </List>

        <InfoBox title="Slug">
          Slug là phiên bản URL-friendly của tên, ví dụ: "Quận 1" → "quan-1".
          Hệ thống sẽ tự động tạo slug từ tên nếu bạn không nhập.
        </InfoBox>
      </Section>

      {/* Notification Templates */}
      <Section>
        <Heading1 icon="ri-notification-3-line">Mẫu thông báo</Heading1>
        <Paragraph>
          Quản lý nội dung các thông báo tự động gửi cho người dùng qua email, SMS và trong app.
        </Paragraph>

        <Heading2 icon="ri-file-list-2-line">Các loại mẫu thông báo</Heading2>
        <Grid columns={2} gap={16}>
          <Card icon="ri-mail-send-line" title="Báo giá mới">
            Gửi cho chủ nhà khi có nhà thầu gửi báo giá.
          </Card>
          <Card icon="ri-checkbox-circle-line" title="Báo giá được duyệt">
            Gửi cho nhà thầu khi báo giá được Admin duyệt.
          </Card>
          <Card icon="ri-link" title="Ghép thành công">
            Gửi cho cả hai bên khi chủ nhà chọn nhà thầu.
          </Card>
          <Card icon="ri-money-dollar-circle-line" title="Escrow">
            Thông báo về trạng thái tiền đặt cọc.
          </Card>
        </Grid>

        <Heading2 icon="ri-edit-line">Chỉnh sửa mẫu thông báo</Heading2>
        <List ordered>
          <ListItem>Vào trang <strong>"Mẫu thông báo"</strong> từ sidebar</ListItem>
          <ListItem>Chọn mẫu cần chỉnh sửa</ListItem>
          <ListItem>Sửa nội dung cho từng kênh: Email, SMS, In-app</ListItem>
          <ListItem>Sử dụng biến động như <code>{'{{projectCode}}'}</code>, <code>{'{{contractorName}}'}</code></ListItem>
          <ListItem>Click <strong>"Lưu"</strong></ListItem>
        </List>

        <InfoBox title="Biến động">
          Biến động sẽ được thay thế bằng giá trị thực khi gửi thông báo.
          Ví dụ: <code>{'{{projectCode}}'}</code> → "PRJ-2024-001"
        </InfoBox>

        <WarningBox title="Lưu ý SMS">
          Nội dung SMS bị giới hạn 160 ký tự. Hãy viết ngắn gọn và súc tích.
        </WarningBox>
      </Section>
    </div>
  );
}

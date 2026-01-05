/**
 * LeadsTab - Leads Management Guide
 *
 * Provides step-by-step instructions for leads management,
 * status workflow explanation, and export guide.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 3.1, 3.2, 3.3, 3.4**
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

export function LeadsTab() {
  return (
    <div>
      {/* Introduction */}
      <Section>
        <Heading1 icon="ri-contacts-book-line">Quản lý Khách hàng (Leads)</Heading1>
        <Paragraph>
          Leads là thông tin khách hàng tiềm năng đã gửi yêu cầu báo giá hoặc liên hệ qua website.
          Tại đây bạn có thể xem, lọc, cập nhật trạng thái và xuất danh sách leads.
        </Paragraph>
      </Section>

      {/* Viewing and Filtering */}
      <Section>
        <Heading2 icon="ri-search-line">Xem và lọc danh sách</Heading2>
        <Step number={1} title="Truy cập trang Leads">
          Từ sidebar, click vào <strong>"Khách hàng"</strong> để mở trang quản lý leads.
        </Step>
        <Step number={2} title="Sử dụng bộ lọc">
          Sử dụng các bộ lọc ở đầu trang để tìm kiếm:
          <List>
            <ListItem>Tìm theo tên, số điện thoại hoặc email</ListItem>
            <ListItem>Lọc theo trạng thái (Mới, Đã liên hệ, Đã chuyển đổi, Đã hủy)</ListItem>
            <ListItem>Lọc theo nguồn (Form báo giá, Form liên hệ)</ListItem>
            <ListItem>Lọc theo khoảng thời gian</ListItem>
          </List>
        </Step>
        <Step number={3} title="Xem chi tiết">
          Click vào một lead để xem thông tin chi tiết bao gồm nội dung yêu cầu và lịch sử ghi chú.
        </Step>
      </Section>

      {/* Status Workflow */}
      <Section>
        <Heading1 icon="ri-flow-chart">Quy trình trạng thái Lead</Heading1>
        <Paragraph>
          Mỗi lead có một trạng thái thể hiện tiến độ xử lý. Dưới đây là quy trình chuyển đổi trạng thái:
        </Paragraph>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 24,
            background: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          {/* NEW */}
          <div
            style={{
              padding: '8px 16px',
              background: `${tokens.color.info}20`,
              border: `1px solid ${tokens.color.info}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.info,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            MỚI
          </div>
          <i className="ri-arrow-right-line" style={{ color: tokens.color.muted }} />
          {/* CONTACTED */}
          <div
            style={{
              padding: '8px 16px',
              background: `${tokens.color.warning}20`,
              border: `1px solid ${tokens.color.warning}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.warning,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ĐÃ LIÊN HỆ
          </div>
          <i className="ri-arrow-right-line" style={{ color: tokens.color.muted }} />
          {/* Final states */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                padding: '8px 16px',
                background: `${tokens.color.success}20`,
                border: `1px solid ${tokens.color.success}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.success,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              ĐÃ CHUYỂN ĐỔI
            </div>
            <div
              style={{
                padding: '8px 16px',
                background: `${tokens.color.error}20`,
                border: `1px solid ${tokens.color.error}`,
                borderRadius: tokens.radius.md,
                color: tokens.color.error,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              ĐÃ HỦY
            </div>
          </div>
        </div>

        <Grid columns={2} gap={16}>
          <Card icon="ri-add-circle-line" title="MỚI (NEW)">
            Lead vừa được tạo, chưa có ai liên hệ. Đây là trạng thái mặc định khi khách hàng gửi form.
          </Card>
          <Card icon="ri-phone-line" title="ĐÃ LIÊN HỆ (CONTACTED)">
            Đã liên hệ với khách hàng nhưng chưa có kết quả cuối cùng.
          </Card>
          <Card icon="ri-checkbox-circle-line" title="ĐÃ CHUYỂN ĐỔI (CONVERTED)">
            Khách hàng đã đồng ý sử dụng dịch vụ hoặc trở thành khách hàng thực sự.
          </Card>
          <Card icon="ri-close-circle-line" title="ĐÃ HỦY (CANCELLED)">
            Khách hàng không có nhu cầu hoặc không thể liên hệ được.
          </Card>
        </Grid>
      </Section>

      {/* Updating Status */}
      <Section>
        <Heading2 icon="ri-edit-line">Cập nhật trạng thái và ghi chú</Heading2>
        <Step number={1} title="Mở chi tiết lead">
          Click vào lead cần cập nhật để mở panel chi tiết.
        </Step>
        <Step number={2} title="Thay đổi trạng thái">
          Chọn trạng thái mới từ dropdown "Trạng thái". Hệ thống sẽ tự động lưu thay đổi.
        </Step>
        <Step number={3} title="Thêm ghi chú">
          Nhập ghi chú vào ô "Ghi chú" để lưu lại thông tin quan trọng về cuộc gọi hoặc trao đổi với khách hàng.
        </Step>

        <InfoBox title="Mẹo">
          Luôn ghi chú lại nội dung cuộc gọi và thời gian hẹn gọi lại (nếu có) để theo dõi dễ dàng hơn.
        </InfoBox>
      </Section>

      {/* Export */}
      <Section>
        <Heading1 icon="ri-download-line">Xuất danh sách ra CSV</Heading1>
        <Paragraph>
          Bạn có thể xuất danh sách leads ra file CSV để phân tích hoặc báo cáo.
        </Paragraph>
        <Step number={1} title="Áp dụng bộ lọc (tùy chọn)">
          Nếu chỉ muốn xuất một phần leads, hãy áp dụng bộ lọc trước.
        </Step>
        <Step number={2} title="Click nút Export">
          Click vào nút <strong>"Xuất CSV"</strong> ở góc phải trên của trang.
        </Step>
        <Step number={3} title="Tải file">
          File CSV sẽ được tải về máy tính của bạn với tên dạng <code>leads_YYYY-MM-DD.csv</code>.
        </Step>

        <WarningBox title="Lưu ý bảo mật">
          File CSV chứa thông tin cá nhân của khách hàng. Hãy bảo quản cẩn thận và không chia sẻ
          cho người không có thẩm quyền.
        </WarningBox>
      </Section>
    </div>
  );
}

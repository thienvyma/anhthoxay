/**
 * OverviewTab - System Overview Guide
 *
 * Provides welcome message, main features overview, navigation guide,
 * role explanations, and quick links to common features.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 2.1, 2.2, 2.3, 2.4**
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
  Card,
  Grid,
  QuickLink,
} from '../components';

export function OverviewTab() {
  return (
    <div>
      {/* Welcome Section */}
      <Section>
        <div
          style={{
            padding: 24,
            background: `${tokens.color.primary}15`,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.primary}30`,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <i className="ri-hand-heart-line" style={{ fontSize: 28, color: tokens.color.primary }} />
            <h2 style={{ fontSize: 22, fontWeight: 600, color: tokens.color.text, margin: 0 }}>
              Chào mừng đến với Admin Panel!
            </h2>
          </div>
          <Paragraph style={{ margin: 0 }}>
            Đây là trung tâm quản lý hệ thống Nội Thất Nhanh. Tại đây, bạn có thể quản lý nội dung website,
            khách hàng, nhà thầu, công trình và nhiều tính năng khác. Hãy khám phá các tab bên trên để
            tìm hiểu chi tiết về từng tính năng.
          </Paragraph>
        </div>
      </Section>

      {/* Main Features */}
      <Section>
        <Heading1 icon="ri-apps-2-line">Các tính năng chính</Heading1>
        <Grid columns={2} gap={16}>
          <Card icon="ri-dashboard-3-line" title="Dashboard">
            Xem tổng quan về hoạt động hệ thống, thống kê leads, công trình và nhà thầu.
          </Card>
          <Card icon="ri-pages-line" title="Pages & Sections">
            Quản lý nội dung các trang trên website, chỉnh sửa sections và layout.
          </Card>
          <Card icon="ri-gallery-line" title="Media Library">
            Upload và quản lý hình ảnh, video sử dụng trên website.
          </Card>
          <Card icon="ri-quill-pen-line" title="Blog Manager">
            Tạo và quản lý bài viết blog, danh mục và bình luận.
          </Card>
          <Card icon="ri-contacts-book-line" title="Khách hàng (Leads)">
            Quản lý thông tin khách hàng tiềm năng, theo dõi trạng thái và xuất báo cáo.
          </Card>
          <Card icon="ri-user-settings-line" title="Quản lý tài khoản">
            Tạo và quản lý tài khoản người dùng trong hệ thống.
          </Card>
        </Grid>
      </Section>

      {/* Navigation Guide */}
      <Section>
        <Heading1 icon="ri-compass-3-line">Hướng dẫn điều hướng</Heading1>
        <Paragraph>
          Sidebar bên trái chứa menu điều hướng đến các tính năng. Trên mobile, nhấn vào icon menu
          ở góc trái để mở sidebar.
        </Paragraph>
        <List>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Dashboard:</strong> Trang tổng quan, hiển thị khi đăng nhập
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Pages & Sections:</strong> Quản lý nội dung website
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Media Library:</strong> Quản lý hình ảnh và media
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Blog Manager:</strong> Quản lý bài viết blog
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Khách hàng:</strong> Quản lý leads và khách hàng
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            <strong>Settings:</strong> Cài đặt hệ thống và API Keys
          </ListItem>
        </List>
      </Section>

      {/* Role Explanation */}
      <Section>
        <Heading1 icon="ri-shield-user-line">Phân quyền người dùng</Heading1>
        <Paragraph>
          Hệ thống có 2 vai trò chính với quyền hạn khác nhau:
        </Paragraph>

        <Heading2 icon="ri-admin-line">Admin (Quản trị viên)</Heading2>
        <List>
          <ListItem icon="ri-check-line">Toàn quyền truy cập tất cả tính năng</ListItem>
          <ListItem icon="ri-check-line">Quản lý tài khoản người dùng</ListItem>
          <ListItem icon="ri-check-line">Duyệt/từ chối nhà thầu</ListItem>
          <ListItem icon="ri-check-line">Cấu hình hệ thống và API Keys</ListItem>
          <ListItem icon="ri-check-line">Quản lý phí dịch vụ và cài đặt đấu thầu</ListItem>
        </List>

        <Heading2 icon="ri-user-star-line">Manager (Quản lý)</Heading2>
        <List>
          <ListItem icon="ri-check-line">Quản lý khách hàng (Leads)</ListItem>
          <ListItem icon="ri-check-line">Quản lý blog và bình luận</ListItem>
          <ListItem icon="ri-check-line">Quản lý media</ListItem>
          <ListItem icon="ri-close-line" style={{ color: tokens.color.error }}>
            Không thể quản lý tài khoản người dùng
          </ListItem>
          <ListItem icon="ri-close-line" style={{ color: tokens.color.error }}>
            Không thể duyệt nhà thầu
          </ListItem>
          <ListItem icon="ri-close-line" style={{ color: tokens.color.error }}>
            Không thể cấu hình hệ thống
          </ListItem>
        </List>

        <InfoBox title="Lưu ý về quyền hạn">
          Nếu bạn không thấy một số tính năng trong menu, có thể do tài khoản của bạn không có quyền
          truy cập. Liên hệ Admin để được cấp quyền nếu cần.
        </InfoBox>
      </Section>

      {/* Quick Links */}
      <Section>
        <Heading1 icon="ri-links-line">Truy cập nhanh</Heading1>
        <Grid columns={2} gap={12}>
          <QuickLink
            icon="ri-contacts-book-line"
            title="Xem danh sách Leads"
            description="Quản lý khách hàng tiềm năng"
            href="/leads"
          />
          <QuickLink
            icon="ri-quill-pen-line"
            title="Tạo bài viết mới"
            description="Viết và đăng bài blog"
            href="/blog-manager"
          />
          <QuickLink
            icon="ri-gallery-line"
            title="Upload hình ảnh"
            description="Thêm media vào thư viện"
            href="/media"
          />
          <QuickLink
            icon="ri-settings-3-line"
            title="Cài đặt hệ thống"
            description="Cấu hình website"
            href="/settings"
          />
        </Grid>
      </Section>
    </div>
  );
}

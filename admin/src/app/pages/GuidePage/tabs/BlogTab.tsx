/**
 * BlogTab - Blog Management Guide
 *
 * Provides instructions for creating/editing posts, category management,
 * image upload guide, and comment moderation.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 4.1, 4.2, 4.3, 4.4**
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
  Step,
  Card,
  Grid,
} from '../components';

export function BlogTab() {
  return (
    <div>
      {/* Introduction */}
      <Section>
        <Heading1 icon="ri-quill-pen-line">Quản lý Blog</Heading1>
        <Paragraph>
          Blog là nơi đăng tải các bài viết về xây dựng, tư vấn, kinh nghiệm và tin tức.
          Bạn có thể tạo, chỉnh sửa, xuất bản bài viết và quản lý bình luận từ độc giả.
        </Paragraph>
      </Section>

      {/* Creating Posts */}
      <Section>
        <Heading1 icon="ri-add-line">Tạo bài viết mới</Heading1>
        <Step number={1} title="Truy cập Blog Manager">
          Từ sidebar, click vào <strong>"Blog Manager"</strong> để mở trang quản lý blog.
        </Step>
        <Step number={2} title="Click nút Tạo bài viết">
          Click vào nút <strong>"Tạo bài viết"</strong> ở góc phải trên của trang.
        </Step>
        <Step number={3} title="Điền thông tin bài viết">
          <List>
            <ListItem><strong>Tiêu đề:</strong> Tiêu đề bài viết (sẽ hiển thị trên website)</ListItem>
            <ListItem><strong>Slug:</strong> URL thân thiện (tự động tạo từ tiêu đề)</ListItem>
            <ListItem><strong>Mô tả ngắn:</strong> Tóm tắt nội dung (hiển thị trong danh sách)</ListItem>
            <ListItem><strong>Nội dung:</strong> Nội dung chi tiết bài viết</ListItem>
            <ListItem><strong>Ảnh đại diện:</strong> Hình ảnh thumbnail</ListItem>
            <ListItem><strong>Danh mục:</strong> Chọn danh mục phù hợp</ListItem>
            <ListItem><strong>Tags:</strong> Thêm các từ khóa liên quan</ListItem>
          </List>
        </Step>
        <Step number={4} title="Lưu hoặc xuất bản">
          <List>
            <ListItem><strong>Lưu nháp:</strong> Lưu bài viết nhưng chưa hiển thị trên website</ListItem>
            <ListItem><strong>Xuất bản:</strong> Đăng bài viết lên website ngay lập tức</ListItem>
          </List>
        </Step>

        <InfoBox title="Mẹo viết bài">
          Sử dụng tiêu đề hấp dẫn, chia nội dung thành các đoạn ngắn, thêm hình ảnh minh họa
          để bài viết dễ đọc và thu hút hơn.
        </InfoBox>
      </Section>

      {/* Editing Posts */}
      <Section>
        <Heading2 icon="ri-edit-line">Chỉnh sửa bài viết</Heading2>
        <Paragraph>
          Để chỉnh sửa bài viết đã có:
        </Paragraph>
        <List ordered>
          <ListItem>Tìm bài viết trong danh sách</ListItem>
          <ListItem>Click vào nút <strong>"Sửa"</strong> hoặc click vào tiêu đề bài viết</ListItem>
          <ListItem>Thực hiện các thay đổi cần thiết</ListItem>
          <ListItem>Click <strong>"Lưu"</strong> để cập nhật</ListItem>
        </List>
      </Section>

      {/* Category Management */}
      <Section>
        <Heading1 icon="ri-folder-line">Quản lý danh mục và tags</Heading1>
        
        <Heading2 icon="ri-folder-add-line">Danh mục (Categories)</Heading2>
        <Paragraph>
          Danh mục giúp phân loại bài viết theo chủ đề. Mỗi bài viết thuộc một danh mục.
        </Paragraph>
        <List>
          <ListItem icon="ri-checkbox-circle-line">
            Xem danh sách danh mục trong tab "Danh mục"
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            Tạo danh mục mới bằng nút "Thêm danh mục"
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            Chỉnh sửa hoặc xóa danh mục hiện có
          </ListItem>
        </List>

        <Heading2 icon="ri-price-tag-3-line">Tags</Heading2>
        <Paragraph>
          Tags là các từ khóa giúp độc giả tìm kiếm bài viết liên quan. Mỗi bài viết có thể có nhiều tags.
        </Paragraph>
        <List>
          <ListItem icon="ri-checkbox-circle-line">
            Thêm tags khi tạo hoặc chỉnh sửa bài viết
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            Nhập tag và nhấn Enter để thêm
          </ListItem>
          <ListItem icon="ri-checkbox-circle-line">
            Click vào tag để xóa
          </ListItem>
        </List>
      </Section>

      {/* Image Upload */}
      <Section>
        <Heading1 icon="ri-image-line">Hướng dẫn upload hình ảnh</Heading1>
        <Step number={1} title="Chọn vị trí chèn ảnh">
          Trong editor nội dung, đặt con trỏ tại vị trí muốn chèn ảnh.
        </Step>
        <Step number={2} title="Click nút Upload">
          Click vào icon hình ảnh trên thanh công cụ hoặc kéo thả ảnh vào editor.
        </Step>
        <Step number={3} title="Chọn ảnh">
          <List>
            <ListItem><strong>Upload mới:</strong> Chọn ảnh từ máy tính</ListItem>
            <ListItem><strong>Media Library:</strong> Chọn ảnh đã upload trước đó</ListItem>
          </List>
        </Step>
        <Step number={4} title="Điều chỉnh">
          Sau khi chèn, bạn có thể điều chỉnh kích thước và căn lề của ảnh.
        </Step>

        <InfoBox title="Định dạng ảnh được hỗ trợ">
          JPG, PNG, WebP, GIF. Kích thước tối đa: 5MB. Khuyến nghị sử dụng WebP để tối ưu tốc độ tải trang.
        </InfoBox>
      </Section>

      {/* Comment Moderation */}
      <Section>
        <Heading1 icon="ri-chat-3-line">Quản lý bình luận</Heading1>
        <Paragraph>
          Bình luận từ độc giả cần được duyệt trước khi hiển thị trên website để tránh spam và nội dung không phù hợp.
        </Paragraph>

        <Grid columns={2} gap={16}>
          <Card icon="ri-time-line" title="Chờ duyệt">
            Bình luận mới gửi, chưa được kiểm tra. Cần Admin/Manager duyệt.
          </Card>
          <Card icon="ri-checkbox-circle-line" title="Đã duyệt">
            Bình luận đã được duyệt và hiển thị trên website.
          </Card>
          <Card icon="ri-spam-2-line" title="Spam">
            Bình luận bị đánh dấu là spam, không hiển thị.
          </Card>
          <Card icon="ri-delete-bin-line" title="Đã xóa">
            Bình luận đã bị xóa vĩnh viễn.
          </Card>
        </Grid>

        <Heading2 icon="ri-shield-check-line">Quy trình duyệt bình luận</Heading2>
        <Step number={1} title="Xem bình luận chờ duyệt">
          Vào tab "Bình luận" trong Blog Manager, lọc theo trạng thái "Chờ duyệt".
        </Step>
        <Step number={2} title="Kiểm tra nội dung">
          Đọc nội dung bình luận, kiểm tra xem có phù hợp không.
        </Step>
        <Step number={3} title="Thực hiện hành động">
          <List>
            <ListItem><strong>Duyệt:</strong> Cho phép hiển thị trên website</ListItem>
            <ListItem><strong>Đánh dấu spam:</strong> Ẩn và đánh dấu là spam</ListItem>
            <ListItem><strong>Xóa:</strong> Xóa vĩnh viễn bình luận</ListItem>
          </List>
        </Step>

        <WarningBox title="Lưu ý">
          Hãy duyệt bình luận thường xuyên để độc giả không phải chờ đợi quá lâu.
          Bình luận spam có thể ảnh hưởng đến uy tín website.
        </WarningBox>
      </Section>
    </div>
  );
}

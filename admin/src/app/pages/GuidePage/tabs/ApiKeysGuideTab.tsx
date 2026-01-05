/**
 * ApiKeysGuideTab - API Keys Usage Guide
 *
 * Provides simple explanation of API keys, step-by-step guide for creating
 * and using API keys, example use cases, and security tips.
 *
 * **Feature: admin-guide-api-keys**
 * **Requirements: 8.1, 8.2, 8.3, 8.4**
 */

import { tokens } from '../../../../theme';
import {
  Section,
  Heading1,
  Paragraph,
  List,
  ListItem,
  InfoBox,
  WarningBox,
  SuccessBox,
  Step,
  Card,
  Grid,
  CodeBlock,
  QuickLink,
} from '../components';

export function ApiKeysGuideTab() {
  return (
    <div>
      {/* Introduction */}
      <Section>
        <Heading1 icon="ri-key-2-line">API Keys là gì?</Heading1>
        <Paragraph>
          API Key giống như một "chìa khóa" đặc biệt cho phép các chương trình bên ngoài 
          (như ChatGPT, Claude, hoặc các bot tự động) có thể tương tác với hệ thống của bạn 
          một cách an toàn.
        </Paragraph>

        <div
          style={{
            padding: 24,
            background: `${tokens.color.primary}10`,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.color.primary}30`,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: tokens.radius.lg,
                background: tokens.color.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: tokens.color.text, marginBottom: 4 }}>
                Ví dụ thực tế
              </div>
              <div style={{ color: tokens.color.textMuted, fontSize: 14 }}>
                Bạn muốn ChatGPT tự động đọc danh sách khách hàng mới mỗi ngày
              </div>
            </div>
          </div>
          <List>
            <ListItem icon="ri-arrow-right-s-line">Tạo một API Key với quyền "Chỉ đọc" cho nhóm "Leads"</ListItem>
            <ListItem icon="ri-arrow-right-s-line">Cung cấp API Key cho ChatGPT</ListItem>
            <ListItem icon="ri-arrow-right-s-line">ChatGPT có thể tự động lấy danh sách leads mới</ListItem>
            <ListItem icon="ri-arrow-right-s-line">Khi không cần nữa, tắt hoặc xóa key để bảo mật</ListItem>
          </List>
        </div>
      </Section>

      {/* Step by Step Guide */}
      <Section>
        <Heading1 icon="ri-guide-line">Hướng dẫn tạo API Key</Heading1>
        
        <Step number={1} title="Truy cập trang API Keys">
          Từ sidebar, vào <strong>Settings → API Keys</strong> hoặc click vào link bên dưới.
        </Step>

        <QuickLink
          icon="ri-key-2-line"
          title="Mở trang API Keys"
          description="Quản lý API Keys của bạn"
          href="/settings/api-keys"
          style={{ marginBottom: 24 }}
        />

        <Step number={2} title="Click nút Tạo API Key">
          Click vào nút <strong>"Tạo API Key"</strong> màu vàng ở góc phải trên.
        </Step>

        <Step number={3} title="Điền thông tin">
          <List>
            <ListItem>
              <strong>Tên:</strong> Đặt tên dễ nhớ, ví dụ: "ChatGPT - Đọc Leads"
            </ListItem>
            <ListItem>
              <strong>Mô tả:</strong> Ghi chú mục đích sử dụng (tùy chọn)
            </ListItem>
            <ListItem>
              <strong>Quyền:</strong> Chọn mức quyền phù hợp
              <List>
                <ListItem>Chỉ đọc: Chỉ xem dữ liệu</ListItem>
                <ListItem>Đọc-Ghi: Xem và tạo/sửa dữ liệu</ListItem>
                <ListItem>Toàn quyền: Bao gồm cả xóa dữ liệu</ListItem>
              </List>
            </ListItem>
            <ListItem>
              <strong>Nhóm API:</strong> Chọn những API được phép truy cập
            </ListItem>
            <ListItem>
              <strong>Thời hạn:</strong> Chọn thời gian hết hạn (khuyến nghị có thời hạn)
            </ListItem>
          </List>
        </Step>

        <Step number={4} title="Lưu API Key">
          Click <strong>"Tạo"</strong>. Hệ thống sẽ hiển thị API Key đầy đủ.
        </Step>

        <WarningBox title="Quan trọng!" icon="ri-error-warning-line">
          API Key chỉ hiển thị MỘT LẦN DUY NHẤT sau khi tạo. Hãy copy và lưu lại ngay!
          Nếu mất, bạn phải tạo key mới.
        </WarningBox>

        <Step number={5} title="Sử dụng API Key">
          Cung cấp API Key cho ứng dụng cần tích hợp. Key sẽ được gửi trong header của mỗi request.
        </Step>
      </Section>

      {/* Example Use Cases */}
      <Section>
        <Heading1 icon="ri-lightbulb-line">Ví dụ sử dụng</Heading1>

        <Grid columns={1} gap={16}>
          <Card icon="ri-openai-fill" title="ChatGPT đọc Leads mới">
            <Paragraph style={{ margin: '8px 0' }}>
              Tạo key với quyền "Chỉ đọc" cho nhóm "Leads". ChatGPT có thể tự động kiểm tra 
              và thông báo khi có khách hàng mới.
            </Paragraph>
            <CodeBlock title="Cấu hình">
{`Tên: ChatGPT - Đọc Leads
Quyền: Chỉ đọc
Nhóm API: Leads
Thời hạn: 90 ngày`}
            </CodeBlock>
          </Card>

          <Card icon="ri-robot-line" title="Claude tạo bài Blog">
            <Paragraph style={{ margin: '8px 0' }}>
              Tạo key với quyền "Đọc-Ghi" cho nhóm "Blog". Claude có thể tự động tạo 
              bài viết dựa trên chủ đề bạn cung cấp.
            </Paragraph>
            <CodeBlock title="Cấu hình">
{`Tên: Claude - Tạo Blog
Quyền: Đọc-Ghi
Nhóm API: Blog
Thời hạn: 30 ngày`}
            </CodeBlock>
          </Card>

          <Card icon="ri-bar-chart-box-line" title="Bot báo cáo tự động">
            <Paragraph style={{ margin: '8px 0' }}>
              Tạo key với quyền "Chỉ đọc" cho nhóm "Báo cáo". Bot có thể tự động 
              lấy thống kê và gửi báo cáo hàng ngày.
            </Paragraph>
            <CodeBlock title="Cấu hình">
{`Tên: Bot Báo cáo
Quyền: Chỉ đọc
Nhóm API: Báo cáo
Thời hạn: 1 năm`}
            </CodeBlock>
          </Card>
        </Grid>
      </Section>

      {/* How to Use */}
      <Section>
        <Heading1 icon="ri-code-line">Cách sử dụng API Key</Heading1>
        <Paragraph>
          Khi gọi API, thêm API Key vào header <code>X-API-Key</code>:
        </Paragraph>

        <CodeBlock language="bash" title="Ví dụ với cURL">
{`curl -X GET "https://api.anhthoxay.com/api/external/leads" \\
  -H "X-API-Key: atx_abc123xyz789..."`}
        </CodeBlock>

        <CodeBlock language="javascript" title="Ví dụ với JavaScript">
{`const response = await fetch('https://api.anhthoxay.com/api/external/leads', {
  headers: {
    'X-API-Key': 'atx_abc123xyz789...'
  }
});
const data = await response.json();`}
        </CodeBlock>

        <InfoBox title="Endpoints có sẵn">
          <List>
            <ListItem><code>/api/external/leads</code> - Danh sách khách hàng</ListItem>
            <ListItem><code>/api/external/blog/posts</code> - Danh sách bài viết</ListItem>
            <ListItem><code>/api/external/projects</code> - Danh sách công trình</ListItem>
            <ListItem><code>/api/external/contractors</code> - Danh sách nhà thầu</ListItem>
            <ListItem><code>/api/external/reports/dashboard</code> - Thống kê tổng quan</ListItem>
            <ListItem><code>/api/external/health</code> - Kiểm tra kết nối</ListItem>
          </List>
        </InfoBox>
      </Section>

      {/* Security Tips */}
      <Section>
        <Heading1 icon="ri-shield-check-line">Mẹo bảo mật</Heading1>

        <Grid columns={2} gap={16}>
          <Card icon="ri-eye-off-line" title="Không chia sẻ API Key">
            API Key giống như mật khẩu. Không chia sẻ qua email, chat, hoặc lưu ở nơi công khai.
          </Card>
          <Card icon="ri-timer-line" title="Đặt thời hạn">
            Luôn đặt thời hạn cho API Key. Key không thời hạn có rủi ro bảo mật cao hơn.
          </Card>
          <Card icon="ri-lock-line" title="Quyền tối thiểu">
            Chỉ cấp quyền cần thiết. Nếu chỉ cần đọc, đừng cấp quyền ghi.
          </Card>
          <Card icon="ri-toggle-line" title="Tắt khi không dùng">
            Tắt API Key khi không sử dụng. Có thể bật lại bất cứ lúc nào.
          </Card>
        </Grid>

        <SuccessBox title="Thực hành tốt" icon="ri-thumb-up-line">
          <List>
            <ListItem>Tạo key riêng cho mỗi ứng dụng/mục đích</ListItem>
            <ListItem>Đặt tên rõ ràng để dễ quản lý</ListItem>
            <ListItem>Kiểm tra usage logs định kỳ</ListItem>
            <ListItem>Xóa key không còn sử dụng</ListItem>
            <ListItem>Đổi key mới nếu nghi ngờ bị lộ</ListItem>
          </List>
        </SuccessBox>

        <WarningBox title="Nếu API Key bị lộ">
          <List ordered>
            <ListItem>Vào trang API Keys ngay lập tức</ListItem>
            <ListItem>Tắt hoặc xóa key bị lộ</ListItem>
            <ListItem>Tạo key mới nếu cần tiếp tục sử dụng</ListItem>
            <ListItem>Kiểm tra usage logs xem có hoạt động bất thường không</ListItem>
          </List>
        </WarningBox>
      </Section>

      {/* Quick Access */}
      <Section>
        <Heading1 icon="ri-links-line">Truy cập nhanh</Heading1>
        <Grid columns={2} gap={12}>
          <QuickLink
            icon="ri-key-2-line"
            title="Quản lý API Keys"
            description="Tạo, sửa, xóa API Keys"
            href="/settings/api-keys"
          />
          <QuickLink
            icon="ri-settings-3-line"
            title="Cài đặt hệ thống"
            description="Cấu hình chung"
            href="/settings"
          />
        </Grid>
      </Section>
    </div>
  );
}

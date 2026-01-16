/**
 * Blog Posts Content Data
 * SEO-optimized blog posts for Anh Thợ Xây
 */

export interface BlogPostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  tags: string;
  imageKey: string;
  isFeatured: boolean;
}

export const blogPostsData: BlogPostData[] = [
  {
    title: '10 Bí Quyết Chọn Sơn Tường Bền Đẹp Cho Ngôi Nhà Của Bạn',
    slug: '10-bi-quyet-chon-son-tuong-ben-dep',
    excerpt: 'Hướng dẫn chi tiết cách chọn sơn tường phù hợp với từng không gian, đảm bảo độ bền và thẩm mỹ cao nhất.',
    categorySlug: 'meo-vat-xay-dung',
    tags: 'sơn tường, trang trí nhà, mẹo xây dựng, chọn sơn',
    imageKey: 'img1',
    isFeatured: true,
    content: `
<h2>Tại Sao Việc Chọn Sơn Tường Quan Trọng?</h2>
<p>Sơn tường không chỉ là lớp phủ bảo vệ mà còn quyết định thẩm mỹ và không khí của ngôi nhà. Một lựa chọn sơn phù hợp sẽ giúp không gian sống trở nên thoáng đãng, ấm cúng và bền đẹp theo thời gian.</p>

<h2>1. Xác Định Loại Sơn Phù Hợp</h2>
<p><strong>Sơn nước:</strong> Phổ biến nhất, dễ thi công, khô nhanh và ít mùi. Phù hợp cho hầu hết các không gian trong nhà.</p>
<p><strong>Sơn dầu:</strong> Độ bóng cao, chống thấm tốt nhưng có mùi và khô lâu hơn. Thường dùng cho cửa gỗ, sắt.</p>
<p><strong>Sơn chống thấm:</strong> Dành cho tường ngoài trời, khu vực ẩm ướt như nhà vệ sinh.</p>

<h2>2. Chọn Màu Sắc Theo Không Gian</h2>
<ul>
<li><strong>Phòng khách:</strong> Màu trung tính như trắng, be, xám nhạt tạo cảm giác rộng rãi</li>
<li><strong>Phòng ngủ:</strong> Màu pastel nhẹ nhàng như xanh mint, hồng phấn giúp thư giãn</li>
<li><strong>Nhà bếp:</strong> Màu sáng, dễ lau chùi như trắng, vàng nhạt</li>
<li><strong>Phòng trẻ em:</strong> Màu tươi sáng, kích thích sáng tạo</li>
</ul>

<h2>3. Kiểm Tra Chất Lượng Sơn</h2>
<p>Khi mua sơn, hãy chú ý:</p>
<ul>
<li>Thương hiệu uy tín: Dulux, Jotun, Nippon, TOA</li>
<li>Hạn sử dụng còn dài</li>
<li>Tem chống hàng giả</li>
<li>Độ phủ và độ bền theo thông số kỹ thuật</li>
</ul>

<h2>4. Tính Toán Lượng Sơn Cần Dùng</h2>
<p>Công thức: <strong>Diện tích tường × 2 lớp ÷ Độ phủ của sơn</strong></p>
<p>Ví dụ: Phòng 20m² tường, sơn có độ phủ 10m²/lít → Cần khoảng 4 lít sơn.</p>

<h2>5. Chuẩn Bị Bề Mặt Trước Khi Sơn</h2>
<p>Bề mặt tường cần được:</p>
<ul>
<li>Làm sạch bụi bẩn, dầu mỡ</li>
<li>Trám các vết nứt, lỗ hổng</li>
<li>Sơn lót để tăng độ bám dính</li>
<li>Để khô hoàn toàn trước khi sơn phủ</li>
</ul>

<h2>Kết Luận</h2>
<p>Chọn sơn tường đúng cách sẽ giúp ngôi nhà của bạn luôn đẹp và bền theo thời gian. Nếu cần tư vấn thêm, hãy liên hệ <strong>Anh Thợ Xây</strong> để được hỗ trợ miễn phí!</p>
    `.trim(),
  },

  {
    title: 'Xu Hướng Thiết Kế Nội Thất Phòng Khách 2026',
    slug: 'xu-huong-thiet-ke-noi-that-phong-khach-2026',
    excerpt: 'Khám phá những xu hướng thiết kế nội thất phòng khách hot nhất năm 2026, từ phong cách tối giản đến sang trọng.',
    categorySlug: 'noi-that-trang-tri',
    tags: 'nội thất, phòng khách, xu hướng 2026, thiết kế',
    imageKey: 'img2',
    isFeatured: true,
    content: `
<h2>Phòng Khách - Trái Tim Của Ngôi Nhà</h2>
<p>Phòng khách là không gian đầu tiên khách đến thăm nhìn thấy, cũng là nơi gia đình sum họp. Năm 2026, xu hướng thiết kế phòng khách tập trung vào sự thoải mái, bền vững và cá tính riêng.</p>

<h2>1. Phong Cách Tối Giản (Minimalism)</h2>
<p>Đặc điểm:</p>
<ul>
<li>Màu sắc trung tính: trắng, be, xám</li>
<li>Nội thất ít chi tiết, đường nét đơn giản</li>
<li>Không gian thoáng đãng, nhiều ánh sáng tự nhiên</li>
<li>Vật liệu tự nhiên: gỗ, đá, vải lanh</li>
</ul>

<h2>2. Phong Cách Japandi</h2>
<p>Sự kết hợp hoàn hảo giữa Nhật Bản và Scandinavian:</p>
<ul>
<li>Gỗ tự nhiên tông ấm</li>
<li>Cây xanh trong nhà</li>
<li>Đồ nội thất thấp, gần mặt đất</li>
<li>Ánh sáng mềm mại, ấm áp</li>
</ul>

<h2>3. Màu Sắc Xu Hướng 2026</h2>
<ul>
<li><strong>Sage Green:</strong> Xanh lá nhạt, mang lại cảm giác thư thái</li>
<li><strong>Warm Terracotta:</strong> Đất nung ấm áp, gần gũi thiên nhiên</li>
<li><strong>Soft Beige:</strong> Be nhạt thanh lịch, dễ phối hợp</li>
<li><strong>Deep Navy:</strong> Xanh navy đậm, tạo điểm nhấn sang trọng</li>
</ul>

<h2>4. Vật Liệu Bền Vững</h2>
<p>Xu hướng 2026 ưu tiên vật liệu thân thiện môi trường:</p>
<ul>
<li>Gỗ tái chế hoặc gỗ có chứng nhận FSC</li>
<li>Vải organic, cotton tự nhiên</li>
<li>Đá tự nhiên thay vì đá nhân tạo</li>
<li>Kim loại tái chế</li>
</ul>

<h2>5. Ánh Sáng Thông Minh</h2>
<p>Hệ thống chiếu sáng hiện đại:</p>
<ul>
<li>Đèn LED tiết kiệm điện</li>
<li>Điều khiển qua smartphone</li>
<li>Thay đổi màu sắc theo tâm trạng</li>
<li>Kết hợp ánh sáng tự nhiên và nhân tạo</li>
</ul>

<h2>Lời Khuyên Từ Chuyên Gia</h2>
<p>Hãy bắt đầu từ những thay đổi nhỏ: thêm cây xanh, đổi rèm cửa, hoặc sắp xếp lại đồ đạc. Liên hệ <strong>Anh Thợ Xây</strong> để được tư vấn thiết kế phòng khách phù hợp với ngân sách của bạn!</p>
    `.trim(),
  },
  {
    title: 'Quy Trình Thi Công Nhà Phố Từ A-Z Cho Người Mới',
    slug: 'quy-trinh-thi-cong-nha-pho-tu-a-z',
    excerpt: 'Tổng hợp đầy đủ các bước thi công nhà phố từ khâu chuẩn bị, móng, khung, đến hoàn thiện.',
    categorySlug: 'thi-cong-nha-o',
    tags: 'thi công, nhà phố, quy trình xây dựng, kinh nghiệm',
    imageKey: 'img3',
    isFeatured: true,
    content: `
<h2>Tổng Quan Quy Trình Xây Nhà Phố</h2>
<p>Xây nhà phố là một dự án lớn đòi hỏi sự chuẩn bị kỹ lưỡng. Bài viết này sẽ hướng dẫn bạn từng bước từ A đến Z.</p>

<h2>Giai Đoạn 1: Chuẩn Bị (2-4 tuần)</h2>
<h3>1.1. Xin Giấy Phép Xây Dựng</h3>
<ul>
<li>Hồ sơ thiết kế được duyệt</li>
<li>Giấy chứng nhận quyền sử dụng đất</li>
<li>Đơn xin phép xây dựng</li>
<li>Thời gian xử lý: 15-30 ngày</li>
</ul>

<h3>1.2. Chọn Nhà Thầu</h3>
<ul>
<li>So sánh ít nhất 3 báo giá</li>
<li>Kiểm tra công trình đã làm</li>
<li>Ký hợp đồng rõ ràng về tiến độ, thanh toán</li>
</ul>

<h2>Giai Đoạn 2: Phần Thô (8-12 tuần)</h2>
<h3>2.1. Móng Nhà</h3>
<p>Tùy theo địa chất, có thể chọn:</p>
<ul>
<li><strong>Móng đơn:</strong> Đất tốt, nhà 1-2 tầng</li>
<li><strong>Móng băng:</strong> Đất trung bình, nhà 2-4 tầng</li>
<li><strong>Móng cọc:</strong> Đất yếu, nhà cao tầng</li>
</ul>

<h3>2.2. Khung Kết Cấu</h3>
<ul>
<li>Đổ cột, dầm, sàn theo từng tầng</li>
<li>Thời gian chờ bê tông đạt cường độ: 28 ngày</li>
<li>Kiểm tra độ thẳng đứng, ngang bằng</li>
</ul>

<h3>2.3. Xây Tường</h3>
<ul>
<li>Gạch ống cho tường ngăn</li>
<li>Gạch đặc cho tường chịu lực</li>
<li>Chừa lỗ cho cửa, điện, nước</li>
</ul>

<h2>Giai Đoạn 3: Hoàn Thiện (6-10 tuần)</h2>
<h3>3.1. Hệ Thống Điện Nước</h3>
<ul>
<li>Đi dây điện âm tường</li>
<li>Lắp đặt ống nước, thoát nước</li>
<li>Test áp lực, kiểm tra rò rỉ</li>
</ul>

<h3>3.2. Trát Tường, Lát Gạch</h3>
<ul>
<li>Trát tường trong, ngoài</li>
<li>Lát gạch nền, ốp tường</li>
<li>Làm trần thạch cao (nếu có)</li>
</ul>

<h3>3.3. Sơn và Hoàn Thiện</h3>
<ul>
<li>Sơn lót + 2 lớp sơn phủ</li>
<li>Lắp cửa, thiết bị vệ sinh</li>
<li>Lắp đèn, công tắc, ổ cắm</li>
</ul>

<h2>Chi Phí Tham Khảo</h2>
<table>
<tr><th>Hạng mục</th><th>Đơn giá (VNĐ/m²)</th></tr>
<tr><td>Phần thô</td><td>3.5 - 4.5 triệu</td></tr>
<tr><td>Hoàn thiện cơ bản</td><td>5.5 - 7 triệu</td></tr>
<tr><td>Hoàn thiện cao cấp</td><td>8 - 12 triệu</td></tr>
</table>

<h2>Liên Hệ Tư Vấn</h2>
<p>Bạn đang có kế hoạch xây nhà? <strong>Anh Thợ Xây</strong> sẵn sàng tư vấn miễn phí và báo giá chi tiết cho công trình của bạn!</p>
    `.trim(),
  },

  {
    title: 'Cách Chọn Gạch Ốp Lát Phù Hợp Cho Từng Không Gian',
    slug: 'cach-chon-gach-op-lat-phu-hop',
    excerpt: 'Hướng dẫn chọn gạch ốp lát cho phòng khách, phòng ngủ, nhà bếp và nhà vệ sinh.',
    categorySlug: 'vat-lieu-xay-dung',
    tags: 'gạch ốp lát, vật liệu, trang trí, chọn gạch',
    imageKey: 'img4',
    isFeatured: false,
    content: `
<h2>Tầm Quan Trọng Của Việc Chọn Gạch</h2>
<p>Gạch ốp lát chiếm diện tích lớn trong ngôi nhà, ảnh hưởng trực tiếp đến thẩm mỹ và độ bền. Chọn đúng loại gạch sẽ giúp tiết kiệm chi phí bảo trì lâu dài.</p>

<h2>Các Loại Gạch Phổ Biến</h2>
<h3>1. Gạch Ceramic</h3>
<ul>
<li>Giá thành: 100.000 - 300.000 VNĐ/m²</li>
<li>Ưu điểm: Đa dạng mẫu mã, giá rẻ</li>
<li>Nhược điểm: Độ cứng trung bình, dễ trầy</li>
<li>Phù hợp: Phòng ngủ, phòng khách</li>
</ul>

<h3>2. Gạch Porcelain (Granite)</h3>
<ul>
<li>Giá thành: 200.000 - 500.000 VNĐ/m²</li>
<li>Ưu điểm: Độ cứng cao, chống thấm tốt</li>
<li>Nhược điểm: Giá cao hơn ceramic</li>
<li>Phù hợp: Sảnh, hành lang, nhà bếp</li>
</ul>

<h3>3. Gạch Men Bóng</h3>
<ul>
<li>Giá thành: 150.000 - 400.000 VNĐ/m²</li>
<li>Ưu điểm: Bề mặt sáng bóng, dễ lau chùi</li>
<li>Nhược điểm: Trơn khi ướt</li>
<li>Phù hợp: Phòng khách, phòng ăn</li>
</ul>

<h3>4. Gạch Chống Trơn</h3>
<ul>
<li>Giá thành: 180.000 - 350.000 VNĐ/m²</li>
<li>Ưu điểm: An toàn, không trơn trượt</li>
<li>Phù hợp: Nhà vệ sinh, ban công, sân vườn</li>
</ul>

<h2>Chọn Gạch Theo Không Gian</h2>
<h3>Phòng Khách</h3>
<ul>
<li>Kích thước: 60x60cm hoặc 80x80cm</li>
<li>Màu sắc: Sáng, trung tính</li>
<li>Loại: Porcelain hoặc men bóng</li>
</ul>

<h3>Phòng Ngủ</h3>
<ul>
<li>Kích thước: 40x40cm hoặc 60x60cm</li>
<li>Màu sắc: Ấm áp, nhẹ nhàng</li>
<li>Loại: Ceramic vân gỗ</li>
</ul>

<h3>Nhà Bếp</h3>
<ul>
<li>Kích thước: 30x60cm (ốp tường), 60x60cm (lát nền)</li>
<li>Màu sắc: Sáng, dễ nhìn thấy vết bẩn</li>
<li>Loại: Porcelain chống dầu mỡ</li>
</ul>

<h3>Nhà Vệ Sinh</h3>
<ul>
<li>Kích thước: 30x30cm hoặc 30x60cm</li>
<li>Màu sắc: Sáng, tạo cảm giác sạch sẽ</li>
<li>Loại: Gạch chống trơn bắt buộc</li>
</ul>

<h2>Mẹo Tính Lượng Gạch</h2>
<p>Công thức: <strong>Diện tích × 1.1</strong> (thêm 10% hao hụt)</p>
<p>Ví dụ: Phòng 20m² → Cần 22m² gạch</p>

<h2>Kết Luận</h2>
<p>Chọn gạch phù hợp sẽ giúp ngôi nhà đẹp và bền lâu. Liên hệ <strong>Anh Thợ Xây</strong> để được tư vấn và báo giá thi công ốp lát chuyên nghiệp!</p>
    `.trim(),
  },
  {
    title: '5 Phong Cách Kiến Trúc Nhà Ở Được Yêu Thích Nhất Việt Nam',
    slug: '5-phong-cach-kien-truc-nha-o-duoc-yeu-thich',
    excerpt: 'Tìm hiểu 5 phong cách kiến trúc nhà ở phổ biến: Hiện đại, Tân cổ điển, Địa Trung Hải, Nhật Bản và Scandinavian.',
    categorySlug: 'thiet-ke-kien-truc',
    tags: 'kiến trúc, phong cách, thiết kế nhà, xu hướng',
    imageKey: 'img5',
    isFeatured: false,
    content: `
<h2>Chọn Phong Cách Kiến Trúc Phù Hợp</h2>
<p>Phong cách kiến trúc không chỉ thể hiện gu thẩm mỹ mà còn phản ánh lối sống của gia chủ. Dưới đây là 5 phong cách được yêu thích nhất tại Việt Nam.</p>

<h2>1. Phong Cách Hiện Đại (Modern)</h2>
<h3>Đặc điểm nhận dạng:</h3>
<ul>
<li>Đường nét thẳng, hình khối đơn giản</li>
<li>Cửa kính lớn, tận dụng ánh sáng tự nhiên</li>
<li>Màu sắc trung tính: trắng, xám, đen</li>
<li>Vật liệu: kính, thép, bê tông trần</li>
</ul>
<p><strong>Phù hợp:</strong> Gia đình trẻ, người yêu thích sự tối giản</p>

<h2>2. Phong Cách Tân Cổ Điển (Neoclassical)</h2>
<h3>Đặc điểm nhận dạng:</h3>
<ul>
<li>Cột trụ, phào chỉ trang trí</li>
<li>Mái vòm, ban công sắt uốn</li>
<li>Màu sắc: trắng kem, vàng nhạt, nâu gỗ</li>
<li>Nội thất sang trọng, cầu kỳ</li>
</ul>
<p><strong>Phù hợp:</strong> Gia đình truyền thống, yêu thích sự sang trọng</p>

<h2>3. Phong Cách Địa Trung Hải (Mediterranean)</h2>
<h3>Đặc điểm nhận dạng:</h3>
<ul>
<li>Mái ngói đỏ/cam đặc trưng</li>
<li>Tường trắng hoặc màu đất</li>
<li>Cửa vòm, ban công sắt nghệ thuật</li>
<li>Sân vườn với cây xanh, đài phun nước</li>
</ul>
<p><strong>Phù hợp:</strong> Biệt thự, nhà vườn, khu nghỉ dưỡng</p>

<h2>4. Phong Cách Nhật Bản (Japanese)</h2>
<h3>Đặc điểm nhận dạng:</h3>
<ul>
<li>Không gian mở, linh hoạt</li>
<li>Vật liệu tự nhiên: gỗ, tre, đá</li>
<li>Ánh sáng mềm mại, gián tiếp</li>
<li>Vườn Zen, hồ cá Koi</li>
</ul>
<p><strong>Phù hợp:</strong> Người yêu thiên nhiên, tìm kiếm sự bình yên</p>

<h2>5. Phong Cách Scandinavian (Bắc Âu)</h2>
<h3>Đặc điểm nhận dạng:</h3>
<ul>
<li>Màu trắng chủ đạo, điểm nhấn pastel</li>
<li>Gỗ sáng màu (sồi, thông)</li>
<li>Nội thất đơn giản, tiện dụng</li>
<li>Cây xanh trong nhà</li>
</ul>
<p><strong>Phù hợp:</strong> Căn hộ, nhà phố diện tích nhỏ</p>

<h2>So Sánh Chi Phí</h2>
<table>
<tr><th>Phong cách</th><th>Chi phí (VNĐ/m²)</th></tr>
<tr><td>Hiện đại</td><td>6 - 10 triệu</td></tr>
<tr><td>Tân cổ điển</td><td>10 - 15 triệu</td></tr>
<tr><td>Địa Trung Hải</td><td>8 - 12 triệu</td></tr>
<tr><td>Nhật Bản</td><td>7 - 11 triệu</td></tr>
<tr><td>Scandinavian</td><td>6 - 9 triệu</td></tr>
</table>

<h2>Tư Vấn Miễn Phí</h2>
<p>Bạn chưa biết chọn phong cách nào? <strong>Anh Thợ Xây</strong> sẽ giúp bạn tìm ra phong cách phù hợp nhất với sở thích và ngân sách!</p>
    `.trim(),
  },

  {
    title: 'Hỏi Đáp: Những Sai Lầm Thường Gặp Khi Xây Nhà Lần Đầu',
    slug: 'sai-lam-thuong-gap-khi-xay-nha-lan-dau',
    excerpt: 'Tổng hợp những sai lầm phổ biến và cách tránh khi xây nhà lần đầu, giúp bạn tiết kiệm thời gian và chi phí.',
    categorySlug: 'tu-van-hoi-dap',
    tags: 'xây nhà, sai lầm, kinh nghiệm, tư vấn',
    imageKey: 'img6',
    isFeatured: false,
    content: `
<h2>Xây Nhà Lần Đầu - Những Điều Cần Biết</h2>
<p>Xây nhà là quyết định lớn trong đời. Nhiều gia chủ lần đầu thường mắc những sai lầm đáng tiếc. Bài viết này sẽ giúp bạn tránh được những lỗi phổ biến nhất.</p>

<h2>Sai Lầm 1: Không Lập Ngân Sách Chi Tiết</h2>
<h3>Vấn đề:</h3>
<p>Nhiều người chỉ tính chi phí xây thô mà quên các khoản phát sinh như hoàn thiện, nội thất, giấy phép...</p>
<h3>Giải pháp:</h3>
<ul>
<li>Lập ngân sách chi tiết từng hạng mục</li>
<li>Dự phòng 15-20% cho phát sinh</li>
<li>Ưu tiên các hạng mục quan trọng trước</li>
</ul>

<h2>Sai Lầm 2: Chọn Nhà Thầu Giá Rẻ Nhất</h2>
<h3>Vấn đề:</h3>
<p>Giá rẻ thường đi kèm chất lượng kém, vật liệu không đảm bảo, thi công ẩu.</p>
<h3>Giải pháp:</h3>
<ul>
<li>So sánh ít nhất 3 báo giá</li>
<li>Kiểm tra công trình đã làm của nhà thầu</li>
<li>Đọc kỹ hợp đồng, đặc biệt phần vật liệu</li>
<li>Chọn nhà thầu có bảo hành rõ ràng</li>
</ul>

<h2>Sai Lầm 3: Thiết Kế Không Phù Hợp Thực Tế</h2>
<h3>Vấn đề:</h3>
<p>Thiết kế đẹp trên giấy nhưng không phù hợp với nhu cầu sử dụng thực tế.</p>
<h3>Giải pháp:</h3>
<ul>
<li>Liệt kê nhu cầu của từng thành viên</li>
<li>Tính toán số phòng, diện tích hợp lý</li>
<li>Dự trù cho tương lai (thêm thành viên, làm việc tại nhà...)</li>
</ul>

<h2>Sai Lầm 4: Bỏ Qua Hệ Thống Điện Nước</h2>
<h3>Vấn đề:</h3>
<p>Tiết kiệm chi phí điện nước dẫn đến hỏng hóc, sửa chữa tốn kém sau này.</p>
<h3>Giải pháp:</h3>
<ul>
<li>Dùng dây điện, ống nước chất lượng cao</li>
<li>Thiết kế đủ ổ cắm, công tắc</li>
<li>Lắp đặt bởi thợ có kinh nghiệm</li>
<li>Test kỹ trước khi đổ bê tông, trát tường</li>
</ul>

<h2>Sai Lầm 5: Không Giám Sát Công Trình</h2>
<h3>Vấn đề:</h3>
<p>Giao khoán hoàn toàn cho nhà thầu, không kiểm tra dẫn đến sai sót.</p>
<h3>Giải pháp:</h3>
<ul>
<li>Thường xuyên đến công trình kiểm tra</li>
<li>Chụp ảnh tiến độ hàng tuần</li>
<li>Thuê giám sát độc lập nếu cần</li>
<li>Nghiệm thu từng giai đoạn trước khi thanh toán</li>
</ul>

<h2>Sai Lầm 6: Thay Đổi Thiết Kế Giữa Chừng</h2>
<h3>Vấn đề:</h3>
<p>Thay đổi khi đang thi công gây tốn kém, chậm tiến độ.</p>
<h3>Giải pháp:</h3>
<ul>
<li>Duyệt kỹ bản vẽ trước khi thi công</li>
<li>Hạn chế thay đổi sau khi đã khởi công</li>
<li>Nếu cần thay đổi, tính toán chi phí phát sinh</li>
</ul>

<h2>Kết Luận</h2>
<p>Xây nhà cần sự chuẩn bị kỹ lưỡng và kiên nhẫn. Nếu bạn cần tư vấn, <strong>Anh Thợ Xây</strong> luôn sẵn sàng hỗ trợ miễn phí!</p>
    `.trim(),
  },
  {
    title: 'Hướng Dẫn Chống Thấm Nhà Vệ Sinh Đúng Cách',
    slug: 'huong-dan-chong-tham-nha-ve-sinh-dung-cach',
    excerpt: 'Kỹ thuật chống thấm nhà vệ sinh hiệu quả, từ chọn vật liệu đến quy trình thi công chuẩn.',
    categorySlug: 'meo-vat-xay-dung',
    tags: 'chống thấm, nhà vệ sinh, kỹ thuật, vật liệu',
    imageKey: 'img7',
    isFeatured: false,
    content: `
<h2>Tại Sao Chống Thấm Nhà Vệ Sinh Quan Trọng?</h2>
<p>Nhà vệ sinh là khu vực tiếp xúc nước nhiều nhất. Nếu không chống thấm đúng cách, nước sẽ thấm xuống tầng dưới, gây ẩm mốc, bong tróc sơn và hư hại kết cấu.</p>

<h2>Các Loại Vật Liệu Chống Thấm</h2>
<h3>1. Sika (Thụy Sĩ)</h3>
<ul>
<li>Sika 101: Chống thấm gốc xi măng</li>
<li>Sika 107: Chống thấm 2 thành phần</li>
<li>Giá: 150.000 - 300.000 VNĐ/kg</li>
</ul>

<h3>2. Kova (Việt Nam)</h3>
<ul>
<li>Kova CT-11A: Chống thấm trong suốt</li>
<li>Kova CT-04: Chống thấm gốc bitum</li>
<li>Giá: 80.000 - 150.000 VNĐ/kg</li>
</ul>

<h3>3. Màng Chống Thấm</h3>
<ul>
<li>Màng khò nóng: Độ bền cao, thi công phức tạp</li>
<li>Màng tự dính: Dễ thi công, giá cao hơn</li>
<li>Giá: 50.000 - 100.000 VNĐ/m²</li>
</ul>

<h2>Quy Trình Chống Thấm Chuẩn</h2>
<h3>Bước 1: Chuẩn Bị Bề Mặt</h3>
<ul>
<li>Làm sạch bụi bẩn, dầu mỡ</li>
<li>Trám các vết nứt, lỗ hổng</li>
<li>Tưới nước làm ẩm bề mặt</li>
</ul>

<h3>Bước 2: Xử Lý Góc Tường</h3>
<ul>
<li>Bo tròn góc tường-sàn bằng vữa</li>
<li>Quét lớp chống thấm đặc biệt tại góc</li>
<li>Dán băng keo chống thấm (nếu cần)</li>
</ul>

<h3>Bước 3: Quét Lớp Chống Thấm</h3>
<ul>
<li>Quét lớp 1, chờ khô 4-6 tiếng</li>
<li>Quét lớp 2 vuông góc với lớp 1</li>
<li>Quét lên tường cao 20-30cm</li>
</ul>

<h3>Bước 4: Kiểm Tra</h3>
<ul>
<li>Đổ nước ngâm 24-48 tiếng</li>
<li>Kiểm tra tầng dưới có thấm không</li>
<li>Nếu thấm, xử lý lại vị trí đó</li>
</ul>

<h2>Những Lỗi Thường Gặp</h2>
<ul>
<li>Không xử lý góc tường kỹ</li>
<li>Quét quá mỏng hoặc không đều</li>
<li>Không chờ khô giữa các lớp</li>
<li>Bỏ qua vị trí ống thoát nước</li>
</ul>

<h2>Chi Phí Tham Khảo</h2>
<table>
<tr><th>Hạng mục</th><th>Đơn giá</th></tr>
<tr><td>Vật liệu chống thấm</td><td>50.000 - 100.000 VNĐ/m²</td></tr>
<tr><td>Nhân công</td><td>30.000 - 50.000 VNĐ/m²</td></tr>
<tr><td>Tổng cộng</td><td>80.000 - 150.000 VNĐ/m²</td></tr>
</table>

<h2>Liên Hệ Thi Công</h2>
<p>Cần thi công chống thấm chuyên nghiệp? <strong>Anh Thợ Xây</strong> cam kết bảo hành 5 năm cho công trình chống thấm!</p>
    `.trim(),
  },

  {
    title: 'Thiết Kế Phòng Ngủ Nhỏ Thông Minh Dưới 15m²',
    slug: 'thiet-ke-phong-ngu-nho-thong-minh',
    excerpt: 'Bí quyết thiết kế phòng ngủ nhỏ tối ưu không gian, vừa đẹp vừa tiện nghi cho căn hộ hiện đại.',
    categorySlug: 'noi-that-trang-tri',
    tags: 'phòng ngủ, thiết kế nhỏ, nội thất, căn hộ',
    imageKey: 'img8',
    isFeatured: false,
    content: `
<h2>Thách Thức Của Phòng Ngủ Nhỏ</h2>
<p>Với diện tích dưới 15m², việc bố trí phòng ngủ đầy đủ tiện nghi là thách thức lớn. Tuy nhiên, với những mẹo thiết kế thông minh, bạn hoàn toàn có thể tạo ra không gian nghỉ ngơi thoải mái.</p>

<h2>1. Chọn Giường Thông Minh</h2>
<h3>Giường có ngăn kéo:</h3>
<ul>
<li>Tận dụng không gian dưới giường</li>
<li>Lưu trữ chăn ga, quần áo</li>
<li>Giá: 5 - 15 triệu VNĐ</li>
</ul>

<h3>Giường gấp tường:</h3>
<ul>
<li>Gấp gọn khi không dùng</li>
<li>Giải phóng không gian ban ngày</li>
<li>Giá: 15 - 30 triệu VNĐ</li>
</ul>

<h2>2. Tủ Quần Áo Âm Tường</h2>
<ul>
<li>Không chiếm diện tích sàn</li>
<li>Cửa trượt thay vì cửa mở</li>
<li>Gương trên cửa tủ tạo cảm giác rộng</li>
<li>Tận dụng chiều cao đến trần</li>
</ul>

<h2>3. Màu Sắc Mở Rộng Không Gian</h2>
<ul>
<li><strong>Tường:</strong> Trắng, be nhạt, xám nhạt</li>
<li><strong>Trần:</strong> Trắng để tăng chiều cao</li>
<li><strong>Điểm nhấn:</strong> 1 bức tường màu pastel</li>
<li><strong>Tránh:</strong> Màu tối, họa tiết rối</li>
</ul>

<h2>4. Ánh Sáng Thông Minh</h2>
<ul>
<li>Đèn âm trần thay vì đèn chùm</li>
<li>Đèn đọc sách gắn tường</li>
<li>Rèm mỏng để ánh sáng tự nhiên vào</li>
<li>Gương phản chiếu ánh sáng</li>
</ul>

<h2>5. Nội Thất Đa Năng</h2>
<ul>
<li>Bàn làm việc gấp tường</li>
<li>Kệ đầu giường thay tủ đầu giường</li>
<li>Ghế có ngăn chứa đồ</li>
<li>Móc treo tường thay giá đỡ</li>
</ul>

<h2>6. Bố Trí Hợp Lý</h2>
<h3>Phòng 10m² (3x3.3m):</h3>
<ul>
<li>Giường 1m4 sát tường</li>
<li>Tủ âm tường đối diện</li>
<li>Bàn làm việc cạnh cửa sổ</li>
</ul>

<h3>Phòng 15m² (3x5m):</h3>
<ul>
<li>Giường 1m6 giữa phòng</li>
<li>Tủ quần áo 1 bên</li>
<li>Góc làm việc + kệ sách</li>
</ul>

<h2>Chi Phí Tham Khảo</h2>
<table>
<tr><th>Hạng mục</th><th>Chi phí</th></tr>
<tr><td>Giường + nệm</td><td>5 - 15 triệu</td></tr>
<tr><td>Tủ quần áo</td><td>8 - 20 triệu</td></tr>
<tr><td>Bàn làm việc</td><td>2 - 5 triệu</td></tr>
<tr><td>Đèn + rèm</td><td>2 - 5 triệu</td></tr>
<tr><td><strong>Tổng</strong></td><td><strong>17 - 45 triệu</strong></td></tr>
</table>

<h2>Tư Vấn Thiết Kế</h2>
<p>Bạn cần thiết kế phòng ngủ nhỏ? <strong>Anh Thợ Xây</strong> sẽ giúp bạn tối ưu từng cm² không gian!</p>
    `.trim(),
  },
  {
    title: 'So Sánh Xi Măng: PCB40 vs PC50 - Loại Nào Phù Hợp?',
    slug: 'so-sanh-xi-mang-pcb40-pc50',
    excerpt: 'Phân tích chi tiết sự khác biệt giữa xi măng PCB40 và PC50, giúp bạn chọn đúng loại cho công trình.',
    categorySlug: 'vat-lieu-xay-dung',
    tags: 'xi măng, vật liệu, xây dựng, so sánh',
    imageKey: 'img9',
    isFeatured: false,
    content: `
<h2>Xi Măng - Vật Liệu Nền Tảng</h2>
<p>Xi măng là thành phần không thể thiếu trong xây dựng. Việc chọn đúng loại xi măng sẽ đảm bảo chất lượng và tiết kiệm chi phí cho công trình.</p>

<h2>Xi Măng PCB40 (Portland Composite Blended)</h2>
<h3>Đặc điểm:</h3>
<ul>
<li>Cường độ nén: 40 N/mm² sau 28 ngày</li>
<li>Thành phần: Clinker + phụ gia khoáng</li>
<li>Tỏa nhiệt thấp khi đông kết</li>
<li>Giá: 85.000 - 95.000 VNĐ/bao 50kg</li>
</ul>

<h3>Ưu điểm:</h3>
<ul>
<li>Giá thành hợp lý</li>
<li>Ít nứt do co ngót</li>
<li>Phù hợp thời tiết nóng</li>
<li>Dễ thi công, dẻo</li>
</ul>

<h3>Ứng dụng:</h3>
<ul>
<li>Xây tường, trát tường</li>
<li>Đổ sàn, mái nhà dân dụng</li>
<li>Móng nhà 1-3 tầng</li>
<li>Công trình không yêu cầu cường độ cao</li>
</ul>

<h2>Xi Măng PC50 (Portland Cement)</h2>
<h3>Đặc điểm:</h3>
<ul>
<li>Cường độ nén: 50 N/mm² sau 28 ngày</li>
<li>Thành phần: Clinker nguyên chất</li>
<li>Đông kết nhanh, cường độ sớm cao</li>
<li>Giá: 100.000 - 120.000 VNĐ/bao 50kg</li>
</ul>

<h3>Ưu điểm:</h3>
<ul>
<li>Cường độ cao</li>
<li>Đạt cường độ nhanh</li>
<li>Chịu lực tốt</li>
<li>Độ bền cao</li>
</ul>

<h3>Ứng dụng:</h3>
<ul>
<li>Cột, dầm chịu lực</li>
<li>Móng nhà cao tầng</li>
<li>Bê tông dự ứng lực</li>
<li>Công trình cần tháo cốp pha sớm</li>
</ul>

<h2>Bảng So Sánh Chi Tiết</h2>
<table>
<tr><th>Tiêu chí</th><th>PCB40</th><th>PC50</th></tr>
<tr><td>Cường độ 28 ngày</td><td>40 N/mm²</td><td>50 N/mm²</td></tr>
<tr><td>Giá/bao 50kg</td><td>85-95k</td><td>100-120k</td></tr>
<tr><td>Tỏa nhiệt</td><td>Thấp</td><td>Cao</td></tr>
<tr><td>Thời gian đông kết</td><td>Chậm hơn</td><td>Nhanh hơn</td></tr>
<tr><td>Độ dẻo</td><td>Cao</td><td>Trung bình</td></tr>
</table>

<h2>Lời Khuyên Chọn Xi Măng</h2>
<ul>
<li><strong>Nhà dân dụng 1-3 tầng:</strong> PCB40 là đủ</li>
<li><strong>Nhà 4 tầng trở lên:</strong> PC50 cho cột, dầm</li>
<li><strong>Xây tường, trát:</strong> PCB40</li>
<li><strong>Móng cọc, đài móng:</strong> PC50</li>
</ul>

<h2>Thương Hiệu Uy Tín</h2>
<ul>
<li>Holcim (INSEE)</li>
<li>Hà Tiên</li>
<li>Nghi Sơn</li>
<li>Vicem</li>
</ul>

<h2>Tư Vấn Vật Liệu</h2>
<p>Cần tư vấn chọn xi măng cho công trình? <strong>Anh Thợ Xây</strong> sẽ giúp bạn tính toán và chọn loại phù hợp nhất!</p>
    `.trim(),
  },

  {
    title: 'Cải Tạo Nhà Cũ: Nên Sửa Hay Xây Mới?',
    slug: 'cai-tao-nha-cu-nen-sua-hay-xay-moi',
    excerpt: 'Phân tích chi phí và lợi ích giữa việc cải tạo nhà cũ và xây mới, giúp bạn đưa ra quyết định đúng đắn.',
    categorySlug: 'thi-cong-nha-o',
    tags: 'cải tạo, sửa nhà, xây mới, chi phí',
    imageKey: 'img10',
    isFeatured: false,
    content: `
<h2>Bài Toán Khó: Sửa Hay Xây Mới?</h2>
<p>Khi ngôi nhà đã cũ, nhiều gia đình phân vân giữa việc cải tạo hay đập đi xây mới. Bài viết này sẽ giúp bạn phân tích và đưa ra quyết định phù hợp.</p>

<h2>Khi Nào Nên Cải Tạo?</h2>
<h3>Điều kiện phù hợp:</h3>
<ul>
<li>Kết cấu móng, cột, dầm còn tốt</li>
<li>Nhà dưới 20 năm tuổi</li>
<li>Chỉ cần thay đổi công năng, thẩm mỹ</li>
<li>Ngân sách hạn chế</li>
<li>Không muốn di chuyển trong thời gian dài</li>
</ul>

<h3>Chi phí cải tạo:</h3>
<table>
<tr><th>Hạng mục</th><th>Đơn giá (VNĐ/m²)</th></tr>
<tr><td>Sửa chữa nhẹ (sơn, điện nước)</td><td>500k - 1 triệu</td></tr>
<tr><td>Cải tạo trung bình</td><td>2 - 4 triệu</td></tr>
<tr><td>Cải tạo toàn diện</td><td>4 - 6 triệu</td></tr>
</table>

<h2>Khi Nào Nên Xây Mới?</h2>
<h3>Điều kiện phù hợp:</h3>
<ul>
<li>Kết cấu đã xuống cấp nghiêm trọng</li>
<li>Nhà trên 30 năm tuổi</li>
<li>Muốn thay đổi hoàn toàn thiết kế</li>
<li>Cần tăng số tầng</li>
<li>Chi phí cải tạo > 60% chi phí xây mới</li>
</ul>

<h3>Chi phí xây mới:</h3>
<table>
<tr><th>Loại nhà</th><th>Đơn giá (VNĐ/m²)</th></tr>
<tr><td>Nhà cấp 4</td><td>3 - 4 triệu</td></tr>
<tr><td>Nhà phố cơ bản</td><td>5 - 7 triệu</td></tr>
<tr><td>Nhà phố cao cấp</td><td>8 - 12 triệu</td></tr>
</table>

<h2>So Sánh Chi Tiết</h2>
<table>
<tr><th>Tiêu chí</th><th>Cải tạo</th><th>Xây mới</th></tr>
<tr><td>Chi phí</td><td>Thấp hơn 30-50%</td><td>Cao hơn</td></tr>
<tr><td>Thời gian</td><td>1-3 tháng</td><td>6-12 tháng</td></tr>
<tr><td>Giấy phép</td><td>Đơn giản/không cần</td><td>Bắt buộc</td></tr>
<tr><td>Tuổi thọ</td><td>Thêm 10-20 năm</td><td>50+ năm</td></tr>
<tr><td>Thiết kế</td><td>Hạn chế</td><td>Tự do</td></tr>
</table>

<h2>Checklist Đánh Giá Nhà Cũ</h2>
<h3>Kiểm tra kết cấu:</h3>
<ul>
<li>☐ Móng có lún, nứt không?</li>
<li>☐ Cột, dầm có vết nứt lớn không?</li>
<li>☐ Tường có bị nghiêng không?</li>
<li>☐ Mái có bị dột, võng không?</li>
</ul>

<h3>Kiểm tra hệ thống:</h3>
<ul>
<li>☐ Điện có đủ tải không?</li>
<li>☐ Ống nước có bị rỉ không?</li>
<li>☐ Thoát nước có thông không?</li>
</ul>

<h2>Ví Dụ Thực Tế</h2>
<h3>Trường hợp 1: Nên cải tạo</h3>
<p>Nhà 15 năm tuổi, 80m², kết cấu tốt, chỉ muốn làm mới nội thất.</p>
<ul>
<li>Chi phí cải tạo: 80m² × 3 triệu = 240 triệu</li>
<li>Chi phí xây mới: 80m² × 6 triệu = 480 triệu</li>
<li><strong>Kết luận: Nên cải tạo, tiết kiệm 240 triệu</strong></li>
</ul>

<h3>Trường hợp 2: Nên xây mới</h3>
<p>Nhà 35 năm tuổi, 60m², móng lún, muốn xây 3 tầng.</p>
<ul>
<li>Chi phí cải tạo + gia cố: ~350 triệu</li>
<li>Chi phí xây mới 3 tầng: 180m² × 6 triệu = 1.08 tỷ</li>
<li><strong>Kết luận: Nên xây mới vì cải tạo không đáp ứng nhu cầu</strong></li>
</ul>

<h2>Tư Vấn Miễn Phí</h2>
<p>Bạn đang phân vân sửa hay xây mới? <strong>Anh Thợ Xây</strong> sẽ đến khảo sát và tư vấn miễn phí cho bạn!</p>
    `.trim(),
  },
  {
    title: 'Bảng Giá Nhân Công Xây Dựng Mới Nhất 2026',
    slug: 'bang-gia-nhan-cong-xay-dung-2026',
    excerpt: 'Cập nhật bảng giá nhân công xây dựng các hạng mục phổ biến năm 2026, giúp bạn dự toán chi phí chính xác.',
    categorySlug: 'tu-van-hoi-dap',
    tags: 'giá nhân công, xây dựng, báo giá, 2026',
    imageKey: 'img11',
    isFeatured: true,
    content: `
<h2>Tổng Quan Giá Nhân Công 2026</h2>
<p>Giá nhân công xây dựng năm 2026 có xu hướng tăng 10-15% so với năm trước do lạm phát và nhu cầu thị trường. Dưới đây là bảng giá tham khảo cho khu vực TP.HCM và các tỉnh lân cận.</p>

<h2>1. Phần Thô</h2>
<table>
<tr><th>Hạng mục</th><th>Đơn vị</th><th>Đơn giá (VNĐ)</th></tr>
<tr><td>Đào móng thủ công</td><td>m³</td><td>150.000 - 200.000</td></tr>
<tr><td>Đổ bê tông móng</td><td>m³</td><td>250.000 - 350.000</td></tr>
<tr><td>Xây tường gạch</td><td>m²</td><td>80.000 - 120.000</td></tr>
<tr><td>Đổ bê tông cột, dầm</td><td>m³</td><td>300.000 - 400.000</td></tr>
<tr><td>Đổ bê tông sàn</td><td>m²</td><td>80.000 - 100.000</td></tr>
<tr><td>Lợp mái tôn</td><td>m²</td><td>50.000 - 80.000</td></tr>
<tr><td>Lợp mái ngói</td><td>m²</td><td>100.000 - 150.000</td></tr>
</table>

<h2>2. Phần Hoàn Thiện</h2>
<table>
<tr><th>Hạng mục</th><th>Đơn vị</th><th>Đơn giá (VNĐ)</th></tr>
<tr><td>Trát tường</td><td>m²</td><td>40.000 - 60.000</td></tr>
<tr><td>Sơn tường (2 lớp)</td><td>m²</td><td>25.000 - 35.000</td></tr>
<tr><td>Lát gạch nền</td><td>m²</td><td>60.000 - 100.000</td></tr>
<tr><td>Ốp gạch tường</td><td>m²</td><td>80.000 - 120.000</td></tr>
<tr><td>Làm trần thạch cao</td><td>m²</td><td>80.000 - 120.000</td></tr>
<tr><td>Lắp cửa nhôm kính</td><td>m²</td><td>100.000 - 150.000</td></tr>
<tr><td>Lắp cửa gỗ</td><td>bộ</td><td>300.000 - 500.000</td></tr>
</table>

<h2>3. Điện Nước</h2>
<table>
<tr><th>Hạng mục</th><th>Đơn vị</th><th>Đơn giá (VNĐ)</th></tr>
<tr><td>Đi dây điện âm tường</td><td>điểm</td><td>80.000 - 120.000</td></tr>
<tr><td>Lắp ổ cắm, công tắc</td><td>điểm</td><td>30.000 - 50.000</td></tr>
<tr><td>Lắp đèn</td><td>bộ</td><td>50.000 - 100.000</td></tr>
<tr><td>Đi ống nước</td><td>m</td><td>30.000 - 50.000</td></tr>
<tr><td>Lắp thiết bị vệ sinh</td><td>bộ</td><td>200.000 - 400.000</td></tr>
<tr><td>Lắp bồn nước</td><td>bộ</td><td>300.000 - 500.000</td></tr>
</table>

<h2>4. Công Việc Khác</h2>
<table>
<tr><th>Hạng mục</th><th>Đơn vị</th><th>Đơn giá (VNĐ)</th></tr>
<tr><td>Chống thấm</td><td>m²</td><td>40.000 - 60.000</td></tr>
<tr><td>Sơn chống rỉ sắt</td><td>m²</td><td>30.000 - 50.000</td></tr>
<tr><td>Đánh bóng sàn</td><td>m²</td><td>30.000 - 50.000</td></tr>
<tr><td>Vệ sinh công trình</td><td>m²</td><td>10.000 - 20.000</td></tr>
</table>

<h2>Lưu Ý Quan Trọng</h2>
<ul>
<li>Giá trên chưa bao gồm vật liệu</li>
<li>Giá có thể thay đổi theo địa điểm, độ khó</li>
<li>Công trình xa trung tâm cộng thêm 10-20%</li>
<li>Công trình gấp cộng thêm 20-30%</li>
</ul>

<h2>Cách Tính Chi Phí Nhân Công</h2>
<p><strong>Ví dụ:</strong> Xây nhà 100m² sàn, 2 tầng</p>
<ul>
<li>Xây tường: 200m² × 100k = 20 triệu</li>
<li>Trát tường: 400m² × 50k = 20 triệu</li>
<li>Lát gạch: 200m² × 80k = 16 triệu</li>
<li>Sơn: 400m² × 30k = 12 triệu</li>
<li><strong>Tổng nhân công hoàn thiện: ~68 triệu</strong></li>
</ul>

<h2>Báo Giá Chi Tiết</h2>
<p>Cần báo giá chi tiết cho công trình của bạn? <strong>Anh Thợ Xây</strong> sẽ khảo sát và báo giá miễn phí trong 24h!</p>
    `.trim(),
  },
];

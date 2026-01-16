# Seed Blog Posts via API
# Usage: .\scripts\seed-blog-via-api.ps1 -Token "your-jwt-token"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$API_URL = "https://api.noithatnhanh.vn"

# Category mapping (slug -> id from production)
$CATEGORIES = @{
    "meo-vat-xay-dung" = "cmk4bc2mw000295ntrtjkgvoo"
    "noi-that-trang-tri" = "cmk4bc2lx000195ntr3sz6lnl"
    "thi-cong-nha-o" = "cmk4bc2jv000095nti1x8dvvl"
    "thiet-ke-kien-truc" = "cmk4bc2ow000495ntqr6utou7"
    "tu-van-hoi-dap" = "cmk4bc2pw000595ntv5buo3vl"
    "vat-lieu-xay-dung" = "cmk4bc2nx000395ntct52es3p"
}

# Image URLs
$IMAGES = @{
    "img1" = "https://storage.googleapis.com/ntn-media-bucket/0cac9ff5.jpg"
    "img2" = "https://storage.googleapis.com/ntn-media-bucket/11a720bb.jpg"
    "img3" = "https://storage.googleapis.com/ntn-media-bucket/15ed87ac.jpg"
    "img4" = "https://storage.googleapis.com/ntn-media-bucket/247ac475.jpg"
    "img5" = "https://storage.googleapis.com/ntn-media-bucket/322d2187.jpg"
    "img6" = "https://storage.googleapis.com/ntn-media-bucket/38c5ee01.jpg"
    "img7" = "https://storage.googleapis.com/ntn-media-bucket/585062cd.jpg"
    "img8" = "https://storage.googleapis.com/ntn-media-bucket/6c695dc3.jpg"
    "img9" = "https://storage.googleapis.com/ntn-media-bucket/c3132e28.jpg"
    "img10" = "https://storage.googleapis.com/ntn-media-bucket/c348fde9.jpg"
    "img11" = "https://storage.googleapis.com/ntn-media-bucket/c38a3d78.jpg"
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

# Blog posts data
$posts = @(
    @{
        title = "10 Bi Quyet Chon Son Tuong Ben Dep Cho Ngoi Nha Cua Ban"
        slug = "10-bi-quyet-chon-son-tuong-ben-dep"
        excerpt = "Huong dan chi tiet cach chon son tuong phu hop voi tung khong gian."
        categorySlug = "meo-vat-xay-dung"
        tags = "son tuong, trang tri nha, meo xay dung"
        imageKey = "img1"
        isFeatured = $true
        content = "<h2>Tai Sao Viec Chon Son Tuong Quan Trong?</h2><p>Son tuong khong chi la lop phu bao ve ma con quyet dinh tham my va khong khi cua ngoi nha.</p>"
    },
    @{
        title = "Xu Huong Thiet Ke Noi That Phong Khach 2026"
        slug = "xu-huong-thiet-ke-noi-that-phong-khach-2026"
        excerpt = "Kham pha nhung xu huong thiet ke noi that phong khach hot nhat nam 2026."
        categorySlug = "noi-that-trang-tri"
        tags = "noi that, phong khach, xu huong 2026"
        imageKey = "img2"
        isFeatured = $true
        content = "<h2>Phong Khach - Trai Tim Cua Ngoi Nha</h2><p>Phong khach la khong gian dau tien khach den tham nhin thay.</p>"
    },
    @{
        title = "Quy Trinh Thi Cong Nha Pho Tu A-Z"
        slug = "quy-trinh-thi-cong-nha-pho-tu-a-z"
        excerpt = "Tong hop day du cac buoc thi cong nha pho tu khau chuan bi den hoan thien."
        categorySlug = "thi-cong-nha-o"
        tags = "thi cong, nha pho, quy trinh xay dung"
        imageKey = "img3"
        isFeatured = $true
        content = "<h2>Tong Quan Quy Trinh Xay Nha Pho</h2><p>Xay nha pho la mot du an lon doi hoi su chuan bi ky luong.</p>"
    },
    @{
        title = "Cach Chon Gach Op Lat Phu Hop Cho Tung Khong Gian"
        slug = "cach-chon-gach-op-lat-phu-hop"
        excerpt = "Huong dan chon gach op lat cho phong khach, phong ngu, nha bep va nha ve sinh."
        categorySlug = "vat-lieu-xay-dung"
        tags = "gach op lat, vat lieu, trang tri"
        imageKey = "img4"
        isFeatured = $false
        content = "<h2>Tam Quan Trong Cua Viec Chon Gach</h2><p>Gach op lat chiem dien tich lon trong ngoi nha.</p>"
    },
    @{
        title = "5 Phong Cach Kien Truc Nha O Duoc Yeu Thich Nhat"
        slug = "5-phong-cach-kien-truc-nha-o-duoc-yeu-thich"
        excerpt = "Tim hieu 5 phong cach kien truc nha o pho bien: Hien dai, Tan co dien, Dia Trung Hai."
        categorySlug = "thiet-ke-kien-truc"
        tags = "kien truc, phong cach, thiet ke nha"
        imageKey = "img5"
        isFeatured = $false
        content = "<h2>Chon Phong Cach Kien Truc Phu Hop</h2><p>Phong cach kien truc khong chi the hien gu tham my.</p>"
    },
    @{
        title = "Hoi Dap: Nhung Sai Lam Thuong Gap Khi Xay Nha Lan Dau"
        slug = "sai-lam-thuong-gap-khi-xay-nha-lan-dau"
        excerpt = "Tong hop nhung sai lam pho bien va cach tranh khi xay nha lan dau."
        categorySlug = "tu-van-hoi-dap"
        tags = "xay nha, sai lam, kinh nghiem"
        imageKey = "img6"
        isFeatured = $false
        content = "<h2>Xay Nha Lan Dau - Nhung Dieu Can Biet</h2><p>Xay nha la quyet dinh lon trong doi.</p>"
    }
)

Write-Host "Starting blog seed..." -ForegroundColor Cyan

$created = 0
$failed = 0

foreach ($post in $posts) {
    $categoryId = $CATEGORIES[$post.categorySlug]
    $featuredImage = $IMAGES[$post.imageKey]
    
    $body = @{
        title = $post.title
        slug = $post.slug
        excerpt = $post.excerpt
        content = $post.content
        featuredImage = $featuredImage
        categoryId = $categoryId
        tags = $post.tags
        status = "PUBLISHED"
        isFeatured = $post.isFeatured
    } | ConvertTo-Json -Depth 3
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/blog/posts" -Method POST -Headers $headers -Body $body
        Write-Host "Created: $($post.title)" -ForegroundColor Green
        $created++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 409) {
            Write-Host "Skipped (exists): $($post.title)" -ForegroundColor Yellow
        } else {
            Write-Host "Failed: $($post.title) - $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host "`nDone! Created: $created, Failed: $failed" -ForegroundColor Cyan

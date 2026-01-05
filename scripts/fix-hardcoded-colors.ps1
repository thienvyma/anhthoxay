# Script to fix hardcoded colors in admin app
# Run from project root: .\scripts\fix-hardcoded-colors.ps1

$adminPath = "admin/src"

# Get all .tsx files
$files = Get-ChildItem -Path $adminPath -Recurse -Include "*.tsx"

# Exclusion patterns (files to skip)
$excludePatterns = @(
    "Preview.tsx",
    "type=`"color`"",
    "VisualBlockEditor.tsx"  # Has intentional color options
)

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false
    
    # Skip preview files
    if ($file.Name -match "Preview\.tsx$") {
        Write-Host "Skipping preview file: $($file.Name)" -ForegroundColor Yellow
        continue
    }
    
    # Replace rgba(255,255,255,0.02) -> tokens.color.surfaceAlt
    if ($content -match "rgba\(255,\s*255,\s*255,\s*0\.0[234]\)") {
        $content = $content -replace "rgba\(255,\s*255,\s*255,\s*0\.0[234]\)", "tokens.color.surfaceAlt"
        $modified = $true
    }
    
    # Replace rgba(255,255,255,0.05) and 0.06 -> tokens.color.surfaceHover
    if ($content -match "rgba\(255,\s*255,\s*255,\s*0\.0[56]\)") {
        $content = $content -replace "rgba\(255,\s*255,\s*255,\s*0\.0[56]\)", "tokens.color.surfaceHover"
        $modified = $true
    }
    
    # Replace rgba(255,255,255,0.08) and 0.1 -> tokens.color.border
    if ($content -match "rgba\(255,\s*255,\s*255,\s*0\.(08|1)\)") {
        $content = $content -replace "rgba\(255,\s*255,\s*255,\s*0\.(08|1)\)", "tokens.color.border"
        $modified = $true
    }
    
    # Replace rgba(0,0,0,0.5-0.8) for overlays -> tokens.color.overlay
    # Only for modal backgrounds, not shadows
    if ($content -match "background:\s*[`"']rgba\(0,\s*0,\s*0,\s*0\.[5678]\)[`"']") {
        $content = $content -replace "background:\s*[`"']rgba\(0,\s*0,\s*0,\s*0\.[5678]\)[`"']", "background: tokens.color.overlay"
        $modified = $true
    }
    
    # Replace #EF4444 / #ef4444 -> tokens.color.error (but not in color picker values)
    if ($content -match "'#[Ee][Ff]4444'" -and $content -notmatch "type=`"color`"") {
        $content = $content -replace "'#[Ee][Ff]4444'", "tokens.color.error"
        $modified = $true
    }
    
    # Replace #10B981 / #10b981 -> tokens.color.success
    if ($content -match "'#10[Bb]981'" -and $content -notmatch "type=`"color`"") {
        $content = $content -replace "'#10[Bb]981'", "tokens.color.success"
        $modified = $true
    }
    
    # Replace #22C55E / #22c55e -> tokens.color.success
    if ($content -match "'#22[Cc]55[Ee]'" -and $content -notmatch "type=`"color`"") {
        $content = $content -replace "'#22[Cc]55[Ee]'", "tokens.color.success"
        $modified = $true
    }
    
    # Replace #3B82F6 / #3b82f6 -> tokens.color.info
    if ($content -match "'#3[Bb]82[Ff]6'" -and $content -notmatch "type=`"color`"") {
        $content = $content -replace "'#3[Bb]82[Ff]6'", "tokens.color.info"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nDone! Run typecheck to verify." -ForegroundColor Cyan

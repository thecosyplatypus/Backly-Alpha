# Regenerate the native launcher and splash images from the project's source logo.
# Requires Windows PowerShell and System.Drawing; no third-party image tools needed.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'resources/icon.png'
$resPath = Join-Path $root 'android/app/src/main/res'
$source = [System.Drawing.Image]::FromFile($sourcePath)
$background = [System.Drawing.Color]::FromArgb(255, 10, 12, 18)

function Save-LogoImage {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [double]$LogoScale,
        [bool]$Transparent = $false
    )

    $bitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear($(if ($Transparent) { [System.Drawing.Color]::Transparent } else { $background }))
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $logoSize = [int]([Math]::Min($Width, $Height) * $LogoScale)
    $x = [int](($Width - $logoSize) / 2)
    $y = [int](($Height - $logoSize) / 2)
    $graphics.DrawImage($source, $x, $y, $logoSize, $logoSize)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

$densities = @{
    'mdpi' = 48
    'hdpi' = 72
    'xhdpi' = 96
    'xxhdpi' = 144
    'xxxhdpi' = 192
}

foreach ($density in $densities.GetEnumerator()) {
    $directory = Join-Path $resPath "mipmap-$($density.Key)"
    $legacySize = $density.Value
    $foregroundSize = $legacySize * 3
    Save-LogoImage -Path (Join-Path $directory 'ic_launcher.png') -Width $legacySize -Height $legacySize -LogoScale 1
    Save-LogoImage -Path (Join-Path $directory 'ic_launcher_round.png') -Width $legacySize -Height $legacySize -LogoScale 1
    # Adaptive icons reserve the outer area for Android's circular/squircle masks.
    Save-LogoImage -Path (Join-Path $directory 'ic_launcher_foreground.png') -Width $foregroundSize -Height $foregroundSize -LogoScale 0.66 -Transparent $true
}

Get-ChildItem -Path $resPath -Directory -Filter 'drawable*' | ForEach-Object {
    $splashPath = Join-Path $_.FullName 'splash.png'
    if (Test-Path $splashPath) {
        $existing = [System.Drawing.Image]::FromFile($splashPath)
        $width = $existing.Width
        $height = $existing.Height
        $existing.Dispose()
        Save-LogoImage -Path $splashPath -Width $width -Height $height -LogoScale 0.3
    }
}

$source.Dispose()
Write-Output 'Android launcher icons and splash screens generated from resources/icon.png.'

Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\MiniMac\steelcommando\assets\hero\projectiles"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$path = Join-Path $dir "hero_projectile.png"
$bmp = New-Object System.Drawing.Bitmap 12, 6, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$g.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 242, 168)), 1, 1, 10, 4)
$g.DrawRectangle([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 170, 136, 0)), 1, 1, 9, 3)
$g.Dispose()
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "wrote $path"

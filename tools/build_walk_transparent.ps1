Add-Type -AssemblyName System.Drawing

function Is-Green([System.Drawing.Color]$c) {
  # Chroma key: strong green, not character greens in camo (camo has lower G dominance)
  return ($c.G -gt 90 -and $c.G -gt ($c.R + 40) -and $c.G -gt ($c.B + 40))
}

function Key-GreenToAlpha([System.Drawing.Bitmap]$src) {
  $dst = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
      $c = $src.GetPixel($x, $y)
      if (Is-Green $c) {
        # Soft fringe: partially green pixels get partial alpha
        $greenExcess = [math]::Min(255, ($c.G - [math]::Max($c.R, $c.B)))
        if ($greenExcess -gt 70 -or ($c.G -gt 140 -and $c.G -gt $c.R * 1.35 -and $c.G -gt $c.B * 1.35)) {
          $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
          $dst.SetPixel($x, $y, $c)
        }
      } else {
        $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      }
    }
  }
  return $dst
}

function Get-OpaqueBounds([System.Drawing.Bitmap]$bmp, [int]$minA = 32) {
  $minX = $bmp.Width; $minY = $bmp.Height; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.A -ge $minA) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) { return $null }
  return [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
}

function Scale-Bitmap([System.Drawing.Bitmap]$src, [int]$tw, [int]$th) {
  $scaled = New-Object System.Drawing.Bitmap $tw, $th, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($scaled)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $g.DrawImage($src, 0, 0, $tw, $th)
  $g.Dispose()
  return $scaled
}

function Foot-Score([System.Drawing.Bitmap]$bmp) {
  # In lower 22% of opaque bounds, find center-of-mass X of opaque pixels (stride indicator)
  $b = Get-OpaqueBounds $bmp
  if ($null -eq $b) { return @{ cx = 0; left = 0; right = 0 } }
  $y0 = $b.Y + [int]($b.Height * 0.78)
  $mid = $b.X + [int]($b.Width / 2)
  $sumX = 0.0; $n = 0; $left = 0; $right = 0
  for ($y = $y0; $y -lt ($b.Y + $b.Height); $y++) {
    for ($x = $b.X; $x -lt ($b.X + $b.Width); $x++) {
      if ($bmp.GetPixel($x, $y).A -lt 40) { continue }
      $sumX += $x
      $n++
      if ($x -lt $mid) { $left++ } else { $right++ }
    }
  }
  $cx = if ($n -gt 0) { $sumX / $n } else { $mid }
  # relative: >0.5 means mass on right (forward for facing-right character often)
  $rel = if ($b.Width -gt 0) { ($cx - $b.X) / $b.Width } else { 0.5 }
  return @{ cx = $rel; left = $left; right = $right; n = $n }
}

$srcRoot = "C:\Users\MiniMac\.cursor\projects\c-Users-MiniMac-steelcommando\assets"
$outPath = "C:\Users\MiniMac\steelcommando\assets\hero\hero_walk_loop_sheet.png"
$frameW = 480
$frameH = 822
$frameCount = 10
$sidePad = 8
$maxW = $frameW - ($sidePad * 2)
$targetH = 800
$footY = 816

# Idle reference for size
$idle = [System.Drawing.Bitmap]::FromFile("C:\Users\MiniMac\steelcommando\assets\hero\hero_idle_loop_sheet.png")
$idle0 = $idle.Clone([System.Drawing.Rectangle]::new(0,0,$frameW,$frameH), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ib = Get-OpaqueBounds $idle0
Write-Output ("idle_bounds=$($ib.Width)x$($ib.Height) at=$($ib.X),$($ib.Y) cornerA=$($idle0.GetPixel(0,0).A)")
$idle0.Dispose(); $idle.Dispose()

$keyed = @()
$scores = @()
for ($i = 1; $i -le $frameCount; $i++) {
  $path = Join-Path $srcRoot ("wg{0:D2}.jpg" -f $i)
  $src = [System.Drawing.Bitmap]::FromFile($path)
  $alpha = Key-GreenToAlpha $src
  $src.Dispose()
  $bounds = Get-OpaqueBounds $alpha
  if ($null -eq $bounds) { throw "No opaque pixels in $path" }
  $crop = $alpha.Clone($bounds, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $alpha.Dispose()
  $sc = Foot-Score $crop
  Write-Output ("frame$i crop=$($crop.Width)x$($crop.Height) footRel=$([math]::Round($sc.cx,3)) L=$($sc.left) R=$($sc.right)")
  $keyed += $crop
  $scores += $sc.cx
}

# Keep authored order 1..10 (cycle order). Uniform scale via common box.
$maxCW = 0; $maxCH = 0
foreach ($k in $keyed) {
  if ($k.Width -gt $maxCW) { $maxCW = $k.Width }
  if ($k.Height -gt $maxCH) { $maxCH = $k.Height }
}
$scale = [math]::Min($maxW / [double]$maxCW, $targetH / [double]$maxCH)
$outW = [int][math]::Round($maxCW * $scale)
$outH = [int][math]::Round($maxCH * $scale)
Write-Output ("uniform=${outW}x${outH} scale=$scale")

$sheet = New-Object System.Drawing.Bitmap ($frameW * $frameCount), $frameH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::Transparent)
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

for ($i = 0; $i -lt $frameCount; $i++) {
  $crop = $keyed[$i]
  $canvas = New-Object System.Drawing.Bitmap $maxCW, $maxCH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $cg = [System.Drawing.Graphics]::FromImage($canvas)
  $cg.Clear([System.Drawing.Color]::Transparent)
  $cg.DrawImageUnscaled($crop, [int][math]::Floor(($maxCW - $crop.Width) / 2), $maxCH - $crop.Height)
  $cg.Dispose()

  $scaled = Scale-Bitmap $canvas $outW $outH
  $canvas.Dispose()

  $cell = $i * $frameW
  $destX = $cell + [int][math]::Floor(($frameW - $outW) / 2)
  $destY = $footY - $outH
  if ($destY -lt 4) { $destY = 4 }
  $g.DrawImageUnscaled($scaled, $destX, $destY)
  Write-Output ("placed$($i+1) at=$destX,$destY")
  $scaled.Dispose()
  $crop.Dispose()
}
$g.Dispose()

# Ensure cell gutters fully transparent (no intersections / bleed)
for ($i = 0; $i -lt $frameCount; $i++) {
  $left = $i * $frameW
  $right = $left + $frameW - 1
  for ($y = 0; $y -lt $frameH; $y++) {
    $sheet.SetPixel($left, $y, [System.Drawing.Color]::Transparent)
    $sheet.SetPixel($right, $y, [System.Drawing.Color]::Transparent)
  }
}

if (Test-Path $outPath) { Remove-Item -Force $outPath }
$sheet.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$corner = $sheet.GetPixel(0, 0)
Write-Output ("wrote $outPath size=$($sheet.Width)x$($sheet.Height) cornerA=$($corner.A)")
$sheet.Dispose()

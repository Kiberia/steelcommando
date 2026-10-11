Add-Type -AssemblyName System.Drawing
$p = "C:\Users\MiniMac\steelcommando\assets\hero\hero_walk_loop_sheet.png"
$b = [System.Drawing.Bitmap]::FromFile($p)
$c0 = $b.GetPixel(0,0)
$trans = 0; $opaque = 0; $blackOpaque = 0
for ($y = 0; $y -lt 40; $y++) {
  for ($x = 0; $x -lt 40; $x++) {
    $c = $b.GetPixel($x,$y)
    if ($c.A -lt 16) { $trans++ } else { $opaque++ }
    if ($c.A -gt 240 -and $c.R -lt 10 -and $c.G -lt 10 -and $c.B -lt 10) { $blackOpaque++ }
  }
}
# Sample a mid-character pixel from frame 0
$mid = $b.GetPixel(240, 400)
Write-Output ("cornerA=$($c0.A) sample40 trans=$trans opaque=$opaque blackOpaque=$blackOpaque midA=$($mid.A) midRGB=$($mid.R),$($mid.G),$($mid.B)")
$b.Dispose()

Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("C:\Users\MiniMac\steelcommando\assets\hero\hero_walk_loop_sheet.png")
Write-Output ("sheet=" + $b.Width + "x" + $b.Height + " cornerA=" + $b.GetPixel(0,0).A)
$fw = 480
for ($i = 0; $i -lt 10; $i++) {
  $minY = 9999; $maxY = -1; $minX = 9999; $maxX = -1
  $x0 = $i * $fw
  for ($y = 0; $y -lt $b.Height; $y++) {
    for ($x = 0; $x -lt $fw; $x++) {
      $c = $b.GetPixel($x0 + $x, $y)
      if ($c.A -gt 32) {
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
      }
    }
  }
  $h = $maxY - $minY + 1
  $w = $maxX - $minX + 1
  Write-Output ("f$i content=${w}x${h} y=$minY-$maxY")
}
$b.Dispose()

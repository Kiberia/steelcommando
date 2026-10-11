Add-Type -AssemblyName System.Drawing
$idlePath = "C:\Users\MiniMac\steelcommando\assets\hero\hero_idle_loop_sheet.png"
$outPath = "C:\Users\MiniMac\steelcommando\assets\hero\_idle_frame0.png"
$idle = [System.Drawing.Bitmap]::FromFile($idlePath)
$frame = $idle.Clone([System.Drawing.Rectangle]::new(0, 0, 480, 822), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$frame.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output ("wrote $outPath alphaCorner=" + $frame.GetPixel(0,0).A)
$frame.Dispose()
$idle.Dispose()

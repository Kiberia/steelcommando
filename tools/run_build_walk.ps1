$csc = Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4*\csc.exe" | Select-Object -First 1 -ExpandProperty FullName
if (-not $csc) { throw "csc.exe not found" }
Write-Output "csc=$csc"
& $csc /nologo /t:exe /r:System.Drawing.dll /out:"C:\Users\MiniMac\steelcommando\tools\BuildWalk.exe" "C:\Users\MiniMac\steelcommando\tools\BuildWalk.cs"
if ($LASTEXITCODE -ne 0) { throw "compile failed" }
& "C:\Users\MiniMac\steelcommando\tools\BuildWalk.exe"

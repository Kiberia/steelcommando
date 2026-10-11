$csc = Get-ChildItem "C:\Windows\Microsoft.NET\Framework64\v4*\csc.exe" | Select-Object -First 1 -ExpandProperty FullName
& $csc /nologo /t:exe /r:System.Drawing.dll /out:"C:\Users\MiniMac\steelcommando\tools\BuildWalkUniform.exe" "C:\Users\MiniMac\steelcommando\tools\BuildWalkUniform.cs"
if ($LASTEXITCODE -ne 0) { throw "compile failed" }
& "C:\Users\MiniMac\steelcommando\tools\BuildWalkUniform.exe"

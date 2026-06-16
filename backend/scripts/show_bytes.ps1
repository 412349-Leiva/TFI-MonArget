$path = 'C:\Users\tami_\OneDrive\Documents\TFI-MonArget\backend\src\main\java\com\monargent\backend\dto\receipt\ReceiptOCRResponse.java'
$b = [System.IO.File]::ReadAllBytes($path)
Write-Output "Length: $($b.Length)"
$out = for ($i=0; $i -lt [Math]::Min($b.Length, 32); $i++) { '{0:x2}' -f $b[$i] }
Write-Output ($out -join ' ')
Write-Output "--- First line as text ---"
[System.IO.File]::ReadAllText($path) -split "\r?\n" | Select-Object -First 1 | Write-Output

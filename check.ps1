$bytes = [System.IO.File]::ReadAllBytes('D:\data-collection\frontend\src\pages\user\SurveyStudio.jsx')
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$lines = $text -split "`n"
$line = $lines[333]  # 0-indexed = line 334

# Hex dump of line 334
$hex = ""
for ($i = 0; $i -lt $line.Length; $i++) {
    $c = [int][char]$line[$i]
    if ($c -gt 127 -or $c -lt 32) {
        Write-Host "WEIRD char at pos $i : U+$($c.ToString('X4')) = '$($line[$i])'"
    }
    if ($i -ge 155 -and $i -le 185) {
        Write-Host "pos $i : U+$($c.ToString('X4')) = '$($line[$i])'"
    }
}

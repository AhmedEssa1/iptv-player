$r = Invoke-WebRequest -Uri 'https://iptv-org.github.io/iptv/index.m3u' -UseBasicParsing
$text = [System.Text.Encoding]::UTF8.GetString($r.Content)
$text.Substring(0, [Math]::Min(2000, $text.Length))

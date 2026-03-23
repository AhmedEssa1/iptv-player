$r = Invoke-WebRequest -Uri 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' -UseBasicParsing
$text = [System.Text.Encoding]::UTF8.GetString($r.Content)
$text.Substring(0, [Math]::Min(500, $text.Length))

$r = Invoke-WebRequest -Uri 'https://ntv1.akamaized.net/hls/live/2019757/NASA_NTTV/chunklist.m3u8' -UseBasicParsing
$text = [System.Text.Encoding]::UTF8.GetString($r.Content)
$text.Substring(0, [Math]::Min(1000, $text.Length))

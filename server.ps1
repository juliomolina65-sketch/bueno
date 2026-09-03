# Minimal dependency-free static file server for local preview.
# Uses TcpListener (no admin / URL-reservation needed, unlike HttpListener).
#   Usage:  powershell -ExecutionPolicy Bypass -File server.ps1 [-Port 8080]

param(
    [int]$Port = 8080,
    [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path $Root).Path

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.webp' = 'image/webp'
    '.avif' = 'image/avif'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.mp4'  = 'video/mp4'
    '.webm' = 'video/webm'
    '.txt'  = 'text/plain; charset=utf-8'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host ""
Write-Host "  Store running at  http://localhost:$Port/" -ForegroundColor Green
Write-Host "  Serving           $Root"
Write-Host "  Ctrl+C to stop."
Write-Host ""

function Send-Response {
    param($Stream, [int]$Status, [string]$StatusText, [string]$ContentType, [byte[]]$Body)

    $head = "HTTP/1.1 $Status $StatusText`r`n" +
            "Content-Type: $ContentType`r`n" +
            "Content-Length: $($Body.Length)`r`n" +
            "Cache-Control: no-store, no-cache, must-revalidate`r`n" +
            "Connection: close`r`n`r`n"

    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($head)
    $Stream.Write($headBytes, 0, $headBytes.Length)
    if ($Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
    $Stream.Flush()
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 5000
            $stream = $client.GetStream()

            # --- read the request line -------------------------------------
            $sb = [System.Text.StringBuilder]::new()
            $buf = [byte[]]::new(1)
            $lastFour = ''
            while ($sb.Length -lt 8192) {
                $read = $stream.Read($buf, 0, 1)
                if ($read -le 0) { break }
                $ch = [char]$buf[0]
                [void]$sb.Append($ch)
                $lastFour = ($lastFour + $ch)
                if ($lastFour.Length -gt 4) { $lastFour = $lastFour.Substring($lastFour.Length - 4) }
                if ($lastFour -eq "`r`n`r`n") { break }
            }

            $request = $sb.ToString()
            $firstLine = ($request -split "`r`n")[0]
            $parts = $firstLine -split ' '

            if ($parts.Length -lt 2) { $client.Close(); continue }

            $method = $parts[0]
            $rawPath = $parts[1]

            # strip query string / fragment, decode
            $path = ($rawPath -split '[?#]')[0]
            $path = [System.Uri]::UnescapeDataString($path)
            if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }

            # --- resolve safely inside root --------------------------------
            $relative = $path.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $full = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))

            $ok = $full.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)

            if ($ok -and (Test-Path -LiteralPath $full -PathType Container)) {
                $full = Join-Path $full 'index.html'
            }

            if ($ok -and (Test-Path -LiteralPath $full -PathType Leaf)) {
                $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
                $type = $mime[$ext]
                if (-not $type) { $type = 'application/octet-stream' }
                $bytes = [System.IO.File]::ReadAllBytes($full)
                Send-Response $stream 200 'OK' $type $bytes
                Write-Host ("  200  {0}" -f $path) -ForegroundColor DarkGray
            }
            else {
                $html = "<!doctype html><meta charset=utf-8><title>404</title>" +
                        "<style>body{font:16px system-ui;padding:60px;color:#14140f;background:#fbfaf7}" +
                        "code{background:#f4f2ec;padding:2px 7px;border-radius:5px}</style>" +
                        "<h1>404 &mdash; not found</h1><p><code>$([System.Net.WebUtility]::HtmlEncode($path))</code></p>"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($html)
                Send-Response $stream 404 'Not Found' 'text/html; charset=utf-8' $bytes
                Write-Host ("  404  {0}" -f $path) -ForegroundColor DarkYellow
            }
        }
        catch {
            Write-Host ("  err  {0}" -f $_.Exception.Message) -ForegroundColor DarkRed
        }
        finally {
            if ($client) { $client.Close() }
        }
    }
}
finally {
    $listener.Stop()
}

# Servidor HTTP simple para servir archivos estáticos
$port = 8000
$root = Get-Location

Write-Host "🚀 Iniciando servidor HTTP en puerto $port..."
Write-Host "📁 Directorio raíz: $root"
Write-Host "🌐 URL: http://localhost:$port"
Write-Host "📄 Convertidor: http://localhost:$port/csv_to_geojson_converter.html"
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor"
Write-Host ""

try {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url.LocalPath
        $filePath = Join-Path $root $url.TrimStart('/')
        
        if ($url -eq "/") {
            $filePath = Join-Path $root "csv_to_geojson_converter.html"
        }
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            
            # Determinar tipo MIME
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mimeType = switch ($extension) {
                ".html" { "text/html" }
                ".css" { "text/css" }
                ".js" { "application/javascript" }
                ".json" { "application/json" }
                ".geojson" { "application/json" }
                ".csv" { "text/csv" }
                default { "text/plain" }
            }
            
            $response.ContentType = $mimeType
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.StatusCode = 200
            
            Write-Host "✅ $(Get-Date -Format 'HH:mm:ss') - $url ($mimeType)"
        } else {
            $response.StatusCode = 404
            $notFound = "404 - Archivo no encontrado: $url"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "❌ $(Get-Date -Format 'HH:mm:ss') - $url (404)"
        }
        
        $response.Close()
    }
} catch {
    Write-Host "❌ Error: $_"
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
} 
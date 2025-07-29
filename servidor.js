const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// Mapeo de extensiones a tipos MIME
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.geojson': 'application/json',
    '.csv': 'text/csv',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif'
};

const server = http.createServer((req, res) => {
    let filePath = url.parse(req.url).pathname;
    
    // Si es la raíz, servir el convertidor
    if (filePath === '/') {
        filePath = '/csv_to_geojson_converter.html';
    }
    
    // Construir la ruta completa del archivo
    const fullPath = path.join(__dirname, filePath);
    
    // Obtener la extensión del archivo
    const extname = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[extname] || 'text/plain';
    
    // Leer el archivo
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Archivo no encontrado
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>404 - No encontrado</title></head>
                        <body>
                            <h1>404 - Archivo no encontrado</h1>
                            <p>No se pudo encontrar: ${filePath}</p>
                            <p><a href="/">Volver al convertidor</a></p>
                        </body>
                    </html>
                `);
            } else {
                // Error del servidor
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <head><title>500 - Error del servidor</title></head>
                        <body>
                            <h1>500 - Error del servidor</h1>
                            <p>Error interno: ${err.message}</p>
                        </body>
                    </html>
                `);
            }
        } else {
            // Archivo encontrado
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log('🚀 Servidor HTTP iniciado en puerto', PORT);
    console.log('📁 Directorio raíz:', __dirname);
    console.log('🌐 URL: http://localhost:' + PORT);
    console.log('📄 Convertidor: http://localhost:' + PORT + '/csv_to_geojson_converter.html');
    console.log('');
    console.log('Presiona Ctrl+C para detener el servidor');
    console.log('');
});

// Manejar señales de terminación
process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo servidor...');
    server.close(() => {
        console.log('✅ Servidor detenido');
        process.exit(0);
    });
}); 
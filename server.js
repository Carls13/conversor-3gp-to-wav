const express = require('express');
const bodyParser = require('body-parser');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar el binario de ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Middleware para procesar el JSON en el body
app.use(bodyParser.json({ limit: '50mb' }));

// Endpoint para recibir el archivo .3gp en base64, convertirlo a .wav y devolverlo en base64
app.post('/convert', async (req, res) => {
    try {
        // Verificar que el campo 'file' esté presente en el body
        const { file } = req.body;
        if (!file) {
            return res.status(400).json({ error: 'Por favor, proporciona el archivo base64 en el campo "file"' });
        }

        console.log({ file })

        // Decodificar el base64 a binario
        const buffer = Buffer.from(file, 'base64');
        const inputFilePath = path.join('tmp', 'input.3gp');
        const outputFilePath = path.join('tmp', 'output.wav');

        // Guardar temporalmente el archivo .3gp
        fs.writeFileSync(inputFilePath, buffer);

        // Convertir el archivo .3gp a .wav usando ffmpeg
    ffmpeg(inputFilePath)
            .toFormat('wav')
            .on('end', () => {
                // Leer el archivo convertido
                const convertedFile = fs.readFileSync(outputFilePath);
                // Convertir a base64 y enviarlo en la respuesta
                const base64Wav = convertedFile.toString('base64');
                // Eliminar archivos temporales
                fs.unlinkSync(inputFilePath);
                fs.unlinkSync(outputFilePath);
                // Responder con el archivo convertido en base64

                res.json({ file: base64Wav });
            })
            .on('error', (err) => {
                console.error('Error durante la conversión:', err);
                res.status(500).json({ error: 'Error durante la conversión del archivo' });
            })
            .save(outputFilePath);
    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

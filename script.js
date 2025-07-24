// Seleccionamos los nuevos elementos del DOM
const imagenUrlInput = document.getElementById('imagenUrl');
const imagenUploadInput = document.getElementById('imagenUpload');
const imgUrl = document.getElementById('imgUrl');
const imgUpload = document.getElementById('imgUpload');
const compararBtn = document.getElementById('compararBtn');
const resultadoDiv = document.getElementById('resultado');

// --- Cargar modelos al iniciar (sin cambios) ---
async function cargarModelos() {
    const MODEL_URL = 'https://cubillosandrey.github.io/reconocimiento-models/'; // Asegúrate que la carpeta 'models' está en tu proyecto
    compararBtn.disabled = true;
    resultadoDiv.innerText = 'Cargando modelos... ⏳';
    
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    resultadoDiv.innerText = 'Modelos cargados. ¡Listo para comparar! ✅';
    compararBtn.disabled = false;
}

cargarModelos();

// --- Manejar la entrada de la URL ---
imagenUrlInput.addEventListener('change', () => {
    // Simplemente asignamos la URL al src del elemento img
    imgUrl.src = imagenUrlInput.value;
});

// --- Manejar la subida del archivo (previsualización) ---
imagenUploadInput.addEventListener('change', () => {
    if (imagenUploadInput.files && imagenUploadInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgUpload.src = e.target.result;
        };
        reader.readAsDataURL(imagenUploadInput.files[0]);
    }
});

// --- Lógica de comparación ---
compararBtn.addEventListener('click', async () => {
    // Verificamos que ambas imágenes tengan una fuente (src) válida
    if (!imgUrl.src || !imgUpload.src || imgUrl.src.endsWith('#') || imgUpload.src.endsWith('#')) {
        resultadoDiv.innerText = 'Por favor, proporciona una URL y sube un archivo.';
        return;
    }

    resultadoDiv.innerText = 'Procesando... 🤔';

    try {
        // Obtener descriptores de ambas imágenes
        const descriptor1 = await obtenerDescriptor(imgUrl);
        const descriptor2 = await obtenerDescriptor(imgUpload);

        if (!descriptor1 || !descriptor2) {
            resultadoDiv.innerText = 'No se pudo detectar un rostro en una o ambas imágenes. ❌';
            return;
        }

        // Calcular la distancia
        const distancia = faceapi.euclideanDistance(descriptor1, descriptor2);
        const umbral = 0.6; // Umbral de similitud
        const sonLaMismaPersona = distancia < umbral;

        // Mostrar resultado
        if (sonLaMismaPersona) {
            resultadoDiv.innerHTML = `✅ **¡Son la misma persona!**<br>(Distancia: ${distancia.toFixed(4)})`;
        } else {
            resultadoDiv.innerHTML = `❌ **No son la misma persona.**<br>(Distancia: ${distancia.toFixed(4)})`;
        }

    } catch (error) {
        console.error(error);
        resultadoDiv.innerText = 'Ocurrió un error. Verifica que la URL de la imagen sea accesible (CORS).';
    }
});

// --- Función para obtener el descriptor facial (sin cambios) ---
async function obtenerDescriptor(imgElement) {
    // Esperamos a que la imagen se cargue completamente antes de procesarla
    await new Promise((resolve, reject) => {
        imgElement.onload = resolve;
        imgElement.onerror = reject;
        // Si la imagen ya está cargada (desde caché), resolvemos inmediatamente
        if (imgElement.complete) {
            resolve();
        }
    });

    const deteccion = await faceapi.detectSingleFace(imgElement)
                                    .withFaceLandmarks()
                                    .withFaceDescriptor();
    return deteccion ? deteccion.descriptor : null;
}
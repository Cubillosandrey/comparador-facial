// --- FUNCIÓN PRINCIPAL QUE SE EJECUTA SOLA ---
(async () => {
    const img1Element = document.getElementById('img1');
    const img2Element = document.getElementById('img2');
    const resultadoDiv = document.getElementById('resultado');

    // 1. Obtener las URLs de las imágenes desde los parámetros de la página
    const params = new URLSearchParams(window.location.search);
    const p1 = params.get('p1');
    const p2 = params.get('p2');

    if (!p1 || !p2) {
        resultadoDiv.innerText = "Error: Faltan las URLs de las imágenes (p1 y p2).";
        resultadoDiv.className = 'error';
        return;
    }

    img1Element.src = p1;
    img2Element.src = p2;
    img1Element.crossOrigin = 'anonymous';
    img2Element.crossOrigin = 'anonymous';


    // 2. Cargar los modelos
    resultadoDiv.innerText = "Cargando modelos... ⏳";
    const MODEL_URL = './models'; // Busca la carpeta 'models' en el mismo directorio
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
    } catch (e) {
        resultadoDiv.innerText = "Error al cargar los modelos de IA.";
        resultadoDiv.className = 'error';
        console.error("Error en modelos:", e);
        return;
    }

    // 3. Esperar a que las imágenes se carguen y luego compararlas
    try {
        resultadoDiv.innerText = "Analizando rostros... 🤔";
        const descriptors = await Promise.all([
            getDescriptor(img1Element),
            getDescriptor(img2Element)
        ]);

        if (!descriptors[0] || !descriptors[1]) {
            resultadoDiv.innerText = "No se pudo detectar un rostro en una o ambas imágenes.";
            resultadoDiv.className = 'error';
            return;
        }

        const distancia = faceapi.euclideanDistance(descriptors[0], descriptors[1]);
        const umbral = 0.6;
        
        if (distancia < umbral) {
            resultadoDiv.innerHTML = `✅ ¡Son la misma persona!<br><small>(Distancia: ${distancia.toFixed(4)})</small>`;
            resultadoDiv.className = 'success';
        } else {
            resultadoDiv.innerHTML = `❌ No son la misma persona.<br><small>(Distancia: ${distancia.toFixed(4)})</small>`;
            resultadoDiv.className = 'error';
        }
    } catch (e) {
        resultadoDiv.innerText = "Error al procesar las imágenes.";
        resultadoDiv.className = 'error';
        console.error("Error en procesamiento:", e);
    }
})();

// --- Función de ayuda para obtener el descriptor de una imagen ---
async function getDescriptor(imgElement) {
    // Esperar a que la imagen se cargue completamente
    await new Promise((resolve, reject) => {
        imgElement.onload = resolve;
        imgElement.onerror = reject;
        if (imgElement.complete && imgElement.naturalHeight !== 0) resolve();
    });

    return await faceapi.detectSingleFace(imgElement).withFaceLandmarks().withFaceDescriptor();
}

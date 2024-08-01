let canvas = document.getElementById('mapCanvas');
let ctx = canvas.getContext('2d');
let drawingCanvas = document.createElement('canvas');
let drawingCtx = drawingCanvas.getContext('2d');
let currentTool = 'brush';
let currentToolValue = '1'; // Valor inicial para el número
let currentMap = 'map1';
let currentColor = '#000000';
let brushSize = 5;
let isDrawing = false;
let startX, startY;
let mapImage = new Image();
let offsetX = 0;
let offsetY = 0;
let zoomLevel = 1;
const zoomFactor = 1.2;

function setCanvasSize() {
    canvas.width = window.innerWidth * 0.9; // Ajusta el tamaño del canvas al 90% del viewport width
    canvas.height = canvas.width * 9 / 16; // Mantiene la proporción 16:9
    drawingCanvas.width = canvas.width;
    drawingCanvas.height = canvas.height;
    zoomCanvas(); // Aplica el zoom inicial
}

function initialize() {
    setCanvasSize();
    loadMap(currentMap);
    window.addEventListener('resize', () => {
        setCanvasSize();
        loadMap(currentMap); // Recargar la imagen cuando la ventana se redimensione
    });
}

function loadMap(mapName) {
    mapImage.src = `img/${mapName}.jpg`;
    mapImage.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        let aspectRatio = mapImage.width / mapImage.height;
        let drawWidth, drawHeight;
        
        if (aspectRatio > canvas.width / canvas.height) {
            drawWidth = canvas.width;
            drawHeight = drawWidth / aspectRatio;
        } else {
            drawHeight = canvas.height;
            drawWidth = drawHeight * aspectRatio;
        }
        
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = (canvas.height - drawHeight) / 2;
        ctx.drawImage(mapImage, offsetX, offsetY, drawWidth, drawHeight);
        redrawDrawing(); // Redibujar el contenido de la capa de dibujo
    }
}

function changeMap() {
    let select = document.getElementById('map-select');
    currentMap = select.value;
    loadMap(currentMap);
}

function selectTool(tool, value) {
    currentTool = tool;
    if (value) currentToolValue = value;

    // Cambia el estilo de los botones numéricos
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('bold'); // Elimina la negrita de todos los botones
        if (btn.textContent === value) {
            btn.style.color = currentColor; // Aplica el color seleccionado
            btn.classList.add('bold'); // Aplica negrita
        } else {
            btn.style.color = '#fff'; // Restaura el color por defecto
        }
    });
}

function changeColor(color) {
    currentColor = color;
}

function changeBrushSize(size) {
    brushSize = size;
}

function getCanvasCoordinates(event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return [x, y];
}

canvas.addEventListener('mousedown', function(e) {
    isDrawing = true;
    let [canvasX, canvasY] = getCanvasCoordinates(e);
    startX = (canvasX - offsetX) / zoomLevel;
    startY = (canvasY - offsetY) / zoomLevel;
    if (currentTool === 'brush' || currentTool === 'eraser') {
        drawingCtx.beginPath();
        drawingCtx.moveTo(startX, startY);
    }
});

canvas.addEventListener('mouseup', function(e) {
    isDrawing = false;
    if (currentTool !== 'brush' && currentTool !== 'eraser') {
        let [canvasX, canvasY] = getCanvasCoordinates(e);
        drawShape(startX, startY, (canvasX - offsetX) / zoomLevel, (canvasY - offsetY) / zoomLevel);
    }
    redrawDrawing(); // Redibujar el contenido después de dibujar
});

canvas.addEventListener('mousemove', function(e) {
    if (!isDrawing) return;
    let [canvasX, canvasY] = getCanvasCoordinates(e);
    if (currentTool === 'brush') {
        drawLine((canvasX - offsetX) / zoomLevel, (canvasY - offsetY) / zoomLevel);
    } else if (currentTool === 'eraser') {
        erase((canvasX - offsetX) / zoomLevel, (canvasY - offsetY) / zoomLevel);
    }
    redrawDrawing(); // Redibujar el contenido mientras se dibuja
});

function drawLine(x, y) {
    drawingCtx.strokeStyle = currentColor;
    drawingCtx.lineWidth = brushSize;
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
}

function erase(x, y) {
    drawingCtx.globalCompositeOperation = 'destination-out';
    drawingCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2, false);
    drawingCtx.fill();
    drawingCtx.globalCompositeOperation = 'source-over';
}

function drawShape(startX, startY, endX, endY) {
    drawingCtx.strokeStyle = currentColor; // Usa el color seleccionado
    drawingCtx.fillStyle = currentColor; // Usa el color seleccionado para el relleno
    drawingCtx.lineWidth = brushSize;

    if (currentTool === 'circle') {
        drawingCtx.beginPath();
        let radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        drawingCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
        drawingCtx.stroke();
    } else if (currentTool === 'square') {
        drawingCtx.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (currentTool === 'number') {
        drawingCtx.font = `${brushSize * 4}px 'CGFLocustResistance'`; // Usa la tipografía personalizada
        drawingCtx.textAlign = 'center'; // Alinea el texto al centro
        drawingCtx.textBaseline = 'middle'; // Alinea el texto verticalmente al medio
        drawingCtx.fillText(currentToolValue, (startX + endX) / 2, (startY + endY) / 2); // Dibuja el texto
    }
}

function redrawDrawing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, offsetX, offsetY, canvas.width / zoomLevel, canvas.height / zoomLevel);
    ctx.drawImage(drawingCanvas, 0, 0);
}

function saveDrawing() {
    let link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = `${currentMap}-strategy.png`;
    link.click();
}

function toggleZoom(direction) {
    if (direction === 'in') {
        zoomLevel *= zoomFactor;
    } else if (direction === 'out') {
        zoomLevel /= zoomFactor;
    }
    redrawDrawing(); // Redibujar después de aplicar el zoom
}

initialize();

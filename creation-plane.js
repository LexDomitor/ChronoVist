class CreationPlane {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        this.init();
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
        window.addEventListener('mousemove', e => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });

        this.resize();
        this.animate();
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight - 65;
        this.draw();
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        this.camera.x += (e.clientX - this.lastMouse.x);
        this.camera.y += (e.clientY - this.lastMouse.y);
        this.lastMouse = { x: e.clientX, y: e.clientY };
        this.draw();
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        const zoomSpeed = 0.001;
        const factor = Math.pow(0.999, e.deltaY);
        
        // Zoom toward mouse position logic
        const mouseX = e.clientX;
        const mouseY = e.clientY - 65;

        const worldX = (mouseX - this.width / 2 - this.camera.x) / this.camera.zoom;
        const worldY = (mouseY - this.height / 2 - this.camera.y) / this.camera.zoom;

        const newZoom = Math.min(Math.max(this.camera.zoom * factor, 0.05), 10);
        
        this.camera.zoom = newZoom;
        this.camera.x = mouseX - this.width / 2 - worldX * this.camera.zoom;
        this.camera.y = mouseY - this.height / 2 - worldY * this.camera.zoom;

        this.draw();
    }

    draw() {
        const { ctx, width, height, camera } = this;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2 + camera.x, height / 2 + camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        const gridSize = 100;
        const viewLeft = (-width / 2 - camera.x) / camera.zoom;
        const viewRight = (width / 2 - camera.x) / camera.zoom;
        const viewTop = (-height / 2 - camera.y) / camera.zoom;
        const viewBottom = (height / 2 - camera.y) / camera.zoom;

        const startX = Math.floor(viewLeft / gridSize) * gridSize;
        const endX = Math.ceil(viewRight / gridSize) * gridSize;
        const startY = Math.floor(viewTop / gridSize) * gridSize;
        const endY = Math.ceil(viewBottom / gridSize) * gridSize;

        // Draw the + Graphics
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1 / camera.zoom;

        for (let x = startX; x <= endX; x += gridSize) {
            for (let y = startY; y <= endY; y += gridSize) {
                const crossSize = 4 / camera.zoom;
                ctx.beginPath();
                // Vertical line of the +
                ctx.moveTo(x, y - crossSize);
                ctx.lineTo(x, y + crossSize);
                // Horizontal line of the +
                ctx.moveTo(x - crossSize, y);
                ctx.lineTo(x + crossSize, y);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    animate() {
        // Keeps rendering smooth
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

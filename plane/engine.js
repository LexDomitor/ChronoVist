const Plane = {
    viewport: document.getElementById('viewport'),
    world: document.getElementById('world'),
    trash: document.getElementById('trash-zone'),
    statusText: document.getElementById('system-status'),
    params: new URLSearchParams(window.location.search),
    universes: JSON.parse(localStorage.getItem('alphaline_universes') || "[]"),
    activeUniverse: null,
    worldPos: { x: -4500, y: -4500 },
    scale: 1,
    isPanning: false,

    init() {
        const id = this.params.get('id');
        this.activeUniverse = this.universes.find(u => u.id == id);
        if (this.activeUniverse) {
            this.worldPos = this.activeUniverse.camera || this.worldPos;
            this.scale = this.activeUniverse.scale || 1;
            document.getElementById('active-name').innerText = this.activeUniverse.name;
            document.getElementById('loader-sub').innerText = `Transporting to the world of ${this.activeUniverse.name}`;
        }
        this.updateWorld();
        this.setupCameraListeners();
    },

    updateWorld() {
        this.world.style.transform = `translate(${this.worldPos.x}px, ${this.worldPos.y}px) scale(${this.scale})`;
        const displayX = Math.round(((this.viewport.offsetWidth/2 - this.worldPos.x) / this.scale) - 5000);
        const displayY = Math.round(((this.viewport.offsetHeight/2 - this.worldPos.y) / this.scale) - 5000);
        document.getElementById('coord-display').innerText = `${displayX}, ${displayY} | ${Math.round(this.scale * 100)}%`;
    },

    setupCameraListeners() {
        this.viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const oldScale = this.scale;
            this.scale = Math.min(Math.max(0.15, this.scale + (-Math.sign(e.deltaY) * 0.08)), 3);
            const rect = this.viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.worldPos.x = mouseX - (mouseX - this.worldPos.x) * (this.scale / oldScale);
            this.worldPos.y = mouseY - (mouseY - this.worldPos.y) * (this.scale / oldScale);
            this.updateWorld();
            this.sync();
        }, { passive: false });

        let startX, startY;
        this.viewport.onmousedown = (e) => {
            if(e.target.id !== 'viewport' && e.target.id !== 'world') return;
            this.isPanning = true; document.body.classList.add('hide-ui');
            startX = e.clientX - this.worldPos.x; startY = e.clientY - this.worldPos.y;
        };
        window.onmousemove = (e) => {
            if(this.isPanning) { 
                this.worldPos.x = e.clientX - startX; 
                this.worldPos.y = e.clientY - startY; 
                this.updateWorld(); 
            }
        };
        window.onmouseup = () => { this.isPanning = false; document.body.classList.remove('hide-ui'); this.sync(); };
    },

    sync() {
        if(!this.activeUniverse) return;
        this.statusText.innerText = "Syncing Plane...";
        this.statusText.style.color = "#fff";
        this.activeUniverse.timeline = Array.from(document.querySelectorAll('.node')).map(n => ({
            boxId: n.dataset.id, type: n.dataset.type,
            x: n.classList.contains('snapped') ? 0 : parseInt(n.style.left),
            y: n.classList.contains('snapped') ? 0 : parseInt(n.style.top),
            parent: n.classList.contains('snapped') ? n.closest('.node-container').dataset.id : null,
            title: n.querySelector('.node-title')?.value || "",
            body: n.querySelector('textarea')?.value || "",
            url: n.dataset.base64 || ""
        }));
        this.activeUniverse.camera = this.worldPos;
        this.activeUniverse.scale = this.scale;
        localStorage.setItem('alphaline_universes', JSON.stringify(this.universes));
        setTimeout(() => {
            const now = new Date();
            this.statusText.innerText = `Last Sync: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            this.statusText.style.color = "#666";
        }, 300);
    }
};

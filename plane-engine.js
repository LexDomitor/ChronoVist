/* plane-engine.js */
const PlaneEngine = {
    makeDraggable: function(el, vars) {
        const { world, worldPos, scale, sync, checkQuads, snap, trash } = vars;
        const handle = el.querySelector('.handle');

        handle.onmousedown = (e) => {
            e.stopPropagation();
            if(el.classList.contains('snapped')) {
                const rect = el.getBoundingClientRect();
                el.classList.remove('snapped');
                world.appendChild(el);
                el.style.left = (rect.left - worldPos.x) / scale + 'px';
                el.style.top = (rect.top - worldPos.y) / scale + 'px';
            }
            document.body.classList.add('hide-ui', 'is-dragging');
            let p3 = e.clientX, p4 = e.clientY;
            document.onmousemove = (e) => {
                let p1 = (p3 - e.clientX) / scale, p2 = (p4 - e.clientY) / scale;
                p3 = e.clientX; p4 = e.clientY;
                el.style.left = (el.offsetLeft - p1) + "px";
                el.style.top = (el.offsetTop - p2) + "px";
                checkQuads(el);
            };
            document.onmouseup = () => {
                document.onmousemove = null; 
                document.body.classList.remove('hide-ui', 'is-dragging');
                const t = trash.getBoundingClientRect(); 
                const r = el.getBoundingClientRect();
                if(r.left < t.right && r.bottom > t.top) { 
                    if(confirm("Permanently delete node?")) { el.remove(); sync(); }
                } else { snap(el); if (el.dataset.initialized === "true") sync(); }
            };
        };
    },

    makeResizable: function(el, scale, sync) {
        const resizer = el.querySelector('.resizer');
        if(!resizer) return;
        resizer.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            let startW = el.offsetWidth;
            let startX = e.clientX;
            document.onmousemove = (e) => {
                const deltaX = (e.clientX - startX) / scale;
                el.style.width = Math.max(150, startW + deltaX) + "px";
            };
            document.onmouseup = () => { document.onmousemove = null; sync(); };
        };
    },

    checkQuads: function(el, scale) {
        document.querySelectorAll('.quad').forEach(q => q.classList.remove('active'));
        if(el.dataset.type === 'container') return;
        const r = el.getBoundingClientRect(); 
        const ex = r.left + r.width/2, ey = r.top + r.height/2;
        document.querySelectorAll('.node-container').forEach(c => {
            const cr = c.getBoundingClientRect();
            if(ex > cr.left && ex < cr.right && ey > cr.top && ey < cr.bottom) {
                const quads = c.querySelectorAll('.quad');
                const gridRect = c.querySelector('.container-grid').getBoundingClientRect();
                const col = (ex - gridRect.left) > gridRect.width / 2 ? 1 : 0;
                const row = Math.floor((ey - gridRect.top) / (212 * scale));
                const idx = (row * 2) + col;
                if(quads[idx]) quads[idx].classList.add('active');
            }
        });
    },

    snap: function(el) {
        const q = document.querySelector('.quad.active');
        if(q) {
            el.classList.add('snapped');
            q.closest('.node-container').querySelector('.container-grid').appendChild(el); 
            q.classList.remove('active');
        }
    }
};

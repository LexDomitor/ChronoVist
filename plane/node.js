function sd(e, t) { e.dataTransfer.setData('nodeType', t); }

Plane.viewport.ondragover = e => e.preventDefault();
Plane.viewport.ondrop = e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    if(type) {
        const rect = Plane.viewport.getBoundingClientRect();
        const x = (e.clientX - rect.left - Plane.worldPos.x) / Plane.scale - 110;
        const y = (e.clientY - rect.top - Plane.worldPos.y) / Plane.scale - 20;
        createNode({ type, x, y });
    }
};

function createNode(data) {
    const node = document.createElement('div');
    const id = data.boxId || 'box_' + Date.now();
    node.className = `node node-${data.type}`;
    if(data.type === 'container') node.classList.add('node-container');
    node.dataset.id = id; node.dataset.type = data.type;
    
    if (!data.parent) {
        node.style.left = data.x + 'px'; node.style.top = data.y + 'px';
        Plane.world.appendChild(node);
    }

    let html = `<div class="handle"></div>`;
    if(data.type === 'container') {
        html += `<div class="node-content"><input class="node-title" placeholder="Frame Title" value="${data.title||''}" oninput="Plane.sync()"></div>
                 <div class="container-grid"><div class="quad-layer"><div class="quad"></div><div class="quad"></div><div class="quad"></div><div class="quad"></div></div></div>
                 <div class="container-footer" onclick="expandRows(this)">+ ADD ROW</div>`;
    } else if(data.type === 'text') {
        html += `<div class="node-content"><input class="node-title" placeholder="Title" value="${data.title||''}" oninput="Plane.sync()">
                 <textarea placeholder="Write..." rows="4" oninput="Plane.sync()">${data.body||''}</textarea></div>`;
    } else if(data.type === 'image') {
        html += `<div class="node-content">
                 <div class="img-preview" style="display:${data.url?'block':'none'}">${data.url?`<img src="${data.url}" style="width:100%">`:''}</div>
                 <button onclick="this.nextElementSibling.click()" style="display:${data.url?'none':'block'}; width:100%; background:#222; color:#fff; border:1px solid #444; padding:8px; cursor:pointer; font-size:0.6rem;">UPLOAD IMAGE</button>
                 <input type="file" style="display:none" onchange="handleImg(this)">
                 <input class="node-title" placeholder="Caption..." value="${data.title||''}" oninput="Plane.sync()"></div>`;
    }
    node.innerHTML = html;
    if(data.parent) {
        node.classList.add('snapped');
        const p = document.querySelector(`[data-id="${data.parent}"] .container-grid`);
        if(p) p.appendChild(node);
    }
    makeDraggable(node);
    Plane.sync();
}

function expandRows(btn) {
    btn.previousElementSibling.querySelector('.quad-layer').innerHTML += `<div class="quad"></div><div class="quad"></div>`;
    Plane.sync();
}

function handleImg(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const node = input.closest('.node');
        node.querySelector('.img-preview').style.display = 'block';
        node.querySelector('.img-preview').innerHTML = `<img src="${e.target.result}" style="width:100%">`;
        input.previousElementSibling.style.display = 'none';
        node.dataset.base64 = e.target.result; Plane.sync();
    };
    reader.readAsDataURL(input.files[0]);
}

function makeDraggable(el) {
    const handle = el.querySelector('.handle');
    handle.onmousedown = (e) => {
        e.stopPropagation();
        if(el.classList.contains('snapped')) {
            const rect = el.getBoundingClientRect();
            el.classList.remove('snapped');
            Plane.world.appendChild(el);
            el.style.left = (rect.left - Plane.worldPos.x) / Plane.scale + 'px';
            el.style.top = (rect.top - Plane.worldPos.y) / Plane.scale + 'px';
        }
        document.body.classList.add('hide-ui');
        let p3 = e.clientX, p4 = e.clientY;
        document.onmousemove = (e) => {
            let p1 = (p3 - e.clientX) / Plane.scale, p2 = (p4 - e.clientY) / Plane.scale;
            p3 = e.clientX; p4 = e.clientY;
            el.style.left = (el.offsetLeft - p1) + "px";
            el.style.top = (el.offsetTop - p2) + "px";
            checkQuads(el);
        };
        document.onmouseup = () => {
            document.onmousemove = null; document.body.classList.remove('hide-ui');
            const t = Plane.trash.getBoundingClientRect(); const r = el.getBoundingClientRect();
            if(r.left < t.right && r.bottom > t.top) { if(confirm("Permanently delete node?")) el.remove(); }
            else { snap(el); }
            Plane.sync();
        };
    };
}

function checkQuads(el) {
    document.querySelectorAll('.quad').forEach(q => q.classList.remove('active'));
    if(el.dataset.type === 'container') return;
    const r = el.getBoundingClientRect(); const ex = r.left+r.width/2, ey = r.top+r.height/2;
    document.querySelectorAll('.node-container').forEach(c => {
        const cr = c.getBoundingClientRect();
        if(ex > cr.left && ex < cr.right && ey > cr.top && ey < cr.bottom) {
            const quads = c.querySelectorAll('.quad');
            const gridRect = c.querySelector('.container-grid').getBoundingClientRect();
            const localX = (ex - gridRect.left); const localY = (ey - gridRect.top);
            const col = localX > gridRect.width / 2 ? 1 : 0;
            const row = Math.floor(localY / (212 * Plane.scale));
            const idx = (row * 2) + col;
            if(quads[idx]) quads[idx].classList.add('active');
        }
    });
}

function snap(el) {
    const q = document.querySelector('.quad.active');
    if(q) {
        el.classList.add('snapped');
        q.closest('.node-container').querySelector('.container-grid').appendChild(el); 
        q.classList.remove('active');
    }
}

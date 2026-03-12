// ============================================================
// CONFIGURACIÓN — edita este archivo con tus videos
// Para obtener el ID de un video de YouTube:
//   URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
//   ID:  dQw4w9WgXcQ  (la parte después de ?v=)
// ============================================================
const VIDEOS_JSON = './elcaracter.json';
// ============================================================

let allVideos = [];

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function openModal(video) {
    document.getElementById('modal-iframe').src = `https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`;
    document.getElementById('modal-title').textContent = video.titulo;
    document.getElementById('modal-desc').textContent = `${formatDate(video.fecha)} · ${video.predicador} · ${video.descripcion}`;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modal-iframe').src = '';
    document.body.style.overflow = '';
}

document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function createCard(video, index) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `
      <div class="thumb-wrap">
        <img src="https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg" alt="${video.titulo}" loading="lazy"/>
        <div class="play-overlay">
          <div class="play-circle"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-date">${formatDate(video.fecha)}</div>
        <div class="card-title">${video.titulo}</div>
        <div class="card-desc">🎤 ${video.predicador} · ${video.descripcion}</div>
      </div>
    `;
    card.addEventListener('click', () => openModal(video));
    return card;
}

function render(list) {
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    document.getElementById('video-count').textContent = `${list.length} video${list.length !== 1 ? 's' : ''}`;
    if (!list.length) { grid.innerHTML = '<div class="empty">No se encontraron videos.</div>'; return; }
    list.forEach((v, i) => grid.appendChild(createCard(v, i)));
}

function applyFilters() {
    const q = document.getElementById('search-input').value.toLowerCase();
    const f = document.querySelector('.filter-btn.active').dataset.filter;
    render(allVideos.filter(v => {
        const matchQ = !q || v.titulo.toLowerCase().includes(q) || v.predicador.toLowerCase().includes(q) || v.descripcion.toLowerCase().includes(q);
        const matchF = f === 'all' || v.predicador === f;
        return matchQ && matchF;
    }));
}

async function init() {
    try {
        const res = await fetch(VIDEOS_JSON);
        allVideos = await res.json();
        allVideos.sort((a, b) => b.fecha.localeCompare(a.fecha));

        // Featured = primer video
        if (allVideos.length) {
            const f = allVideos[0];
            document.getElementById('featured-iframe').src = `https://www.youtube.com/embed/${f.youtube_id}`;
            document.getElementById('featured-title').textContent = f.titulo;
            document.getElementById('featured-date').textContent = formatDate(f.fecha);
            document.getElementById('featured-preacher').textContent = `🎤 ${f.predicador}`;
            document.getElementById('featured-wrap').style.display = 'block';
        }

        // Filtros por predicador
        const preachers = [...new Set(allVideos.map(v => v.predicador))];
        const filtersEl = document.getElementById('filters');
        preachers.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn'; btn.dataset.filter = p; btn.textContent = p;
            filtersEl.appendChild(btn);
        });
        filtersEl.addEventListener('click', e => {
            if (!e.target.matches('.filter-btn')) return;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
        });

        document.getElementById('search-input').addEventListener('input', applyFilters);

        // Grid muestra todos menos el primero (ya está en featured)
        render(allVideos.slice(1));
    } catch {
        document.getElementById('video-grid').innerHTML = '<div class="empty">⚠️ No se pudo cargar videos.json</div>';
    }
}

init();
// =============================================
// CONFIGURACIÓN
// =============================================
const R2_BASE_URL = 'https://TU-URL-PUBLICA.r2.dev'; // ← tu URL de R2
const SERMONS_JSON = './conquistando.json';
// =============================================

let allSermons = [];
let currentAudio = null, currentCard = null;

function fmt(s) { if (isNaN(s)) return '0:00'; const m = Math.floor(s / 60), sec = Math.floor(s % 60).toString().padStart(2, '0'); return `${m}:${sec}`; }
function formatDate(d) { const [y, m, day] = d.split('-'); const mo = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']; return `${day} ${mo[parseInt(m) - 1]} ${y}`; }

function createCard(sermon, index) {
    const audioUrl = `${R2_BASE_URL}/${sermon.archivo}`;
    const card = document.createElement('div');
    card.className = 'sermon-card';
    card.style.animationDelay = `${index * 0.05}s`;
    const playIcon = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    const pauseIcon = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>';
    card.innerHTML = `
      <div class="card-top">
        <div class="card-date">${formatDate(sermon.fecha)}</div>
        <div class="card-title">${sermon.titulo}</div>
      </div>
      <div class="card-body">
        <div class="card-preacher">🎤 ${sermon.predicador}</div>
        <div class="card-desc">${sermon.descripcion}</div>
        <div class="audio-player">
          <button class="play-btn" aria-label="Reproducir">${playIcon}</button>
          <div class="progress-wrap">
            <div class="progress-bar-track"><div class="progress-bar-fill"></div></div>
            <div class="time-display"><span class="current-time">0:00</span><span class="total-time">0:00</span></div>
          </div>
          <a class="download-btn" href="${audioUrl}" download="${sermon.archivo}" title="Descargar">↓</a>
        </div>
      </div>`;

    const playBtn = card.querySelector('.play-btn');
    const fill = card.querySelector('.progress-bar-fill');
    const track = card.querySelector('.progress-bar-track');
    const curTime = card.querySelector('.current-time');
    const totTime = card.querySelector('.total-time');

    playBtn.addEventListener('click', () => {
        if (currentAudio && currentCard !== card) {
            currentAudio.pause();
            currentCard.querySelector('.play-btn').innerHTML = playIcon;
            currentCard.querySelector('.progress-bar-fill').style.width = '0%';
            currentCard.querySelector('.current-time').textContent = '0:00';
        }
        if (!card._audio) {
            card._audio = new Audio(audioUrl);
            card._audio.addEventListener('timeupdate', () => { fill.style.width = (card._audio.currentTime / card._audio.duration * 100) + '%'; curTime.textContent = fmt(card._audio.currentTime); });
            card._audio.addEventListener('loadedmetadata', () => { totTime.textContent = fmt(card._audio.duration); });
            card._audio.addEventListener('ended', () => { playBtn.innerHTML = playIcon; fill.style.width = '0%'; card._audio.currentTime = 0; });
        }
        if (card._audio.paused) { card._audio.play(); playBtn.innerHTML = pauseIcon; currentAudio = card._audio; currentCard = card; }
        else { card._audio.pause(); playBtn.innerHTML = playIcon; }
    });

    track.addEventListener('click', e => {
        if (!card._audio || !card._audio.duration) return;
        const r = track.getBoundingClientRect();
        card._audio.currentTime = ((e.clientX - r.left) / r.width) * card._audio.duration;
    });

    return card;
}

function renderSermons(list) {
    const grid = document.getElementById('sermon-grid');
    grid.innerHTML = '';
    document.getElementById('showing-count').textContent = `Mostrando ${list.length} de ${allSermons.length}`;
    if (!list.length) { grid.innerHTML = '<div class="empty-state"><div style="font-size:2.5rem">🔍</div><p>No se encontraron sermones.</p></div>'; return; }
    list.forEach((s, i) => grid.appendChild(createCard(s, i)));
}

function applyFilters() {
    const q = document.getElementById('search-input').value.toLowerCase();
    const a = document.querySelector('.filter-btn.active').dataset.filter;
    renderSermons(allSermons.filter(s => {
        const mQ = !q || s.titulo.toLowerCase().includes(q) || s.predicador.toLowerCase().includes(q) || s.descripcion.toLowerCase().includes(q);
        return mQ && (a === 'all' || s.predicador === a);
    }));
}

async function init() {
    try {
        const res = await fetch(SERMONS_JSON);
        allSermons = await res.json();
        allSermons.sort((a, b) => b.fecha.localeCompare(a.fecha));
        const preachers = [...new Set(allSermons.map(s => s.predicador))];
        document.getElementById('total-count').textContent = allSermons.length;
        document.getElementById('preacher-count').textContent = preachers.length;
        const filtersEl = document.getElementById('filters');
        preachers.forEach(p => {
            const btn = document.createElement('button'); btn.className = 'filter-btn'; btn.dataset.filter = p; btn.textContent = p; filtersEl.appendChild(btn);
        });
        filtersEl.addEventListener('click', e => {
            if (!e.target.matches('.filter-btn')) return;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active'); applyFilters();
        });
        document.getElementById('search-input').addEventListener('input', applyFilters);
        renderSermons(allSermons);
    } catch {
        document.getElementById('sermon-grid').innerHTML = '<div class="empty-state"><div style="font-size:2.5rem">⚠️</div><p>No se pudo cargar sermones.json</p></div>';
    }
}

init();
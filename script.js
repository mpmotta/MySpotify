// --- CONFIGURAÇÃO ---
const ITUNES_API = "https://itunes.apple.com/search?media=music&limit=1&term=";

// --- ELEMENTOS DOM ---
const mainView = document.getElementById('main-view');
const audioPlayer = document.getElementById('audio-player');
const splashScreen = document.getElementById('splash-screen');
const appContent = document.getElementById('app-content');

// --- ESTADO ---
let currentQueue = [];
let loadedCache = {}; 
let currentTrackIndex = 0;
let isPlaying = false;
let isFetching = false;
let isShuffle = false;

// 1. INICIALIZAÇÃO
window.addEventListener('load', () => {
    setTimeout(() => {
        if(splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                if(appContent) appContent.style.opacity = '1';
                renderHome();
            }, 500);
        }
    }, 1500);
});

// 2. RENDER HOME
function renderHome() {
    isFetching = false;
    if (typeof playlistsData === 'undefined') return;
    
    let html = `<h2 style="margin-bottom:20px; color:white;">Suas Playlists</h2><div class="grid-container">`;
    playlistsData.forEach(pl => {
        html += `
            <div class="card" onclick="openPlaylist(${pl.id})">
                <img src="${pl.cover}" alt="${pl.title}">
                <h3>${pl.title}</h3>
                </div>`;
    });
    html += `</div>`;
    mainView.innerHTML = html;
}

// 3. ABRIR PLAYLIST
async function openPlaylist(playlistId) {
    const playlist = playlistsData.find(p => p.id === playlistId);
    if (!playlist) return;
    const tracksMap = songsData.filter(t => t.playlistId === playlistId);
    
    currentQueue = []; 
    renderSplitViewSkeleton(playlist, tracksMap.length);

    // LOOP DE CARREGAMENTO
    for (let i = 0; i < tracksMap.length; i++) {
        const mapItem = tracksMap[i];
        let trackData = null;

        if (loadedCache[mapItem.file]) {
            trackData = loadedCache[mapItem.file];
        } else {
            try {
                updateRowStatus(i, "Buscando...", "#1db954");
                const response = await fetch(ITUNES_API + encodeURIComponent(mapItem.query));
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    const info = data.results[0];
                    const highResImage = info.artworkUrl100.replace('100x100bb', '600x600bb');
                    trackData = {
                        fileId: mapItem.file,  
                        title: info.trackName,
                        artist: info.artistName,
                        thumb: highResImage,
                        duration: parseMs(info.trackTimeMillis),
                        isLocal: true 
                    };
                    loadedCache[mapItem.file] = trackData;
                } else {
                    throw new Error("Não encontrado");
                }
            } catch (err) {
                trackData = {
                    fileId: mapItem.file, title: mapItem.query, artist: "Desconhecido",
                    thumb: playlist.cover, duration: "--:--", isLocal: true
                };
            }
            await delay(300);
        }
        currentQueue.push(trackData);
        updateRow(i, trackData, i);
    }
}

// --- FUNÇÕES DE BOTÃO ---
function startPlaylist(shuffleMode) {
    if(currentQueue.length === 0) return alert("Aguarde o carregamento das músicas.");
    
    isShuffle = shuffleMode;
    
    if(isShuffle) {
        const randomIndex = Math.floor(Math.random() * currentQueue.length);
        playLocalTrack(currentQueue[randomIndex], randomIndex);
    } else {
        playLocalTrack(currentQueue[0], 0);
    }
}

// 4. BUSCA
async function performSearch() {
    isFetching = false;
    const input = document.getElementById('search-input');
    if(!input) return;
    const query = input.value;
    if(!query) return;

    mainView.innerHTML = `<h2 style="color:white; margin-bottom:20px;">Busca: "${query}"</h2><div id="search-results-area"><p>Buscando...</p></div>`;

    try {
        const response = await fetch(ITUNES_API + encodeURIComponent(query) + "&limit=12");
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const apiResults = data.results.map(t => ({
                fileId: null, title: t.trackName, artist: t.artistName,
                thumb: t.artworkUrl100, duration: parseMs(t.trackTimeMillis),
                previewUrl: t.previewUrl, isLocal: false
            }));
            renderSearchResultList(apiResults);
        } else {
            mainView.innerHTML += `<p>Nenhum resultado.</p>`;
        }
    } catch (e) { mainView.innerHTML += `<p style="color:red;">Erro.</p>`; }
}

// --- RENDERS ---

function renderSplitViewSkeleton(playlist, totalTracks) {
    let rows = '';
    for(let i=0; i<totalTracks; i++) {
        rows += `<tr id="track-row-${i}"><td style="color:#b3b3b3;">${i+1}</td><td colspan="2" style="color:#555;">Carregando...</td></tr>`;
    }

    mainView.innerHTML = `
        <div class="split-view">
            <div class="left-panel">
                <div class="playlist-header-small">
                    <img src="${playlist.cover}" style="width:100px; height:100px; border-radius:4px;">
                    <div>
                        <p style="font-size:11px; font-weight:bold; color:#b3b3b3;">PLAYLIST</p>
                        <h2 style="font-size:24px; margin:5px 0;">${playlist.title}</h2>
                        </div>
                </div>

                <div class="playlist-buttons">
                    <button class="btn-green" onclick="startPlaylist(false)">TOCAR</button>
                    <button class="btn-transparent" onclick="startPlaylist(true)">ALEATÓRIO</button>
                </div>

                <table class="track-list"><tbody id="playlist-tbody">${rows}</tbody></table>
            </div>

            <div class="right-panel" id="right-panel-content">
                <i class="fab fa-spotify empty-state"></i>
            </div>
        </div>
    `;
}

function updateRow(index, track, queueIndex) {
    const row = document.getElementById(`track-row-${index}`);
    if(row) {
        row.innerHTML = `
            <td style="color:#b3b3b3; width:30px;">${index + 1}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${track.thumb}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;">
                    <div>
                        <div style="font-size:13px; color:white;">${track.title}</div>
                        <div style="font-size:11px; color:#b3b3b3;">${track.artist}</div>
                    </div>
                </div>
            </td>
            <td style="text-align:right; font-size:12px; color:#b3b3b3;">${track.duration}</td>`;
        row.onclick = () => playLocalTrack(track, queueIndex);
        row.style.cursor = "pointer";
    }
}

function updateRowStatus(index, text, color) {
    const row = document.getElementById(`track-row-${index}`);
    if(row) { row.cells[1].innerText = text; row.cells[1].style.color = color; }
}

function renderSearchResultList(tracks) {
    let html = `<table class="track-list"><tbody>`;
    tracks.forEach((track, index) => {
        html += `<tr onclick="playPreview('${track.previewUrl}', '${escapeStr(track.title)}', '${escapeStr(track.artist)}', '${track.thumb}')">
            <td style="width:50px;"><img src="${track.thumb}" style="width:40px; border-radius:4px;"></td>
            <td><div style="color:white;">${track.title}</div><div style="font-size:12px; color:#b3b3b3;">${track.artist}</div></td>
            <td style="text-align:right; color:#b3b3b3;">${track.duration}</td></tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('search-results-area').innerHTML = html;
}

// --- PLAYER SYSTEM ---

function playLocalTrack(track, index) {
    currentTrackIndex = index;
    const mp3Path = `mp3/${track.fileId}.mp3`;
    loadAndPlay(mp3Path, track.title, track.artist, track.thumb);
}

function playPreview(url, title, artist, thumb) {
    loadAndPlay(url, title, artist, thumb);
}

function loadAndPlay(src, title, artist, thumb) {
    audioPlayer.src = src;
    
    // Painel Direita
    const rightPanel = document.getElementById('right-panel-content');
    if(rightPanel) {
        rightPanel.innerHTML = `
            <div class="big-info">
                <h1 class="big-title">${title}</h1>
                <h2 class="big-artist">${artist}</h2>
            </div>
            <img class="big-cover" src="${thumb}" alt="Capa">
        `;
    }

    // Rodapé
    document.getElementById('player-title').innerText = title;
    document.getElementById('player-artist').innerText = artist;
    document.getElementById('player-cover').src = thumb;
    document.getElementById('player-cover').style.display = 'block';

    audioPlayer.play().then(() => { isPlaying = true; updatePlayIcon(); }).catch(console.error);
}

// UTILS
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
function escapeStr(str) { return str ? str.replace(/'/g, "\\'") : ""; }
function parseMs(ms) {
    if(!ms) return "--:--";
    const min = Math.floor(ms / 60000);
    const sec = ((ms % 60000) / 1000).toFixed(0);
    return min + ":" + (sec < 10 ? '0' : '') + sec;
}
function updatePlayIcon() { document.getElementById('play-icon').className = isPlaying ? 'fas fa-pause-circle' : 'fas fa-play-circle'; }
function togglePlay() { audioPlayer.paused ? (audioPlayer.play(), isPlaying=true) : (audioPlayer.pause(), isPlaying=false); updatePlayIcon(); }

function nextTrack() { 
    if(currentQueue.length > 0 && currentQueue[0].isLocal) {
        let next;
        if(isShuffle) {
            next = Math.floor(Math.random() * currentQueue.length);
        } else {
            next = currentTrackIndex + 1; 
            if(next >= currentQueue.length) next = 0; 
        }
        playLocalTrack(currentQueue[next], next);
    }
}

function prevTrack() {
    if(currentQueue.length > 0 && currentQueue[0].isLocal) {
        let prev = currentTrackIndex - 1; 
        if(prev < 0) prev = currentQueue.length - 1; 
        playLocalTrack(currentQueue[prev], prev);
    }
}
audioPlayer.addEventListener('ended', nextTrack);
audioPlayer.addEventListener('timeupdate', () => {
    const bar = document.getElementById('progress-bar');
    if(audioPlayer.duration) {
        bar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        document.getElementById('current-time').innerText = parseMs(audioPlayer.currentTime * 1000);
        document.getElementById('duration').innerText = parseMs(audioPlayer.duration * 1000);
    }
});
document.getElementById('progress-bar').addEventListener('input', (e) => {
    audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
});
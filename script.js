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
let isShuffle = false;
let shuffledOrder = []; 
let shufflePointer = 0; 
let activeLoadSession = 0; 

// --- VISUALIZADOR ---
let audioContext, analyser, dataArray, canvasCtx;
let isAudioContextSetup = false;

// 1. INICIALIZAÇÃO
window.addEventListener('load', () => {
    setTimeout(() => {
        if(splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                if(appContent) appContent.style.opacity = '1';
                renderSidebar();
                renderHome();
            }, 500);
        }
    }, 1500);
});

// --- RENDER SIDEBAR ---
function renderSidebar() {
    const list = document.getElementById('sidebar-playlists');
    if (!list) return;
    list.innerHTML = ''; 
    if (typeof playlistsData !== 'undefined') {
        playlistsData.forEach(pl => {
            const li = document.createElement('li');
            li.innerText = pl.title;
            li.onclick = () => openPlaylist(pl.id);
            list.appendChild(li);
        });
    }
}

// --- RENDER HOME ---
function renderHome() {
    activeLoadSession++; 
    if (typeof playlistsData === 'undefined') return;
    let html = `<h2 style="margin-bottom:20px; color:white;">Suas Playlists</h2><div class="grid-container">`;
    playlistsData.forEach(pl => {
        html += `<div class="card" onclick="openPlaylist(${pl.id})"><img src="${pl.cover}" alt="${pl.title}"><h3>${pl.title}</h3></div>`;
    });
    // Link Todas as Musicas na Home também
    html += `<div class="card" onclick="openAllTracks()"><img src="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Todas"><h3>TODAS</h3></div></div>`;
    mainView.innerHTML = html;
}

// --- ABRIR PLAYLIST ---
async function openPlaylist(playlistId, autoPlayFileId = null) {
    const playlist = playlistsData.find(p => p.id === playlistId);
    if (!playlist) return;
    const tracksMap = songsData.filter(t => t.playlistId === playlistId);
    processTrackList(playlist, tracksMap, autoPlayFileId);
}

async function openAllTracks(autoPlayFileId = null) {
    const virtualPlaylist = { title: "Todas as Músicas", cover: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=600" };
    processTrackList(virtualPlaylist, songsData, autoPlayFileId);
}

// --- LÓGICA DE CARREGAMENTO & TEMPO ---
async function processTrackList(playlistObj, tracksArray, autoPlayFileId = null) {
    activeLoadSession++;
    const currentSession = activeLoadSession;
    currentQueue = []; 
    isShuffle = (autoPlayFileId !== null);
    shuffledOrder = [];
    shufflePointer = 0;
    
    let totalPlaylistMs = 0;

    renderSplitViewSkeleton(playlistObj, tracksArray.length);

    if (autoPlayFileId) {
        // AutoPlay Logic (Busca)
        const targetSongIndex = tracksArray.findIndex(t => t.file === autoPlayFileId);
        if (targetSongIndex !== -1) {
            const mapItem = tracksArray[targetSongIndex];
            let trackData = await fetchTrackData(mapItem, playlistObj.cover);
            if (trackData.rawDuration) totalPlaylistMs += trackData.rawDuration;
            updateTotalTimeDisplay(totalPlaylistMs);

            currentQueue = tracksArray.map(item => ({
                fileId: item.file, title: item.query, artist: "Carregando...",
                thumb: playlistObj.cover, duration: "--:--", isLocal: true, query: item.query
            }));
            generateShuffledOrder();
            const originalIndex = currentQueue.findIndex(x => x.fileId === autoPlayFileId);
            const shuffleIndexWithTarget = shuffledOrder.indexOf(originalIndex);
            shuffledOrder[0] = originalIndex;
            shuffledOrder[shuffleIndexWithTarget] = shuffledOrder[0];
            currentQueue[originalIndex] = trackData;
            playLocalTrack(currentQueue[originalIndex], originalIndex);
            updateRow(originalIndex, trackData, originalIndex);
        }
    }

    for (let i = 0; i < tracksArray.length; i++) {
        if (activeLoadSession !== currentSession) return;
        if (autoPlayFileId && tracksArray[i].file === autoPlayFileId) continue;

        const mapItem = tracksArray[i];
        let trackData;
        if (!autoPlayFileId) {
             trackData = await fetchTrackData(mapItem, playlistObj.cover);
             currentQueue.push(trackData);
             updateRow(i, trackData, i);
        } else {
            trackData = await fetchTrackData(mapItem, playlistObj.cover);
            currentQueue[i] = trackData;
            updateRow(i, trackData, i);
        }

        if (trackData.rawDuration) {
            totalPlaylistMs += trackData.rawDuration;
            updateTotalTimeDisplay(totalPlaylistMs);
        }
    }
}

async function fetchTrackData(mapItem, defaultCover) {
    if (loadedCache[mapItem.file]) return loadedCache[mapItem.file];
    try {
        const response = await fetch(ITUNES_API + encodeURIComponent(mapItem.query));
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const info = data.results[0];
            const highResImage = info.artworkUrl100.replace('100x100bb', '600x600bb');
            const trackData = {
                fileId: mapItem.file, title: info.trackName, artist: info.artistName,
                thumb: highResImage, duration: parseMs(info.trackTimeMillis),
                rawDuration: info.trackTimeMillis, isLocal: true 
            };
            loadedCache[mapItem.file] = trackData;
            return trackData;
        } else { throw new Error("404"); }
    } catch (err) {
        return { fileId: mapItem.file, title: mapItem.query, artist: "Desconhecido", thumb: defaultCover, duration: "--:--", rawDuration: 0, isLocal: true };
    }
}

function updateTotalTimeDisplay(totalMs) {
    const timeElement = document.getElementById('header-total-time');
    if (timeElement) {
        const totalSeconds = Math.floor(totalMs / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        timeElement.innerText = `Duração: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

// 5. BUSCA LOCAL
async function performSearch() {
    activeLoadSession++;
    const input = document.getElementById('search-input');
    if(!input || !input.value) return;
    const query = input.value.toLowerCase();
    input.value = ''; input.blur();

    mainView.innerHTML = `<h2 style="color:white; margin-bottom:20px;">Resultados para "${query}"</h2><div id="search-results-area"></div>`;
    
    // Busca APENAS no songs.js
    const results = songsData.filter(song => song.query.toLowerCase().includes(query));

    if (results.length === 0) {
        document.getElementById('search-results-area').innerHTML = `<p>Nenhuma música encontrada na biblioteca local.</p>`;
        return;
    }
    
    let html = `<table class="track-list"><tbody>`;
    results.forEach((song) => {
        const pl = playlistsData.find(p => p.id === song.playlistId);
        const plName = pl ? pl.title : "Geral";
        // Clica e vai para a playlist contextualizada
        html += `<tr onclick="jumpToContext('${song.playlistId}', '${song.file}')" style="cursor:pointer;">
            <td style="width:40px;"><i class="fas fa-music" style="color:#b3b3b3;"></i></td>
            <td><div style="color:white; font-size:14px;">${song.query}</div><div style="font-size:11px; color:#1db954;">${plName}</div></td>
            <td style="text-align:right;"><i class="fas fa-play-circle" style="color:white;"></i></td></tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('search-results-area').innerHTML = html;
}

function jumpToContext(playlistId, fileId) { openPlaylist(parseInt(playlistId), fileId); }

// --- RENDER SPLIT VIEW (Com VU Meter e Header Time) ---
function renderSplitViewSkeleton(playlist, totalTracks) {
    let rows = '';
    for(let i=0; i<totalTracks; i++) {
        rows += `<tr id="track-row-${i}"><td style="color:#b3b3b3;">${i+1}</td><td colspan="2" style="color:#333;">...</td></tr>`;
    }

    mainView.innerHTML = `
        <div class="split-view">
            <div class="left-panel">
                <div class="playlist-header-small">
                    <img src="${playlist.cover}" style="width:100px; height:100px; border-radius:4px; object-fit:cover;">
                    <div class="header-text-area">
                        <p style="font-size:11px; font-weight:bold; color:#b3b3b3;">PLAYLIST</p>
                        <div class="header-row">
                            <h2 class="header-title">${playlist.title}</h2>
                            <span id="header-total-time" class="header-time">0:00</span>
                        </div>
                    </div>
                </div>
                <div class="playlist-buttons">
                    <button class="btn-green" onclick="startPlaylist(false)">TOCAR</button>
                    <button class="btn-transparent" onclick="startPlaylist(true)">ALEATÓRIO</button>
                </div>
                <table class="track-list"><tbody id="playlist-tbody">${rows}</tbody></table>
            </div>
            
            <div class="right-panel" id="right-panel-content">
                <div class="big-info">
                    <h1 id="big-title" class="big-title">Escolha uma música</h1>
                    <h2 id="big-artist" class="big-artist">--</h2>
                </div>
                <img id="big-cover" class="big-cover" src="${playlist.cover}" alt="Capa">
                
                <div id="arcade-timer" class="arcade-timer">00 : 00</div>
                
                <canvas id="visualizer"></canvas>
            </div>
        </div>
    `;
    initVisualizerCanvas();
}

function updateRow(index, track, queueIndex) {
    const row = document.getElementById(`track-row-${index}`);
    if(row) {
        row.innerHTML = `<td style="color:#b3b3b3; width:30px;">${index + 1}</td><td><div style="display:flex; align-items:center; gap:10px;"><img src="${track.thumb}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;"><div><div style="font-size:13px; color:white;">${track.title}</div><div style="font-size:11px; color:#b3b3b3;">${track.artist}</div></div></div></td><td style="text-align:right; font-size:12px; color:#b3b3b3;">${track.duration}</td>`;
        row.onclick = () => { isShuffle = false; playLocalTrack(track, queueIndex); };
    }
}

function updateRowStatus(index, text, color) {
    const row = document.getElementById(`track-row-${index}`);
    if(row) { row.cells[1].innerText = text; row.cells[1].style.color = color; }
}

// --- AUDIO & VISUALIZADOR ---
function setupAudioContext() {
    if (isAudioContextSetup) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 64; 
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        isAudioContextSetup = true;
        drawVisualizer();
    } catch(e) { console.log("Web Audio API Error:", e); }
}

function drawVisualizer() {
    const canvas = document.getElementById('visualizer');
    if(!canvas || !analyser) { requestAnimationFrame(drawVisualizer); return; }
    
    canvasCtx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for(let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;
        if (barHeight > 80) canvasCtx.fillStyle = '#ff3333';
        else canvasCtx.fillStyle = '#1DB954';

        const blockHeight = 5;
        const spacing = 2;
        const numBlocks = Math.floor(barHeight / (blockHeight + spacing));

        for (let j = 0; j < numBlocks; j++) {
            canvasCtx.fillStyle = (j > 12) ? '#ff3333' : '#4ff78d';
            canvasCtx.fillRect(x, HEIGHT - (j * (blockHeight + spacing)), barWidth - 2, blockHeight);
        }
        x += barWidth + 1;
    }
}

function initVisualizerCanvas() {
    const canvas = document.getElementById('visualizer');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function playLocalTrack(track, index) {
    if (!isShuffle) currentTrackIndex = index;
    const allRows = document.querySelectorAll('.track-list tr');
    allRows.forEach(row => row.classList.remove('playing-yellow'));
    const activeRow = document.getElementById(`track-row-${index}`);
    if(activeRow) activeRow.classList.add('playing-yellow');

    const mp3Path = `mp3/${track.fileId}.mp3`;
    loadAndPlay(mp3Path, track.title, track.artist, track.thumb);
}

function loadAndPlay(src, title, artist, thumb) {
    audioPlayer.src = src;
    const rightPanel = document.getElementById('right-panel-content');
    if(rightPanel) {
        document.getElementById('big-title').innerText = title;
        document.getElementById('big-artist').innerText = artist;
        document.getElementById('big-cover').src = thumb;
    }
    document.getElementById('player-title').innerText = title;
    document.getElementById('player-artist').innerText = artist;
    document.getElementById('player-cover').src = thumb;
    document.getElementById('player-cover').style.display = 'block';

    setupAudioContext();
    if(audioContext && audioContext.state === 'suspended') audioContext.resume();

    audioPlayer.play().then(() => { isPlaying = true; updatePlayIcon(); }).catch(console.error);
}

function updateCountdown() {
    const timerElement = document.getElementById('arcade-timer');
    if (timerElement && audioPlayer.duration) {
        const remaining = audioPlayer.duration - audioPlayer.currentTime;
        timerElement.innerText = parseMs(remaining * 1000);
    }
}

// UTILS
function parseMs(ms) {
    if(!ms || isNaN(ms)) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins} : ${secs < 10 ? '0' : ''}${secs}`;
}
function escapeStr(str) { return str ? str.replace(/'/g, "\\'") : ""; }
function updatePlayIcon() { document.getElementById('play-icon').className = isPlaying ? 'fas fa-pause-circle' : 'fas fa-play-circle'; }
function togglePlay() { 
    if(audioContext && audioContext.state === 'suspended') audioContext.resume();
    audioPlayer.paused ? (audioPlayer.play(), isPlaying=true) : (audioPlayer.pause(), isPlaying=false); 
    updatePlayIcon(); 
}

function nextTrack() { 
    if(currentQueue.length > 0 && currentQueue[0].isLocal) {
        if(isShuffle) {
            shufflePointer++;
            if(shufflePointer >= shuffledOrder.length) { finishPlaylist(); return; }
            const realIndex = shuffledOrder[shufflePointer];
            playLocalTrack(currentQueue[realIndex], realIndex);
        } else {
            let next = currentTrackIndex + 1; 
            if(next >= currentQueue.length) { finishPlaylist(); return; }
            currentTrackIndex = next;
            playLocalTrack(currentQueue[next], next);
        }
    }
}

function prevTrack() {
    if(currentQueue.length > 0 && currentQueue[0].isLocal) {
        let prev = currentTrackIndex - 1; 
        if(prev < 0) prev = currentQueue.length - 1; 
        playLocalTrack(currentQueue[prev], prev);
    }
}

function finishPlaylist() {
    audioPlayer.pause(); isPlaying = false; updatePlayIcon();
    const endSound = new Audio('assets/end.mp3'); endSound.play().catch(e => console.log(e));
    const modal = document.getElementById('end-modal'); if(modal) modal.style.display = 'flex';
}

function startPlaylist(activateShuffle) {
    if(currentQueue.length === 0) return alert("Carregando...");
    isShuffle = activateShuffle;
    if(isShuffle) {
        generateShuffledOrder(); shufflePointer = 0;
        playLocalTrack(currentQueue[shuffledOrder[0]], shuffledOrder[0]);
    } else {
        playLocalTrack(currentQueue[0], 0);
    }
}

function generateShuffledOrder() {
    shuffledOrder = currentQueue.map((_, i) => i);
    for (let i = shuffledOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOrder[i], shuffledOrder[j]] = [shuffledOrder[j], shuffledOrder[i]];
    }
}

audioPlayer.addEventListener('ended', nextTrack);
audioPlayer.addEventListener('timeupdate', () => {
    const bar = document.getElementById('progress-bar');
    if(audioPlayer.duration) {
        bar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        document.getElementById('current-time').innerText = parseMs(audioPlayer.currentTime * 1000);
        document.getElementById('duration').innerText = parseMs(audioPlayer.duration * 1000);
        updateCountdown();
    }
});
document.getElementById('progress-bar').addEventListener('input', (e) => {
    audioPlayer.currentTime = (e.target.value / 100) * audioPlayer.duration;
});
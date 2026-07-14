// Lấy các element từ HTML
const container = document.getElementById('audio-container');
const globalPlayerContainer = document.getElementById('global-player-container');
const globalAudio = document.getElementById('global-audio');
const playerTitle = document.getElementById('player-title');

// Trạng thái hiện tại
let currentTrackId = null;
const LAST_PLAYED_KEY = 'podcast_last_played_track';

// Hàm render danh sách
function renderAudioList() {
    container.innerHTML = ''; // Clear cũ nếu có
    
    audioData.forEach(item => {
        const card = document.createElement('div');
        // Gắn id cho card để dễ update style (active)
        card.id = `card-${item.id}`;
        card.className = 'audio-card bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between group';
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'flex items-center gap-3';
        
        const icon = document.createElement('div');
        icon.className = 'w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors';
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>`;

        const title = document.createElement('h2');
        title.className = 'text-base font-semibold text-gray-700';
        title.textContent = item.title;

        titleContainer.appendChild(icon);
        titleContainer.appendChild(title);
        card.appendChild(titleContainer);

        // Sự kiện click để chọn bài
        card.addEventListener('click', () => {
            playTrack(item.id);
        });

        container.appendChild(card);
    });
}

// Cập nhật UI danh sách (đánh dấu bài đang phát)
function updateListUI() {
    audioData.forEach(item => {
        const card = document.getElementById(`card-${item.id}`);
        if(card) {
            if(item.id === currentTrackId) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        }
    });
}

// Logic phát bài hát
function playTrack(trackId) {
    const track = audioData.find(t => t.id === trackId);
    if (!track) return;

    // Nếu bấm lại chính bài đang phát
    if (currentTrackId === trackId) {
        if (globalAudio.paused) {
            globalAudio.play();
        } else {
            globalAudio.pause();
        }
        return;
    }

    // Đổi bài mới
    currentTrackId = trackId;
    localStorage.setItem(LAST_PLAYED_KEY, trackId);
    
    // Cập nhật UI
    playerTitle.textContent = track.title;
    updateListUI();
    
    // Hiển thị thanh player nếu nó đang bị ẩn (trượt lên)
    globalPlayerContainer.classList.remove('translate-y-full');

    // Nạp source mới
    globalAudio.src = track.src;
    
    // Đợi loadedmetadata thì mới set thời gian và play
    globalAudio.addEventListener('loadedmetadata', function onLoaded() {
        // Chỉ chạy 1 lần khi load source mới
        globalAudio.removeEventListener('loadedmetadata', onLoaded);
        
        const storageKey = `history_${trackId}`;
        const savedTime = localStorage.getItem(storageKey);
        
        if (savedTime !== null && !isNaN(savedTime)) {
            const timeToSeek = parseFloat(savedTime);
            if (timeToSeek > 0 && timeToSeek < globalAudio.duration) {
                globalAudio.currentTime = timeToSeek;
            }
        } else {
            globalAudio.currentTime = 0;
        }
        
        globalAudio.play().catch(e => console.log("Auto-play prevented by browser: ", e));
    });
}

// Setup các sự kiện cho Global Player
function setupGlobalPlayer() {
    const btnRewind = document.getElementById('btn-rewind');
    const btnForward = document.getElementById('btn-forward');

    if (btnRewind) {
        btnRewind.addEventListener('click', () => {
            if (globalAudio.currentTime) {
                globalAudio.currentTime = Math.max(0, globalAudio.currentTime - 10);
            }
        });
    }

    if (btnForward) {
        btnForward.addEventListener('click', () => {
            if (globalAudio.currentTime || globalAudio.currentTime === 0) {
                globalAudio.currentTime = Math.min(globalAudio.duration || 0, globalAudio.currentTime + 10);
            }
        });
    }

    globalAudio.addEventListener('timeupdate', () => {
        if (!currentTrackId) return;
        const storageKey = `history_${currentTrackId}`;
        
        if(globalAudio.currentTime > 0 && globalAudio.currentTime < globalAudio.duration) {
            localStorage.setItem(storageKey, globalAudio.currentTime);
        }
    });

    globalAudio.addEventListener('ended', () => {
        if (!currentTrackId) return;
        const storageKey = `history_${currentTrackId}`;
        localStorage.removeItem(storageKey);
        globalAudio.currentTime = 0;
    });
}

// Khôi phục phiên làm việc trước đó
function restoreSession() {
    const lastTrackId = localStorage.getItem(LAST_PLAYED_KEY);
    if (lastTrackId) {
        const track = audioData.find(t => t.id === lastTrackId);
        if (track) {
            currentTrackId = lastTrackId;
            playerTitle.textContent = track.title;
            updateListUI();
            
            // Cuộn đến tập đang phát
            const activeCard = document.getElementById(`card-${lastTrackId}`);
            if (activeCard) {
                // Thêm setTimeout nhẹ để đảm bảo DOM đã render và scroll mượt mà hơn
                setTimeout(() => {
                    activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
            
            globalPlayerContainer.classList.remove('translate-y-full');
            globalAudio.src = track.src;
            
            // Xử lý tua thời gian khi load metadata
            globalAudio.addEventListener('loadedmetadata', function onLoaded() {
                globalAudio.removeEventListener('loadedmetadata', onLoaded);
                
                const storageKey = `history_${lastTrackId}`;
                const savedTime = localStorage.getItem(storageKey);
                
                if (savedTime !== null && !isNaN(savedTime)) {
                    const timeToSeek = parseFloat(savedTime);
                    if (timeToSeek > 0 && timeToSeek < globalAudio.duration) {
                        globalAudio.currentTime = timeToSeek;
                    }
                }
                // Lưu ý: Không tự động phát (play) ở đây vì trình duyệt chặn tự phát khi vừa tải trang
            });
        }
    }
}

// Khởi chạy ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    renderAudioList();
    setupGlobalPlayer();
    restoreSession();
});

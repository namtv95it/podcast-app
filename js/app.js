// Lấy các element từ HTML
const container = document.getElementById('audio-container');
const globalPlayerContainer = document.getElementById('global-player-container');
const globalAudio = document.getElementById('global-audio');
const playerTitle = document.getElementById('player-title');

// Trạng thái hiện tại
let currentTrackId = null;
const LAST_PLAYED_KEY = 'podcast_last_played_track';
const VOLUME_KEY = 'podcast_volume';

// Hàm render danh sách
function renderAudioList() {
    container.innerHTML = ''; // Clear cũ nếu có
    
    audioData.forEach(item => {
        const card = document.createElement('div');
        // Gắn id cho card để dễ update style (active)
        card.id = `card-${item.id}`;
        card.className = 'audio-card bg-gray-50 border border-gray-300 rounded-xl p-4 flex items-center justify-between group';
        
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
    document.title = `${track.title} - Phàm Nhân Tu Tiên`;
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
                // Bỏ qua 30s đầu (quảng cáo)
                globalAudio.currentTime = Math.max(30, timeToSeek);
            } else {
                globalAudio.currentTime = 30;
            }
        } else {
            globalAudio.currentTime = 30; // Bỏ qua 30s đầu
        }
        
        globalAudio.play().catch(e => console.log("Auto-play prevented by browser: ", e));
    });
}

// Hàm format thời gian (giây) sang dạng MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Setup các sự kiện cho Global Player
function setupGlobalPlayer() {
    const btnRewind10 = document.getElementById('btn-rewind-10');
    const btnForward10 = document.getElementById('btn-forward-10');
    const btnRewind30 = document.getElementById('btn-rewind-30');
    const btnForward30 = document.getElementById('btn-forward-30');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const progressBar = document.getElementById('progress-bar');
    const timeCurrent = document.getElementById('time-current');
    const timeDuration = document.getElementById('time-duration');
    const btnMute = document.getElementById('btn-mute');
    const iconVolUp = document.getElementById('icon-vol-up');
    const iconVolMute = document.getElementById('icon-vol-mute');
    const volumeBar = document.getElementById('volume-bar');

    if (btnRewind10) {
        btnRewind10.addEventListener('click', () => {
            if (globalAudio.currentTime) {
                globalAudio.currentTime = Math.max(0, globalAudio.currentTime - 10);
            }
        });
    }
    
    if (btnRewind30) {
        btnRewind30.addEventListener('click', () => {
            if (globalAudio.currentTime) {
                globalAudio.currentTime = Math.max(0, globalAudio.currentTime - 30);
            }
        });
    }

    if (btnForward10) {
        btnForward10.addEventListener('click', () => {
            if (globalAudio.currentTime || globalAudio.currentTime === 0) {
                globalAudio.currentTime = Math.min(globalAudio.duration || 0, globalAudio.currentTime + 10);
            }
        });
    }
    
    if (btnForward30) {
        btnForward30.addEventListener('click', () => {
            if (globalAudio.currentTime || globalAudio.currentTime === 0) {
                globalAudio.currentTime = Math.min(globalAudio.duration || 0, globalAudio.currentTime + 30);
            }
        });
    }

    if (btnPlayPause) {
        btnPlayPause.addEventListener('click', () => {
            if (!currentTrackId) return;
            if (globalAudio.paused) {
                globalAudio.play();
            } else {
                globalAudio.pause();
            }
        });
    }

    // Xử lý Volume
    if (volumeBar) {
        // Khôi phục volume từ Local Storage nếu có
        const savedVolume = localStorage.getItem(VOLUME_KEY);
        if (savedVolume !== null) {
            volumeBar.value = savedVolume;
            globalAudio.volume = savedVolume;
            if (savedVolume == 0) {
                globalAudio.muted = true;
                if (iconVolUp && iconVolMute) {
                    iconVolUp.classList.add('hidden');
                    iconVolMute.classList.remove('hidden');
                }
            }
        } else {
            globalAudio.volume = volumeBar.value; // Khởi tạo mặc định
        }

        volumeBar.addEventListener('input', (e) => {
            const vol = e.target.value;
            globalAudio.volume = vol;
            globalAudio.muted = false;
            localStorage.setItem(VOLUME_KEY, vol); // Lưu vào Local Storage
            
            if (iconVolUp && iconVolMute) {
                if (vol == 0) {
                    globalAudio.muted = true;
                    iconVolUp.classList.add('hidden');
                    iconVolMute.classList.remove('hidden');
                } else {
                    iconVolUp.classList.remove('hidden');
                    iconVolMute.classList.add('hidden');
                }
            }
        });
    }

    if (btnMute) {
        btnMute.addEventListener('click', () => {
            globalAudio.muted = !globalAudio.muted;
            if (iconVolUp && iconVolMute) {
                if (globalAudio.muted) {
                    iconVolUp.classList.add('hidden');
                    iconVolMute.classList.remove('hidden');
                    if (volumeBar) {
                        volumeBar.value = 0;
                    }
                    localStorage.setItem(VOLUME_KEY, 0);
                } else {
                    iconVolUp.classList.remove('hidden');
                    iconVolMute.classList.add('hidden');
                    if (globalAudio.volume == 0) globalAudio.volume = 1;
                    if (volumeBar) volumeBar.value = globalAudio.volume;
                    localStorage.setItem(VOLUME_KEY, globalAudio.volume);
                }
            }
        });
    }

    globalAudio.addEventListener('play', () => {
        if(iconPlay && iconPause) {
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
        }
    });

    globalAudio.addEventListener('pause', () => {
        if(iconPlay && iconPause) {
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
        }
    });

    globalAudio.addEventListener('loadedmetadata', () => {
        if(progressBar) progressBar.max = globalAudio.duration;
        if(timeDuration) timeDuration.textContent = formatTime(globalAudio.duration);
    });

    if(progressBar) {
        progressBar.addEventListener('input', () => {
            if(timeCurrent) timeCurrent.textContent = formatTime(progressBar.value);
        });
        
        progressBar.addEventListener('change', () => {
            globalAudio.currentTime = progressBar.value;
        });
    }

    globalAudio.addEventListener('timeupdate', () => {
        if (!currentTrackId) return;
        
        // Cập nhật progress bar (Chỉ cập nhật khi không bị user đang bấm giữ/drag)
        if(progressBar && !progressBar.matches(':active')) {
            progressBar.value = globalAudio.currentTime;
        }
        
        if(timeCurrent) timeCurrent.textContent = formatTime(globalAudio.currentTime);

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
        
        if(iconPlay && iconPause) {
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
        }
        if(progressBar) progressBar.value = 0;
        if(timeCurrent) timeCurrent.textContent = "00:00";

        // Tự động chuyển sang bài tiếp theo
        const currentIndex = audioData.findIndex(t => t.id === currentTrackId);
        if (currentIndex !== -1 && currentIndex < audioData.length - 1) {
            const nextTrack = audioData[currentIndex + 1];
            playTrack(nextTrack.id);
        }
    });

    // Bắt sự kiện bàn phím (Space, ArrowLeft, ArrowRight)
    document.addEventListener('keydown', (e) => {
        // Bỏ qua nếu người dùng đang gõ phím vào ô input/textarea (phòng ngừa)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.code === 'Space') {
            e.preventDefault(); // Ngăn trình duyệt cuộn trang
            if (!currentTrackId) return;
            
            if (globalAudio.paused) {
                globalAudio.play();
            } else {
                globalAudio.pause();
            }
        } else if (e.code === 'ArrowLeft') {
            if (!currentTrackId) return;
            globalAudio.currentTime = Math.max(0, globalAudio.currentTime - 10);
        } else if (e.code === 'ArrowRight') {
            if (!currentTrackId) return;
            globalAudio.currentTime = Math.min(globalAudio.duration || 0, globalAudio.currentTime + 10);
        }
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
            document.title = `${track.title} - Phàm Nhân Tu Tiên`;
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
                        globalAudio.currentTime = Math.max(30, timeToSeek); // Bỏ qua 30s đầu
                    } else {
                        globalAudio.currentTime = 30;
                    }
                } else {
                    globalAudio.currentTime = 30;
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

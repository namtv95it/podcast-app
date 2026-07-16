// Lấy các element từ HTML
const container = document.getElementById('audio-container');
const globalPlayerContainer = document.getElementById('global-player-container');
const globalAudio = document.getElementById('global-audio');
const playerTitle = document.getElementById('player-title');

// Trạng thái hiện tại
let currentTrackId = null;
const LAST_PLAYED_KEY = 'podcast_last_played_track';
const VOLUME_KEY = 'podcast_volume';
const MUTED_KEY = 'podcast_muted';
const THEME_KEY = 'podcast_theme';
const SPEED_KEY = 'podcast_playback_speed';
const AUTOPLAY_KEY = 'podcast_autoplay';

// Hàm render danh sách
function renderAudioList() {
    container.innerHTML = ''; // Clear cũ nếu có
    
    audioData.forEach(item => {
        const card = document.createElement('div');
        // Gắn id cho card để dễ update style (active)
        card.id = `card-${item.id}`;
        card.className = 'audio-card bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between group transition-colors';
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'flex items-center gap-3';
        
        const icon = document.createElement('div');
        icon.className = 'w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors';
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>`;

        const title = document.createElement('h2');
        title.className = 'text-base font-semibold text-gray-700 dark:text-gray-200 transition-colors';
        title.textContent = item.title;

        titleContainer.appendChild(icon);
        titleContainer.appendChild(title);
        card.appendChild(titleContainer);

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'flex items-center gap-2 flex-shrink-0 ml-2';

        const saveBtn = document.createElement('button');
        saveBtn.id = `save-btn-${item.id}`;
        saveBtn.className = `p-1.5 text-blue-600 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded transition-colors flex-shrink-0 ${currentTrackId === item.id ? '' : 'hidden'}`;
        saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>`;
        saveBtn.title = 'Lưu thời gian hiện tại';

        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-orange-600 bg-orange-100 hover:bg-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 rounded transition-colors flex-shrink-0';
        
        const checkSavedTime = () => {
            const savedTime = localStorage.getItem(`saved_bookmark_${item.id}`);
            if (savedTime !== null && !isNaN(savedTime)) {
                restoreBtn.style.display = 'inline-flex';
                restoreBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg><span>${formatTime(parseFloat(savedTime))}</span>`;
                restoreBtn.title = 'Hoàn tác thời gian đã lưu';
            } else {
                restoreBtn.style.display = 'none';
            }
        };
        checkSavedTime();

        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn sự kiện click phát bài
            let timeToSave = 0;
            if (currentTrackId === item.id) {
                timeToSave = globalAudio.currentTime;
            } else {
                const historyTime = localStorage.getItem(`history_${item.id}`);
                if (historyTime !== null && !isNaN(historyTime)) {
                    timeToSave = parseFloat(historyTime);
                } else {
                    alert('Vui lòng phát bài này một lúc để có thể lưu thời gian!');
                    return;
                }
            }
            localStorage.setItem(`saved_bookmark_${item.id}`, timeToSave);
            checkSavedTime();
            // alert(`Đã lưu thời gian: ${formatTime(timeToSave)} cho bài "${item.title}"`);
        });

        restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const savedTime = localStorage.getItem(`saved_bookmark_${item.id}`);
            if (savedTime !== null && !isNaN(savedTime)) {
                if (currentTrackId === item.id) {
                    globalAudio.currentTime = parseFloat(savedTime);
                    if (globalAudio.paused) globalAudio.play();
                } else {
                    // Cập nhật history để playTrack nhảy đến đúng thời gian này
                    localStorage.setItem(`history_${item.id}`, savedTime);
                    playTrack(item.id);
                }
            }
        });

        actionsContainer.appendChild(saveBtn);
        actionsContainer.appendChild(restoreBtn);
        card.appendChild(actionsContainer);

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
        const saveBtn = document.getElementById(`save-btn-${item.id}`);
        if(card) {
            if(item.id === currentTrackId) {
                card.classList.add('active');
                if (saveBtn) saveBtn.classList.remove('hidden');
            } else {
                card.classList.remove('active');
                if (saveBtn) saveBtn.classList.add('hidden');
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
    
    // Cuộn danh sách đến tập đang phát
    const activeCard = document.getElementById(`card-${trackId}`);
    if (activeCard) {
        setTimeout(() => {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
    
    // Hiển thị thanh player nếu nó đang bị ẩn (trượt lên)
    globalPlayerContainer.classList.remove('translate-y-full');

    // Nạp source mới
    globalAudio.src = track.src;
    
    // Đợi loadedmetadata thì mới set thời gian và play
    globalAudio.addEventListener('loadedmetadata', function onLoaded() {
        // Chỉ chạy 1 lần khi load source mới
        globalAudio.removeEventListener('loadedmetadata', onLoaded);
        
        // Cập nhật lại tốc độ phát vì trình duyệt có thể reset khi đổi source
        const savedSpeed = localStorage.getItem(SPEED_KEY);
        if (savedSpeed !== null) {
            globalAudio.playbackRate = parseFloat(savedSpeed);
        }
        
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
    const btnPrevTrack = document.getElementById('btn-prev-track');
    const btnNextTrack = document.getElementById('btn-next-track');
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
    const playbackSpeed = document.getElementById('playback-speed');
    const btnAutoPlay = document.getElementById('btn-autoplay');
    const autoPlayText = document.getElementById('autoplay-text');

    // Xử lý Auto Play
    if (btnAutoPlay) {
        let isAutoPlay = localStorage.getItem(AUTOPLAY_KEY) !== 'false';
        
        const updateAutoPlayUI = () => {
            if (isAutoPlay) {
                autoPlayText.textContent = "Bật";
                btnAutoPlay.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300', 'border-gray-200', 'dark:border-gray-700');
                btnAutoPlay.classList.add('bg-blue-100', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400', 'border-blue-200', 'dark:border-blue-800');
            } else {
                autoPlayText.textContent = "Tắt";
                btnAutoPlay.classList.remove('bg-blue-100', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400', 'border-blue-200', 'dark:border-blue-800');
                btnAutoPlay.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300', 'border-gray-200', 'dark:border-gray-700');
            }
        };

        updateAutoPlayUI();

        btnAutoPlay.addEventListener('click', () => {
            isAutoPlay = !isAutoPlay;
            localStorage.setItem(AUTOPLAY_KEY, isAutoPlay.toString());
            updateAutoPlayUI();
        });
    }

    // Xử lý Tốc độ phát
    if (playbackSpeed) {
        const savedSpeed = localStorage.getItem(SPEED_KEY);
        if (savedSpeed !== null) {
            globalAudio.playbackRate = parseFloat(savedSpeed);
            playbackSpeed.value = savedSpeed;
        }

        playbackSpeed.addEventListener('change', (e) => {
            const speed = parseFloat(e.target.value);
            globalAudio.playbackRate = speed;
            localStorage.setItem(SPEED_KEY, speed.toString());
        });
    }

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

    if (btnPrevTrack) {
        btnPrevTrack.addEventListener('click', () => {
            if (!currentTrackId) return;
            const currentIndex = audioData.findIndex(t => t.id === currentTrackId);
            if (currentIndex > 0) {
                const prevTrack = audioData[currentIndex - 1];
                playTrack(prevTrack.id);
            }
        });
    }

    if (btnNextTrack) {
        btnNextTrack.addEventListener('click', () => {
            if (!currentTrackId) return;
            const currentIndex = audioData.findIndex(t => t.id === currentTrackId);
            if (currentIndex !== -1 && currentIndex < audioData.length - 1) {
                const nextTrack = audioData[currentIndex + 1];
                playTrack(nextTrack.id);
            }
        });
    }

    // Xử lý Volume
    if (volumeBar) {
        // Khôi phục volume và trạng thái mute từ Local Storage
        const savedVolume = localStorage.getItem(VOLUME_KEY);
        const savedMuted = localStorage.getItem(MUTED_KEY);

        if (savedVolume !== null) {
            globalAudio.volume = savedVolume;
            volumeBar.value = savedVolume;
        } else {
            globalAudio.volume = 1;
            volumeBar.value = 1;
        }

        if (savedMuted === 'true') {
            globalAudio.muted = true;
            if (iconVolUp && iconVolMute) {
                iconVolUp.classList.add('hidden');
                iconVolMute.classList.remove('hidden');
            }
        } else {
            globalAudio.muted = false;
        }

        // Nếu volume = 0 mà không bị mute thì vẫn hiển thị icon mute
        if (globalAudio.volume == 0 && !globalAudio.muted) {
            if (iconVolUp && iconVolMute) {
                iconVolUp.classList.add('hidden');
                iconVolMute.classList.remove('hidden');
            }
        }

        volumeBar.addEventListener('input', (e) => {
            const vol = e.target.value;
            globalAudio.volume = vol;
            localStorage.setItem(VOLUME_KEY, vol);

            // Tự động bỏ mute nếu kéo volume > 0, hoặc ép mute nếu kéo về 0
            if (vol > 0) {
                globalAudio.muted = false;
                localStorage.setItem(MUTED_KEY, 'false');
                if (iconVolUp && iconVolMute) {
                    iconVolUp.classList.remove('hidden');
                    iconVolMute.classList.add('hidden');
                }
            } else {
                globalAudio.muted = true;
                localStorage.setItem(MUTED_KEY, 'true');
                if (iconVolUp && iconVolMute) {
                    iconVolUp.classList.add('hidden');
                    iconVolMute.classList.remove('hidden');
                }
            }
        });
    }

    if (btnMute) {
        btnMute.addEventListener('click', () => {
            globalAudio.muted = !globalAudio.muted;
            localStorage.setItem(MUTED_KEY, globalAudio.muted.toString());
            
            if (iconVolUp && iconVolMute) {
                if (globalAudio.muted) {
                    iconVolUp.classList.add('hidden');
                    iconVolMute.classList.remove('hidden');
                    // Không đổi value của thanh volumeBar để giữ lại mức âm lượng trước khi tắt
                } else {
                    iconVolUp.classList.remove('hidden');
                    iconVolMute.classList.add('hidden');
                    
                    // Nếu unmute mà mức volume vẫn đang là 0, thì ép lên mức 1 để có tiếng
                    if (globalAudio.volume == 0) {
                        globalAudio.volume = 1;
                        if (volumeBar) volumeBar.value = 1;
                        localStorage.setItem(VOLUME_KEY, 1);
                    }
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

    let lastSaveTime = 0;
    globalAudio.addEventListener('timeupdate', () => {
        if (!currentTrackId) return;
        
        // Cập nhật progress bar (Chỉ cập nhật khi không bị user đang bấm giữ/drag)
        if(progressBar && !progressBar.matches(':active')) {
            progressBar.value = globalAudio.currentTime;
        }
        
        if(timeCurrent) timeCurrent.textContent = formatTime(globalAudio.currentTime);

        const storageKey = `history_${currentTrackId}`;
        if(globalAudio.currentTime > 0 && globalAudio.currentTime < globalAudio.duration) {
            const now = Date.now();
            // Lưu trạng thái 5 giây 1 lần thay vì lưu liên tục
            if (now - lastSaveTime >= 5000) {
                localStorage.setItem(storageKey, globalAudio.currentTime);
                lastSaveTime = now;
            }
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

        // Tự động chuyển sang bài tiếp theo nếu AutoPlay được bật
        const isAutoPlay = localStorage.getItem(AUTOPLAY_KEY) !== 'false';
        if (isAutoPlay) {
            const currentIndex = audioData.findIndex(t => t.id === currentTrackId);
            if (currentIndex !== -1 && currentIndex < audioData.length - 1) {
                const nextTrack = audioData[currentIndex + 1];
                playTrack(nextTrack.id);
            }
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
                
                // Cập nhật lại tốc độ phát
                const savedSpeed = localStorage.getItem(SPEED_KEY);
                if (savedSpeed !== null) {
                    globalAudio.playbackRate = parseFloat(savedSpeed);
                }
                
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

// Setup Theme (Dark/Light mode)
function setupTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    if (!themeToggleBtn) return;

    // Khởi tạo
    const savedTheme = localStorage.getItem(THEME_KEY);
    // Mặc định là sáng nếu chưa có
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        lightIcon.classList.remove('hidden'); // Đang ở Dark -> Hiện icon mặt trời
        darkIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        darkIcon.classList.remove('hidden'); // Đang ở Light -> Hiện icon mặt trăng
        lightIcon.classList.add('hidden');
    }

    // Lắng nghe click
    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            localStorage.setItem(THEME_KEY, 'dark');
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
        } else {
            localStorage.setItem(THEME_KEY, 'light');
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
        }
    });
}

// Khởi chạy ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    renderAudioList();
    setupGlobalPlayer();
    restoreSession();
});

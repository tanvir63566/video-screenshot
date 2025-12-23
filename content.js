/**============================================
 * VIDEO SCREENSHOT EXTENSION v15.0 (Deep Climber)
 * Fixes Swiper/Slider sites like xFree, TikTok, etc.
 *=============================================**/

// 1. Dynamic Style Generator
function getButtonStyle() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    // Base Style
    let css = `
        position: absolute;
        z-index: 2147483647; 
        display: grid;
        place-items: center; 
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        opacity: 0; 
        cursor: pointer;
        transition: all 0.2s ease;
        pointer-events: auto;
    `;

    // --- POSITIONING TWEAKS ---
    if (hostname.includes('facebook.com') || url.includes('youtube.com/shorts/')) {
        css += `top: 85px; right: 16px;`;
    } 
    else if (hostname.includes('instagram.com')) {
        css += `top: 55px; right: 8px;`;
    }
    else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        css += `top: 15px; right: 15px;`;
    }
    else {
        // Standard safe spot for most sites
        css += `top: 20px; right: 20px;`;
    }

    return css;
}

// 2. Icons
const CAMERA_ICON = `
<svg fill="white" height="22" viewBox="0 0 24 24" width="22" style="display: block; pointer-events: none;">
    <path d="M12 9.75A4.25 4.25 0 1 0 16.25 14 4.25 4.25 0 0 0 12 9.75Zm0 7A2.75 2.75 0 1 1 14.75 14 2.75 2.75 0 0 1 12 16.75Z"></path>
    <path d="M20.5 7h-2.12a2 2 0 0 1-1.85-1.25L15.93 4.2a2 2 0 0 0-1.85-1.2h-4.16a2 2 0 0 0-1.85 1.2l-.6 1.55A2 2 0 0 1 5.62 7H3.5A2.5 2.5 0 0 0 1 9.5v9A2.5 2.5 0 0 0 3.5 21h17a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 20.5 7Zm1 11.5a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h2.12a3.51 3.51 0 0 0 3.24-2.18l.6-1.55a.5.5 0 0 1 .46-.32h4.16a.5.5 0 0 1 .46.32l.6 1.55a3.51 3.51 0 0 0 3.24 2.18H20.5a1 1 0 0 1 1 1Z"></path>
</svg>`;

const SUCCESS_ICON = `
<svg fill="#4caf50" height="22" viewBox="0 0 24 24" width="22" style="display: block; pointer-events: none;">
    <polyline points="20 6 9 17 4 12" fill="none" stroke="#4caf50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
</svg>`;

// 3. Capture Engine
function captureFrame(video) {
    if (video.videoWidth === 0 || video.videoHeight === 0) return false;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const site = window.location.hostname.replace('www.', '').split('.')[0];
            link.download = `${site}_screenshot_${timestamp}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png');
        return true;
    } catch (err) {
        console.error("Capture Failed:", err);
        return false;
    }
}

// 4. Injector
function addDownloadButton(video) {
    let container = video.parentElement;
    
    // --- SMART CONTAINER FINDER (The "Deep Climber") ---
    // We attempt to find the "Main Card" or "Slide" wrapper.
    // This fixes xFree, xxxfollow, TikTok, etc. where the video is deep inside a Swiper slide.

    let bestContainer = null;
    let currentEl = video.parentElement;

    // 1. YouTube Check (Always specific)
    if (window.location.hostname.includes('youtube.com')) {
        bestContainer = video.closest('#movie_player') || video.closest('.html5-video-player');
    } 
    // 2. Generic "Deep Search" for Swipers/Slides
    else {
        // Climb up 7 levels max to find a "Slide" or "Item" container
        for (let i = 0; i < 7; i++) {
            if (!currentEl) break;
            
            const classes = (currentEl.className || "").toString().toLowerCase();
            
            // Keywords that indicate this is the main wrapper we want
            if (classes.includes('swiper-slide') || 
                classes.includes('item') || 
                classes.includes('card') || 
                classes.includes('video-wrapper') ||
                classes.includes('active')) {
                bestContainer = currentEl;
                // Don't break immediately, sometimes the "active" slide is 1 level higher. 
                // But usually the first one we hit is good.
                break; 
            }
            currentEl = currentEl.parentElement;
        }
    }

    // Fallback: If no fancy container found, use the direct parent or grandparent
    if (!bestContainer) {
        bestContainer = video.parentElement?.parentElement || video.parentElement;
    }
    
    container = bestContainer; // Assign our winner

    if (!container || container.querySelector('.univ-frame-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'univ-frame-btn';
    btn.innerHTML = CAMERA_ICON;
    btn.style.cssText = getButtonStyle();
    btn.title = "Screenshot";

    // --- HOVER LOGIC ---
    // We attach listeners to the CONTAINER found above.
    // This means hovering ANYWHERE on the slide/card will trigger the button.
    
    container.addEventListener('mouseenter', () => btn.style.opacity = '1');
    container.addEventListener('mouseleave', () => btn.style.opacity = '0');
    
    // Also attach to the button itself so it doesn't flicker
    btn.onmouseenter = () => {
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1.1)';
    };
    btn.onmouseleave = () => {
        btn.style.transform = 'scale(1)';
    };

    // Click Handler
    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = 'scale(1.1)', 150);

        if (captureFrame(video)) {
            btn.innerHTML = SUCCESS_ICON;
            setTimeout(() => btn.innerHTML = CAMERA_ICON, 1500);
        }
    };

    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    container.appendChild(btn);
}

// 5. Watcher
function initObserver() {
    document.querySelectorAll('video').forEach(addDownloadButton);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.tagName === 'VIDEO') {
                        addDownloadButton(node);
                    } else if (node.nodeType === 1 && node.querySelectorAll) {
                        node.querySelectorAll('video').forEach(addDownloadButton);
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

initObserver();

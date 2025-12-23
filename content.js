/**============================================
 * UNIVERSAL FRAME GRABBER v10.0 (The "Everywhere" Edition)
 * Works on: YouTube, Reddit, X, Instagram, Facebook, Adult Sites, etc.
 *=============================================**/

// 1. Universal Style (Hidden by default, appears on hover)
const buttonStyle = `
    position: absolute;
    top: 15px;
    right: 15px;
    z-index: 2147483647; /* Maximum possible Z-Index to beat YouTube layers */
    
    /* Layout */
    display: grid;
    place-items: center; 
    width: 40px;
    height: 40px;
    border-radius: 50%;
    
    /* Glassmorphism */
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    /* Interaction */
    opacity: 0; /* Hidden by default */
    cursor: pointer;
    transition: opacity 0.3s ease, transform 0.2s ease, background-color 0.2s;
    pointer-events: auto;
`;

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
    // Prepare canvas
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Canvas is empty (Likely DRM/CORS blocked)");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");
      // Clean host name for filename (e.g. "youtube_frame_...")
      const site = window.location.hostname.replace("www.", "").split(".")[0];
      link.download = `${site}_frame_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
    return true;
  } catch (err) {
    console.error("Capture Failed:", err);
    // Fallback alert for sites like Netflix that block screenshots
    alert(
      "Cannot capture this video. It might be DRM protected or strictly CORS blocked."
    );
    return false;
  }
}

// 4. Injector
function addDownloadButton(video) {
  // A. Find the best container (Crucial for YouTube/Reddit)
  // We try to attach to the video's parent, but on some sites (YouTube)
  // we need to go up a few levels to find the main "player" container
  let container = video.parentElement;

  // YouTube Specific Fix: Attach to the movie-player container if possible
  if (window.location.hostname.includes("youtube.com")) {
    const ytPlayer =
      video.closest("#movie_player") || video.closest(".html5-video-player");
    if (ytPlayer) container = ytPlayer;
  }

  // B. Check if we already injected
  if (container.querySelector(".univ-frame-btn")) return;

  // C. Create Button
  const btn = document.createElement("button");
  btn.className = "univ-frame-btn";
  btn.innerHTML = CAMERA_ICON;
  btn.style.cssText = buttonStyle;
  btn.title = "Extract Frame";

  // D. Hover Logic (The "Ghost" Interaction)
  // Show button when mouse enters the VIDEO CONTAINER
  container.addEventListener("mouseenter", () => {
    btn.style.opacity = "1";
  });
  // Hide button when mouse leaves the VIDEO CONTAINER
  container.addEventListener("mouseleave", () => {
    btn.style.opacity = "0";
  });
  // Also keep button visible if hovering over the button itself
  btn.onmouseenter = () => {
    btn.style.opacity = "1";
    btn.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    btn.style.transform = "scale(1.1)";
  };
  btn.onmouseleave = () => {
    btn.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    btn.style.transform = "scale(1)";
  };

  // E. Click Logic
  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop YouTube from pausing on click

    btn.style.transform = "scale(0.9)";
    setTimeout(() => (btn.style.transform = "scale(1.1)"), 150);

    const success = captureFrame(video);
    if (success) {
      btn.innerHTML = SUCCESS_ICON;
      setTimeout(() => (btn.innerHTML = CAMERA_ICON), 1500);
    }
  };

  // F. CSS Fixes for Container
  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  container.appendChild(btn);
}

// 5. Universal Watcher
function initObserver() {
  // Initial Scan
  document.querySelectorAll("video").forEach(addDownloadButton);

  // Continuous Scan
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          // Check direct video nodes
          if (node.nodeType === 1 && node.tagName === "VIDEO") {
            addDownloadButton(node);
          }
          // Check nested video nodes (Reddit/Twitter often nest them deep)
          else if (node.nodeType === 1 && node.querySelectorAll) {
            node.querySelectorAll("video").forEach(addDownloadButton);
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

initObserver();

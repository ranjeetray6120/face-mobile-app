/**
 * Event Photo Gallery - Guest Face Recognition Web App
 * Handles QR code scanning, face capture, and photo retrieval
 */

const API_BASE_URL = 'http://192.168.1.3:8080/api';

// Application State
let appState = {
    eventId: null,
    matchedPhotos: [],
    selectedPhotos: [],
    stream: null,
    isCapturing: false
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Extract event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    appState.eventId = urlParams.get('eventId') || extractEventIdFromPath();

    if (!appState.eventId) {
        showError('Event ID not found. Please scan a valid QR code.');
        return;
    }

    renderApp();
    loadEventInfo();
}

/**
 * Extract event ID from URL path
 */
function extractEventIdFromPath() {
    const pathMatch = window.location.pathname.match(/\/event\/(\d+)/);
    return pathMatch ? pathMatch[1] : null;
}

/**
 * Render the main application UI
 */
function renderApp() {
    const root = document.getElementById('root');
    root.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>📸 Event Photo Gallery</h1>
                <p>Find and download your photos from the event</p>
            </div>

            <div id="eventInfo" class="event-info">
                <p>Loading event information...</p>
            </div>

            <div id="message"></div>

            <div class="face-scan-section">
                <h2>Step 1: Scan Your Face</h2>
                <p>Allow camera access and capture your face to find your photos</p>
                
                <div class="video-container">
                    <video id="video" playsinline></video>
                    <canvas id="canvas"></canvas>
                </div>

                <div class="video-controls">
                    <button class="btn btn-primary" id="startCameraBtn" onclick="startCamera()">
                        📷 Start Camera
                    </button>
                    <button class="btn btn-secondary" id="stopCameraBtn" onclick="stopCamera()" style="display:none;">
                        ⏹️ Stop Camera
                    </button>
                    <button class="btn btn-success" id="captureFaceBtn" onclick="captureFace()" style="display:none;">
                        📸 Capture Face
                    </button>
                </div>
            </div>

            <div id="gallerySection" style="display:none;">
                <div class="gallery-section">
                    <h2>Step 2: Your Matched Photos</h2>
                    <div id="gallery" class="gallery"></div>
                </div>

                <div class="download-section">
                    <h3>Download Options</h3>
                    <button class="btn btn-primary" onclick="downloadSelected()">
                        ⬇️ Download Selected
                    </button>
                    <button class="btn btn-success" onclick="downloadAll()">
                        📦 Download All as ZIP
                    </button>
                    <button class="btn btn-secondary" onclick="resetApp()">
                        🔄 Scan Again
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Load event information
 */
async function loadEventInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/guest/events/${appState.eventId}`);

        if (response.status === 404) {
            showError('This event has expired. Data is automatically deleted after 24 hours.');
            const eventInfoDiv = document.getElementById('eventInfo');
            eventInfoDiv.innerHTML = `<h2 class="expired-msg">⚠️ This event has expired</h2>`;
            // Disable camera start if event is expired
            const startBtn = document.getElementById('startCameraBtn');
            if (startBtn) startBtn.disabled = true;
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load event info');
        }

        const data = await response.text(); // Backend returns String for getEventInfo

        const eventInfoDiv = document.getElementById('eventInfo');
        eventInfoDiv.innerHTML = `
            <h2>Event ID: ${appState.eventId}</h2>
            <p>${data}</p>
        `;

        // Automatically start camera to ask for permission ("direct access")
        startCamera();
    } catch (error) {
        console.error('Error loading event info:', error);
        showError('Unable to load event information. It may have expired.');
    }
}

/**
 * Start camera stream
 */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });

        const video = document.getElementById('video');
        video.srcObject = stream;
        appState.stream = stream;

        // Update button visibility
        document.getElementById('startCameraBtn').style.display = 'none';
        document.getElementById('stopCameraBtn').style.display = 'inline-block';
        document.getElementById('captureFaceBtn').style.display = 'inline-block';

        showInfo('Camera started. Click "Capture Face" when ready.');
    } catch (error) {
        console.error('Error accessing camera:', error);

        let errorMessage = 'Unable to access camera. Please check permissions.';

        // Check for specific secure context error
        if (window.isSecureContext === false) {
            errorMessage = `
                ⚠️ <b>Camera Access Blocked</b><br><br>
                Browsers block camera access on <b>http://</b> (except localhost).<br><br>
                <b>To fix on Chrome Mobile:</b><br>
                1. Go to <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code><br>
                2. Enter <code>http://${window.location.hostname}:8080</code><br>
                3. Set to "Enabled" and Relaunch.<br><br>
                Or use a tunneling tool like <b>ngrok</b> for HTTPS.
            `;
            showError(errorMessage); // Use innerHTML in showError to render tags
        } else {
            showError(errorMessage);
        }
    }
}

/**
 * Stop camera stream
 */
function stopCamera() {
    if (appState.stream) {
        appState.stream.getTracks().forEach(track => track.stop());
        appState.stream = null;
    }

    document.getElementById('startCameraBtn').style.display = 'inline-block';
    document.getElementById('stopCameraBtn').style.display = 'none';
    document.getElementById('captureFaceBtn').style.display = 'none';

    showInfo('Camera stopped.');
}

/**
 * Capture face from video stream
 */
async function captureFace() {
    try {
        appState.isCapturing = true;
        document.getElementById('captureFaceBtn').disabled = true;

        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame to canvas
        context.drawImage(video, 0, 0);

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            await matchFace(blob);
            appState.isCapturing = false;
            document.getElementById('captureFaceBtn').disabled = false;
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Error capturing face:', error);
        showError('Failed to capture face. Please try again.');
        appState.isCapturing = false;
        document.getElementById('captureFaceBtn').disabled = false;
    }
}

/**
 * Match captured face with event photos
 */
async function matchFace(imageBlob) {
    try {
        showInfo('Analyzing your face... Please wait.');

        const formData = new FormData();
        formData.append('event_id', appState.eventId);
        formData.append('image', imageBlob, 'face.jpg');

        const response = await fetch(`${API_BASE_URL}/guest/events/${appState.eventId}/match-face`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to match face');
        }

        const matchedPhotos = await response.json();

        if (matchedPhotos.length === 0) {
            showWarning('No matching photos found. Please try again with a clearer face image.');
            return;
        }

        appState.matchedPhotos = matchedPhotos;
        displayMatchedPhotos();
        stopCamera();
        showSuccess(`Found ${matchedPhotos.length} photos matching your face!`);
    } catch (error) {
        console.error('Error matching face:', error);
        showError('Failed to match face. Please try again.');
    }
}

/**
 * Display matched photos in gallery
 */
function displayMatchedPhotos() {
    const gallerySection = document.getElementById('gallerySection');
    const gallery = document.getElementById('gallery');

    if (appState.matchedPhotos.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No Photos Found</h3>
                <p>No photos matched your face. Please try scanning again.</p>
            </div>
        `;
    } else {
        gallery.innerHTML = appState.matchedPhotos.map((photo, index) => `
            <div class="photo-card">
                <img src="${photo.downloadUrl}" alt="Photo ${index + 1}" 
                     onclick="viewPhoto('${photo.downloadUrl}', ${photo.id})">
                <div class="photo-card-footer">
                    <p>Photo #${photo.id}</p>
                    <button class="btn btn-primary" onclick="togglePhotoSelection(${photo.id})">
                        ☑️ Select
                    </button>
                    <button class="btn btn-success" onclick="downloadPhoto('${photo.downloadUrl}', ${photo.id})">
                        ⬇️ Download
                    </button>
                </div>
            </div>
        `).join('');
    }

    gallerySection.style.display = 'block';
}

/**
 * Toggle photo selection
 */
function togglePhotoSelection(photoId) {
    const index = appState.selectedPhotos.indexOf(photoId);
    if (index > -1) {
        appState.selectedPhotos.splice(index, 1);
    } else {
        appState.selectedPhotos.push(photoId);
    }

    // Update UI
    const photoCards = document.querySelectorAll('.photo-card');
    photoCards.forEach((card, index) => {
        const photo = appState.matchedPhotos[index];
        if (appState.selectedPhotos.includes(photo.id)) {
            card.style.opacity = '1';
            card.style.border = '3px solid #667eea';
        } else {
            card.style.opacity = '0.7';
            card.style.border = 'none';
        }
    });
}

/**
 * View photo in modal
 */
function viewPhoto(url, photoId) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Photo #${photoId}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <img src="${url}" alt="Photo ${photoId}">
            </div>
            <div style="text-align: center;">
                <button class="btn btn-success" onclick="downloadPhoto('${url}', ${photoId})">
                    ⬇️ Download
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Download single photo
 */
async function downloadPhoto(url, photoId) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `photo_${photoId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Error downloading photo:', error);
        showError('Failed to download photo.');
    }
}

/**
 * Download selected photos
 */
async function downloadSelected() {
    if (appState.selectedPhotos.length === 0) {
        showWarning('Please select at least one photo to download.');
        return;
    }

    const selectedPhotos = appState.matchedPhotos.filter(p => appState.selectedPhotos.includes(p.id));
    for (const photo of selectedPhotos) {
        await downloadPhoto(photo.downloadUrl, photo.id);
    }
}

/**
 * Download all photos as ZIP
 */
async function downloadAll() {
    try {
        showInfo('Preparing ZIP file... This may take a moment.');

        // Note: This is a simplified implementation
        // In production, you would use a library like JSZip
        for (const photo of appState.matchedPhotos) {
            await downloadPhoto(photo.downloadUrl, photo.id);
        }

        showSuccess('All photos downloaded!');
    } catch (error) {
        console.error('Error downloading photos:', error);
        showError('Failed to download photos.');
    }
}

/**
 * Reset application
 */
function resetApp() {
    appState.matchedPhotos = [];
    appState.selectedPhotos = [];
    document.getElementById('gallerySection').style.display = 'none';
    document.getElementById('startCameraBtn').style.display = 'inline-block';
    document.getElementById('stopCameraBtn').style.display = 'none';
    document.getElementById('captureFaceBtn').style.display = 'none';
    clearMessages();
}

/**
 * Show success message
 */
function showSuccess(message) {
    showMessage(message, 'success');
}

/**
 * Show error message
 */
function showError(message) {
    showMessage(message, 'error');
}

/**
 * Show info message
 */
function showInfo(message) {
    showMessage(message, 'info');
}

/**
 * Show warning message
 */
function showWarning(message) {
    showMessage(message, 'error');
}

/**
 * Show message
 */
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
        setTimeout(clearMessages, 5000);
    }
}

/**
 * Clear messages
 */
function clearMessages() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.innerHTML = '';
    }
}

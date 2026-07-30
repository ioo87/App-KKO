/* =========================================================
   SCREEN NAVIGATION
========================================================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  if (id === 'screen-menu') renderHistory();
}

/* =========================================================
   TOAST NOTIFICATIONS — replaces the browser's alert().
   Every message here is a fixed string or built with textContent,
   never innerHTML, so nothing user-controlled can inject markup.
========================================================= */
const toastStack = document.getElementById('toastStack');

function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.textContent = message;
  toastStack.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 220);
  }, 3200);
}

/* =========================================================
   CONFIRM MODAL — replaces the browser's confirm().
========================================================= */
const confirmBackdrop = document.getElementById('confirmBackdrop');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

function showConfirm(message) {
  return new Promise((resolve) => {
    confirmMessage.textContent = message;
    confirmBackdrop.classList.add('active');

    function cleanup(result) {
      confirmBackdrop.classList.remove('active');
      confirmOkBtn.removeEventListener('click', onOk);
      confirmCancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }

    confirmOkBtn.addEventListener('click', onOk);
    confirmCancelBtn.addEventListener('click', onCancel);
  });
}

/* =========================================================
   SHARED PROGRESS BAR HELPERS (used by both tools)
========================================================= */
function setProgress(fillEl, textEl, labelEl, pct, label) {
  fillEl.classList.remove('indeterminate');
  fillEl.style.width = pct + '%';
  textEl.textContent = pct + '%';
  if (label !== undefined) labelEl.textContent = label;
}

function setProgressIndeterminate(fillEl, textEl, labelEl, label) {
  // Clear the inline width so the CSS ".indeterminate" class (which sets its
  // own width + sliding animation) can take over — an inline style would
  // otherwise always win over the class and freeze the bar.
  fillEl.style.width = '';
  fillEl.classList.add('indeterminate');
  textEl.textContent = 'กำลังประมวลผล...';
  if (label !== undefined) labelEl.textContent = label;
}

/* =========================================================
   RECENT HISTORY (menu screen) — stored locally only, never
   sent anywhere. Just filenames + timestamps, not the files.
========================================================= */
const HISTORY_KEY = 'kko-history';
const HISTORY_MAX = 10;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function addHistoryEntry(type, name) {
  const history = loadHistory();
  history.unshift({ type, name, time: Date.now() });
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)));
  } catch (e) {
    // Storage full or unavailable (e.g. private browsing) — history just
    // won't persist this session, nothing else is affected.
  }
}

function relativeTime(timestamp) {
  const diffMin = Math.round((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return 'เมื่อสักครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชม.ที่แล้ว`;
  return `${Math.round(diffHr / 24)} วันที่แล้ว`;
}

function renderHistory() {
  const list = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  const history = loadHistory();

  list.querySelectorAll('.history-item').forEach(el => el.remove());

  if (history.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  history.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const icon = document.createElement('span');
    icon.className = 'history-icon';
    icon.textContent = entry.type === 'pdf' ? '📄' : '🎵';

    const name = document.createElement('span');
    name.className = 'history-name';
    name.textContent = entry.name; // textContent — entry.name may be a
                                    // user-typed title, never inserted as HTML

    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = relativeTime(entry.time);

    li.appendChild(icon);
    li.appendChild(name);
    li.appendChild(time);
    list.appendChild(li);
  });
}

document.getElementById('historyClearBtn').addEventListener('click', async () => {
  const proceed = await showConfirm('ล้างประวัติการใช้งานทั้งหมด?');
  if (!proceed) return;
  try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
  renderHistory();
  showToast('ล้างประวัติแล้ว');
});

/* =========================================================
   SIGN IN
   ---------------------------------------------------------
   This runs entirely on the device — no external requests,
   no server. That's what makes it work instantly on any
   phone, any network, even fully offline. See README.md for
   how to wire up real Google accounts once this is hosted on
   your own domain.
========================================================= */
let currentUser = null;

document.getElementById('googleLoginBtn').addEventListener('click', () => {
  const btn = document.getElementById('googleLoginBtn');
  const loading = document.getElementById('authLoading');
  btn.style.display = 'none';
  loading.style.display = 'flex';

  setTimeout(() => {
    currentUser = { name: 'ผู้ใช้' };
    loading.style.display = 'none';
    btn.style.display = 'flex';
    enterApp();
  }, 900);
});

function enterApp() {
  if (!currentUser) return;
  document.getElementById('menuUserName').textContent = currentUser.name;
  document.getElementById('menuAvatar').textContent = currentUser.name.trim().charAt(0).toUpperCase();
  showScreen('screen-menu');
}

document.getElementById('signOutBtn').addEventListener('click', () => {
  currentUser = null;
  showScreen('screen-login');
});

/* =========================================================
   MENU → TRACKS → WORKSPACE (tab bar)
========================================================= */
function openWorkspace(tab) {
  showScreen('screen-workspace');
  setActiveTab(tab);
}

function setActiveTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === 'panel-' + tab);
  });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
});

const trackMp3 = document.getElementById('trackMp3');
trackMp3.addEventListener('click', () => openWorkspace('mp3'));
trackMp3.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWorkspace('mp3'); }
});

const trackPdf = document.getElementById('trackPdf');
trackPdf.addEventListener('click', () => openWorkspace('pdf'));
trackPdf.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWorkspace('pdf'); }
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
  resetApp();
  resetPdfApp();
  showScreen('screen-menu');
});

/* =========================================================
   Small shared drag & drop wiring helper — highlights the drop
   zone on dragover and hands the dropped file(s) to a callback.
========================================================= */
function wireDropZone(zoneEl, onFiles) {
  ['dragenter', 'dragover'].forEach(evt => {
    zoneEl.addEventListener(evt, (e) => {
      e.preventDefault();
      zoneEl.classList.add('drag-over');
    });
  });
  ['dragleave', 'dragend'].forEach(evt => {
    zoneEl.addEventListener(evt, () => zoneEl.classList.remove('drag-over'));
  });
  zoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    zoneEl.classList.remove('drag-over');
    onFiles(e.dataTransfer.files);
  });
}

/* =========================================================
   MP4 → MP3 CONVERTER
   (decodes the MP4's audio track and re-packages it as a
   playable audio file.
   Note: this produces WAV-encoded audio saved with an .mp3
   name/extension, not a true MPEG-encoded MP3 — real MP3
   encoding needs an encoder library, e.g. lamejs, which can
   be added later if you want byte-accurate MP3 output.)
========================================================= */
const mp4file = document.getElementById('mp4file');
const uploadAreaLabel = document.getElementById('uploadAreaLabel');
const coverart = document.getElementById('coverart');
const videoPreviewBox = document.getElementById('videoPreviewBox');
const videoPlayer = document.getElementById('videoPlayer');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const coverBtnLabel = document.getElementById('coverBtnLabel');

const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const convertBtn = document.getElementById('convertBtn');
const audioPlayer = document.getElementById('audioPlayer');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const mp3ProgressFill = document.getElementById('mp3ProgressFill');
const mp3ProgressText = document.getElementById('mp3ProgressText');
const mp3LoadingLabel = document.getElementById('mp3LoadingLabel');

let currentVideoUrl = "";
let currentAudioUrl = "";
let audioBlobResult = null;
let currentVideoFile = null;

// One shared AudioContext, reused across conversions. Creating a fresh
// AudioContext every click and never closing it can exhaust the browser's
// audio-context limit on lower-end phones after just a few conversions.
let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioCtx;
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB hard cap — beyond this a low-spec
                                           // phone (4GB RAM) is very likely to run out
                                           // of memory decoding the whole file in one go

function handleMp4File(file) {
  if (!file) return;
  // accept="video/mp4" is a UI hint only — a drag-drop or "all files" pick
  // can bypass it, so the real reported type is always checked here too.
  if (!file.type.startsWith('video/')) {
    showToast("ไฟล์นี้ไม่ใช่วิดีโอนะเพื่อน ลองเลือกไฟล์ MP4 ใหม่", 'error');
    return;
  }
  if (file.size > MAX_VIDEO_SIZE) {
    showToast("ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 500MB) เครื่องสเปคต่ำอาจค้างหรือแฮงก์ได้", 'error');
    return;
  }
  currentVideoFile = file;
  currentVideoUrl = URL.createObjectURL(file);
  videoPlayer.src = currentVideoUrl;
  fileNameDisplay.textContent = "ไฟล์: " + file.name;
  videoPreviewBox.style.display = 'block';
}

mp4file.addEventListener('change', function (e) {
  handleMp4File(e.target.files[0]);
});
wireDropZone(uploadAreaLabel, (files) => handleMp4File(files && files[0]));

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB — plenty for a cover image

function handleCoverFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast("ไฟล์นี้ไม่ใช่รูปภาพนะเพื่อน ลองเลือกไฟล์ใหม่", 'error');
    return;
  }
  if (file.size > MAX_COVER_SIZE) {
    showToast("รูปปกใหญ่เกินไป (จำกัดไม่เกิน 10MB)", 'error');
    return;
  }
  // textContent, not innerHTML — file.name comes from the user's filesystem
  // and can contain arbitrary characters, so it must never be inserted as HTML.
  coverBtnLabel.textContent = `✅ เลือกรูปปกแล้ว: ${file.name.substring(0, 15)}...`;
  coverBtnLabel.style.color = "var(--accent-soft)";
  coverBtnLabel.style.borderColor = "var(--accent)";
}

coverart.addEventListener('change', function (e) {
  handleCoverFile(e.target.files[0]);
});
wireDropZone(coverBtnLabel, (files) => handleCoverFile(files && files[0]));

function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  let result;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const bufferLen = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLen);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/mp3' });
}

function interleave(inputL, inputR) {
  let length = inputL.length + inputR.length;
  let result = new Float32Array(length);
  let index = 0, inputIndex = 0;
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Reads a file with real progress (FileReader exposes byte-level progress
// events, unlike file.arrayBuffer() which gives no progress at all).
function readFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsArrayBuffer(file);
  });
}

convertBtn.addEventListener('click', async function () {
  if (!currentVideoFile) {
    showToast("เพื่อน! อย่าลืมเลือกไฟล์ MP4 ก่อนนะ", 'error');
    return;
  }
  const file = currentVideoFile;

  const isLargeFile = file.size > 200 * 1024 * 1024; // ~200MB
  if (isLargeFile) {
    const proceed = await showConfirm("ไฟล์นี้มีขนาดใหญ่ อาจใช้เวลานานหรือค้างได้บนเครื่องสเปคต่ำ ต้องการแปลงต่อไหม?");
    if (!proceed) return;
  }

  uploadSection.style.display = 'none';
  loadingSection.style.display = 'block';
  setProgress(mp3ProgressFill, mp3ProgressText, mp3LoadingLabel, 0, 'กำลังอ่านไฟล์...');

  try {
    // Reading the file is the slowest part on a big file / slow storage, and
    // the one phase where the browser actually gives us real progress — so
    // real progress is shown for 0–55%, then an honest "processing" state
    // for decode+encode, which the Web Audio API doesn't expose progress for.
    const arrayBuffer = await readFileWithProgress(file, (fraction) => {
      setProgress(mp3ProgressFill, mp3ProgressText, mp3LoadingLabel, Math.round(fraction * 55), 'กำลังอ่านไฟล์...');
    });

    setProgressIndeterminate(mp3ProgressFill, mp3ProgressText, mp3LoadingLabel, 'กำลังถอดรหัสเสียง...');
    const audioCtx = getAudioContext();
    const decodedAudio = await audioCtx.decodeAudioData(arrayBuffer);

    setProgress(mp3ProgressFill, mp3ProgressText, mp3LoadingLabel, 92, 'กำลังแปลงไฟล์...');
    audioBlobResult = audioBufferToWavBlob(decodedAudio);
    currentAudioUrl = URL.createObjectURL(audioBlobResult);
    setProgress(mp3ProgressFill, mp3ProgressText, mp3LoadingLabel, 100, 'เสร็จสิ้น');

    addHistoryEntry('mp3', (file.name || 'song').replace(/\.[^./]+$/, ''));

    setTimeout(() => {
      loadingSection.style.display = 'none';
      resultSection.style.display = 'block';
      audioPlayer.src = currentAudioUrl;
    }, 350);

  } catch (err) {
    console.error(err);
    loadingSection.style.display = 'none';
    uploadSection.style.display = 'block';
    showToast("เกิดข้อผิดพลาดในการแยกเสียง ลองเลือกไฟล์อื่นดูนะเพื่อน", 'error');
  }
});

function sanitizeFileName(name) {
  // Strip characters that are invalid or risky in filenames across
  // Windows/macOS/Linux, collapse whitespace, and cap the length.
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .trim()
    .slice(0, 80);
}

downloadBtn.addEventListener('click', function () {
  if (!audioBlobResult) return;
  const a = document.createElement('a');
  a.href = currentAudioUrl;

  let finalFileName = 'song.mp3';
  const titleInput = sanitizeFileName(document.getElementById('songtitle').value);
  if (titleInput !== '') {
    finalFileName = titleInput + '.mp3';
  }

  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

shareBtn.addEventListener('click', async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'ฟังเพลงนี้สิ!',
        text: 'ฉันเพิ่งแปลงไฟล์เสียงนี้ผ่าน KKO.com',
        url: window.location.href
      });
    } catch (err) {
      console.log('ยกเลิกการแชร์');
    }
  } else {
    showToast('เบราว์เซอร์ของคุณไม่รองรับการแชร์');
  }
});

document.getElementById('reconvertLink').addEventListener('click', resetApp);

function resetApp() {
  resultSection.style.display = 'none';
  uploadSection.style.display = 'block';
  videoPreviewBox.style.display = 'none';
  mp4file.value = "";
  coverart.value = "";
  coverBtnLabel.textContent = `🖼️ แตะเพื่อเลือกรูปปก (หรือลากมาวาง)`;
  coverBtnLabel.style.color = "var(--text-muted)";
  coverBtnLabel.style.borderColor = "var(--border-soft)";
  audioBlobResult = null;
  currentVideoFile = null;
  setProgress(mp3ProgressFill, mp3ProgressText, mp3LoadingLabel, 0, 'กำลังแปลงเสียง...');
}

/* =========================================================
   IMG → PDF CONVERTER
   Multiple images in, one PDF out — each image gets its own
   A4 page, auto-scaled and centered so nothing is stretched
   or cut off. Uses jsPDF (loaded from cdnjs in index.html).
========================================================= */
const imgfiles = document.getElementById('imgfiles');
const imgUploadLabel = document.getElementById('imgUploadLabel');
const thumbGrid = document.getElementById('thumbGrid');
const imgCountEl = document.getElementById('imgCount');

const pdfUploadSection = document.getElementById('pdfUploadSection');
const pdfLoadingSection = document.getElementById('pdfLoadingSection');
const pdfResultSection = document.getElementById('pdfResultSection');
const convertPdfBtn = document.getElementById('convertPdfBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const previewPdfBtn = document.getElementById('previewPdfBtn');
const sharePdfBtn = document.getElementById('sharePdfBtn');
const pdfPageSummary = document.getElementById('pdfPageSummary');
const pdfProgressFill = document.getElementById('pdfProgressFill');
const pdfProgressText = document.getElementById('pdfProgressText');
const pdfLoadingLabel = document.getElementById('pdfLoadingLabel');

const MAX_IMAGES = 40;                    // a sensible ceiling per PDF — each image
                                           // gets decoded + redrawn onto a canvas in
                                           // memory, which adds up fast on a 4GB phone
const MAX_IMAGE_SIZE = 25 * 1024 * 1024;  // 25MB per photo

let selectedImages = []; // [{ file, thumbUrl }]
let pdfBlobResult = null;
let pdfBlobUrl = "";

function handleImgFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    // Same defense-in-depth as the other file inputs: never trust accept=""
    // alone, always verify the real reported type before touching the file.
    if (!file.type.startsWith('image/')) {
      showToast(`ข้าม "${file.name}" เพราะไม่ใช่ไฟล์รูปภาพ`, 'error');
      continue;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      showToast(`ข้าม "${file.name}" เพราะไฟล์ใหญ่เกิน 25MB`, 'error');
      continue;
    }
    if (selectedImages.length >= MAX_IMAGES) {
      showToast(`เลือกได้สูงสุด ${MAX_IMAGES} รูปต่อ PDF หนึ่งไฟล์`, 'error');
      break;
    }
    selectedImages.push({ file, thumbUrl: URL.createObjectURL(file) });
  }
  renderThumbs();
}

imgfiles.addEventListener('change', function (e) {
  handleImgFiles(e.target.files);
  imgfiles.value = ""; // clear so picking the exact same file(s) again still fires 'change'
});
wireDropZone(imgUploadLabel, (files) => handleImgFiles(files));

function renderThumbs() {
  // Every node below is built with createElement/textContent/src — never
  // string-concatenated HTML — so a crafted filename can't inject markup.
  thumbGrid.innerHTML = '';
  selectedImages.forEach((item, index) => {
    const cell = document.createElement('div');
    cell.className = 'thumb-item';

    const img = document.createElement('img');
    img.src = item.thumbUrl;
    img.alt = '';
    cell.appendChild(img);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'thumb-remove';
    removeBtn.setAttribute('aria-label', 'ลบรูปนี้');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeImage(index));
    cell.appendChild(removeBtn);

    thumbGrid.appendChild(cell);
  });
  imgCountEl.textContent = String(selectedImages.length);
}

function removeImage(index) {
  URL.revokeObjectURL(selectedImages[index].thumbUrl);
  selectedImages.splice(index, 1);
  renderThumbs();
}

function loadImageAsCanvasData(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      // Flatten onto a white background first — a transparent PNG would
      // otherwise print as solid black on the PDF page.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      URL.revokeObjectURL(url);
      resolve({ dataUrl, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('โหลดรูปไม่สำเร็จ: ' + file.name));
    };
    img.src = url;
  });
}

convertPdfBtn.addEventListener('click', async function () {
  if (selectedImages.length === 0) {
    showToast("เพื่อน! อย่าลืมเลือกรูปก่อนนะ", 'error');
    return;
  }
  if (typeof window.jspdf === 'undefined') {
    showToast("โหลดตัวสร้าง PDF ไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่นะ", 'error');
    return;
  }

  pdfUploadSection.style.display = 'none';
  pdfLoadingSection.style.display = 'block';
  setProgress(pdfProgressFill, pdfProgressText, pdfLoadingLabel, 0, 'กำลังจัดหน้า...');

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // A4 in mm, with a small margin so images never touch the edge of the page.
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const total = selectedImages.length;

    for (let i = 0; i < total; i++) {
      const { dataUrl, width, height } = await loadImageAsCanvasData(selectedImages[i].file);

      // "Contain" fit: scale to the largest size that fits the page without
      // distorting the aspect ratio, then center it.
      const imgRatio = width / height;
      const boxRatio = maxWidth / maxHeight;
      let renderWidth, renderHeight;
      if (imgRatio > boxRatio) {
        renderWidth = maxWidth;
        renderHeight = maxWidth / imgRatio;
      } else {
        renderHeight = maxHeight;
        renderWidth = maxHeight * imgRatio;
      }
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      if (i > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(dataUrl, 'JPEG', x, y, renderWidth, renderHeight);

      setProgress(
        pdfProgressFill, pdfProgressText, pdfLoadingLabel,
        Math.round(((i + 1) / total) * 100),
        `กำลังจัดหน้า ${i + 1}/${total}`
      );
    }

    pdfBlobResult = pdf.output('blob');
    pdfBlobUrl = URL.createObjectURL(pdfBlobResult);

    addHistoryEntry('pdf', document.getElementById('pdftitle').value || `เอกสาร ${total} หน้า`);

    pdfLoadingSection.style.display = 'none';
    pdfResultSection.style.display = 'block';
    pdfPageSummary.textContent = `รวม ${total} หน้า`;

  } catch (err) {
    console.error(err);
    pdfLoadingSection.style.display = 'none';
    pdfUploadSection.style.display = 'block';
    showToast("เกิดข้อผิดพลาดตอนสร้าง PDF ลองใหม่อีกครั้งนะเพื่อน", 'error');
  }
});

downloadPdfBtn.addEventListener('click', function () {
  if (!pdfBlobResult) return;
  const a = document.createElement('a');
  a.href = pdfBlobUrl;

  let finalFileName = 'document.pdf';
  const titleInput = sanitizeFileName(document.getElementById('pdftitle').value);
  if (titleInput !== '') {
    finalFileName = titleInput + '.pdf';
  }

  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

previewPdfBtn.addEventListener('click', () => {
  if (!pdfBlobUrl) return;
  window.open(pdfBlobUrl, '_blank', 'noopener,noreferrer');
});

sharePdfBtn.addEventListener('click', async () => {
  if (!pdfBlobResult) return;

  const titleInput = sanitizeFileName(document.getElementById('pdftitle').value);
  const shareFileName = (titleInput !== '' ? titleInput : 'document') + '.pdf';
  const fileToShare = new File([pdfBlobResult], shareFileName, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
    try {
      await navigator.share({ files: [fileToShare], title: 'เอกสาร PDF' });
    } catch (err) {
      console.log('ยกเลิกการแชร์');
    }
  } else if (navigator.share) {
    try {
      await navigator.share({
        title: 'เอกสาร PDF',
        text: 'ฉันเพิ่งสร้างไฟล์ PDF ผ่าน KKO.com',
        url: window.location.href
      });
    } catch (err) {
      console.log('ยกเลิกการแชร์');
    }
  } else {
    showToast('เบราว์เซอร์ของคุณไม่รองรับการแชร์ ลองดาวน์โหลดแล้วส่งไฟล์แทนนะ');
  }
});

document.getElementById('reconvertPdfLink').addEventListener('click', resetPdfApp);

function resetPdfApp() {
  pdfResultSection.style.display = 'none';
  pdfUploadSection.style.display = 'block';
  selectedImages.forEach(item => URL.revokeObjectURL(item.thumbUrl));
  selectedImages = [];
  renderThumbs();
  imgfiles.value = "";
  document.getElementById('pdftitle').value = '';
  pdfBlobResult = null;
  if (pdfBlobUrl) {
    URL.revokeObjectURL(pdfBlobUrl);
    pdfBlobUrl = "";
  }
  setProgress(pdfProgressFill, pdfProgressText, pdfLoadingLabel, 0, 'กำลังสร้าง PDF...');
}

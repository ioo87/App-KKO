/* =========================================================
   SCREEN NAVIGATION
========================================================= */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  if (id === 'screen-menu') {
    renderHistory();
    renderMenuIntro();
  }
}

document.getElementById('landingStartBtn').addEventListener('click', () => {
  showScreen('screen-login');
});

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
  incrementUsageCount();
}

/* =========================================================
   USAGE COUNTER — kept separate from history (which only
   keeps the last 10) so the total can keep counting past that.
========================================================= */
const USAGE_COUNT_KEY = 'kko-usage-count';

function incrementUsageCount() {
  const count = getUsageCount() + 1;
  try { localStorage.setItem(USAGE_COUNT_KEY, String(count)); } catch (e) {}
  return count;
}

function getUsageCount() {
  try { return parseInt(localStorage.getItem(USAGE_COUNT_KEY), 10) || 0; } catch (e) { return 0; }
}

/* =========================================================
   MENU GREETING + USAGE STAT
========================================================= */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'สวัสดีตอนดึก 🌙';
  if (hour < 12) return 'สวัสดีตอนเช้า ☀️';
  if (hour < 17) return 'สวัสดีตอนบ่าย 👋';
  if (hour < 21) return 'สวัสดีตอนเย็น 🌆';
  return 'สวัสดีตอนดึก 🌙';
}

function renderMenuIntro() {
  document.getElementById('greetingText').textContent = getGreeting();
  const count = getUsageCount();
  document.getElementById('usageStat').textContent =
    count === 0 ? 'เริ่มใช้งานเครื่องมือแรกได้เลย' : `ใช้งานไปแล้ว ${count} ครั้ง 🎉`;
}

/* =========================================================
   CONFETTI — a small celebration on every successful conversion
========================================================= */
function fireConfetti() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.getElementById('confettiLayer');
  const colors = ['#00e6a0', '#7cf2cf', '#e8b84b', '#ffffff'];
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
    piece.style.animationDelay = (Math.random() * 0.25) + 's';
    piece.addEventListener('animationend', () => piece.remove());
    layer.appendChild(piece);
  }
}

/* =========================================================
   SHARE APP (menu screen)
========================================================= */
document.getElementById('shareAppBtn').addEventListener('click', async () => {
  const shareUrl = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'KKO.com — เครื่องมือแปลงไฟล์ฟรี',
        text: 'แปลงไฟล์ฟรี ไม่มีอัปโหลด ลองเลยที่ KKO.com',
        url: shareUrl
      });
    } catch (err) {
      console.log('ยกเลิกการแชร์');
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('คัดลอกลิงก์แล้ว! เอาไปแชร์ได้เลย');
    } catch (err) {
      showToast('คัดลอกลิงก์ไม่สำเร็จ ลองคัดลอกจากแถบที่อยู่แทนนะ', 'error');
    }
  } else {
    showToast('เบราว์เซอร์นี้แชร์ลิงก์อัตโนมัติไม่ได้ ลองคัดลอกจากแถบที่อยู่แทนนะ');
  }
});

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
    const iconMap = { pdf: '📄', qr: '🔳', compress: '🗜️', format: '🔄', merge: '📎', watermark: '🖼️' };
    icon.textContent = iconMap[entry.type] || '🎵';

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

// Track 03–07 all follow the same click/keydown pattern as tracks 01–02, so
// this loop wires them up without repeating the same four lines five times.
[
  ['trackQr', 'qr'],
  ['trackCompress', 'compress'],
  ['trackFormat', 'format'],
  ['trackMerge', 'merge'],
  ['trackWatermark', 'watermark'],
].forEach(([id, tab]) => {
  const el = document.getElementById(id);
  el.addEventListener('click', () => openWorkspace(tab));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWorkspace(tab); }
  });
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
  resetApp();
  resetPdfApp();
  resetQrApp();
  resetCompressApp();
  resetFormatApp();
  resetMergeApp();
  resetWatermarkApp();
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
    fireConfetti();

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
    selectedImages.push({ file, thumbUrl: URL.createObjectURL(file), rotation: 0 });
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
    img.style.transform = `rotate(${item.rotation || 0}deg)`;
    cell.appendChild(img);

    const rotateBtn = document.createElement('button');
    rotateBtn.type = 'button';
    rotateBtn.className = 'thumb-rotate';
    rotateBtn.setAttribute('aria-label', 'หมุนรูปนี้ 90 องศา');
    rotateBtn.textContent = '↻';
    rotateBtn.addEventListener('click', () => rotateImage(index));
    cell.appendChild(rotateBtn);

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

function rotateImage(index) {
  const item = selectedImages[index];
  item.rotation = ((item.rotation || 0) + 90) % 360;
  renderThumbs();
}

function removeImage(index) {
  URL.revokeObjectURL(selectedImages[index].thumbUrl);
  selectedImages.splice(index, 1);
  renderThumbs();
}

function loadImageAsCanvasData(file, rotationDeg = 0) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const swap = rotationDeg === 90 || rotationDeg === 270;
      const canvas = document.createElement('canvas');
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext('2d');
      // Flatten onto a white background first — a transparent PNG would
      // otherwise print as solid black on the PDF page.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
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
      const { dataUrl, width, height } = await loadImageAsCanvasData(selectedImages[i].file, selectedImages[i].rotation || 0);

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
    fireConfetti();

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

/* =========================================================
   QR CODE GENERATOR
   Uses qrcodejs (loaded from cdnjs) — draws a canvas we can
   read back directly for download/share.
========================================================= */
const qrtext = document.getElementById('qrtext');
const generateQrBtn = document.getElementById('generateQrBtn');
const qrResultWrap = document.getElementById('qrResultWrap');
const qrCanvasHolder = document.getElementById('qrCanvasHolder');
const downloadQrBtn = document.getElementById('downloadQrBtn');
const shareQrBtn = document.getElementById('shareQrBtn');

generateQrBtn.addEventListener('click', () => {
  const text = qrtext.value.trim();
  if (text === '') {
    showToast("เพื่อน! พิมพ์ข้อความหรือลิงก์ก่อนนะ", 'error');
    return;
  }
  if (typeof QRCode === 'undefined') {
    showToast("โหลดตัวสร้าง QR ไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่นะ", 'error');
    return;
  }

  qrCanvasHolder.innerHTML = ''; // clear any previously generated code (safe: empty string)
  new QRCode(qrCanvasHolder, {
    text: text,
    width: 240,
    height: 240,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  qrResultWrap.style.display = 'block';
  addHistoryEntry('qr', text.length > 30 ? text.slice(0, 30) + '…' : text);
  fireConfetti();
});

downloadQrBtn.addEventListener('click', () => {
  const canvas = qrCanvasHolder.querySelector('canvas');
  if (!canvas) {
    showToast('ยังไม่มี QR Code ให้ดาวน์โหลด', 'error');
    return;
  }
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'qrcode.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

shareQrBtn.addEventListener('click', () => {
  const canvas = qrCanvasHolder.querySelector('canvas');
  if (!canvas) return;
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], 'qrcode.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'QR Code' }); }
      catch (err) { console.log('ยกเลิกการแชร์'); }
    } else {
      showToast('เบราว์เซอร์ของคุณไม่รองรับการแชร์ ลองดาวน์โหลดแทนนะ');
    }
  }, 'image/png');
});

function resetQrApp() {
  qrtext.value = '';
  qrCanvasHolder.innerHTML = '';
  qrResultWrap.style.display = 'none';
}

/* =========================================================
   SHARED: human-readable file sizes (compress + merge use this)
========================================================= */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const MAX_SIMPLE_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB — shared cap for
                                                 // compress / format / watermark

/* =========================================================
   IMAGE COMPRESSOR
========================================================= */
const compressFile = document.getElementById('compressFile');
const compressUploadLabel = document.getElementById('compressUploadLabel');
const compressUploadSection = document.getElementById('compressUploadSection');
const compressControls = document.getElementById('compressControls');
const compressQuality = document.getElementById('compressQuality');
const compressQualityValue = document.getElementById('compressQualityValue');
const compressOriginalSize = document.getElementById('compressOriginalSize');
const compressBtn = document.getElementById('compressBtn');
const compressResultSection = document.getElementById('compressResultSection');
const compressPreviewImg = document.getElementById('compressPreviewImg');
const compressSizeResult = document.getElementById('compressSizeResult');
const downloadCompressBtn = document.getElementById('downloadCompressBtn');
const shareCompressBtn = document.getElementById('shareCompressBtn');

let compressSourceFile = null;
let compressBlobResult = null;
let compressBlobUrl = '';

function handleCompressFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast("ไฟล์นี้ไม่ใช่รูปภาพนะเพื่อน ลองเลือกไฟล์ใหม่", 'error');
    return;
  }
  if (file.size > MAX_SIMPLE_IMAGE_SIZE) {
    showToast("ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 30MB)", 'error');
    return;
  }
  compressSourceFile = file;
  compressOriginalSize.textContent = formatBytes(file.size);
  compressControls.style.display = 'block';
}

compressFile.addEventListener('change', (e) => handleCompressFile(e.target.files[0]));
wireDropZone(compressUploadLabel, (files) => handleCompressFile(files && files[0]));

compressQuality.addEventListener('input', () => {
  compressQualityValue.textContent = compressQuality.value + '%';
});

compressBtn.addEventListener('click', () => {
  if (!compressSourceFile) {
    showToast("เพื่อน! อย่าลืมเลือกรูปก่อนนะ", 'error');
    return;
  }
  const quality = Number(compressQuality.value) / 100;
  const img = new Image();
  const url = URL.createObjectURL(compressSourceFile);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('บีบอัดไม่สำเร็จ ลองใหม่อีกครั้งนะ', 'error');
        return;
      }
      compressBlobResult = blob;
      compressBlobUrl = URL.createObjectURL(blob);
      compressUploadSection.style.display = 'none';
      compressResultSection.style.display = 'block';
      compressPreviewImg.src = compressBlobUrl;
      compressSizeResult.textContent =
        `ขนาดใหม่: ${formatBytes(blob.size)} (จาก ${formatBytes(compressSourceFile.size)})`;
      addHistoryEntry('compress', compressSourceFile.name);
      fireConfetti();
    }, 'image/jpeg', quality);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('โหลดรูปไม่สำเร็จ ลองไฟล์อื่นดูนะ', 'error');
  };
  img.src = url;
});

downloadCompressBtn.addEventListener('click', () => {
  if (!compressBlobResult) return;
  const a = document.createElement('a');
  a.href = compressBlobUrl;
  const baseName = sanitizeFileName((compressSourceFile.name || 'image').replace(/\.[^./]+$/, ''));
  a.download = (baseName || 'image') + '-compressed.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

shareCompressBtn.addEventListener('click', async () => {
  if (!compressBlobResult) return;
  const file = new File([compressBlobResult], 'compressed.jpg', { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'รูปที่บีบอัดแล้ว' }); }
    catch (err) { console.log('ยกเลิกการแชร์'); }
  } else {
    showToast('เบราว์เซอร์ของคุณไม่รองรับการแชร์ ลองดาวน์โหลดแทนนะ');
  }
});

document.getElementById('reconvertCompressLink').addEventListener('click', resetCompressApp);

function resetCompressApp() {
  compressResultSection.style.display = 'none';
  compressUploadSection.style.display = 'block';
  compressControls.style.display = 'none';
  compressFile.value = '';
  compressSourceFile = null;
  compressBlobResult = null;
  if (compressBlobUrl) { URL.revokeObjectURL(compressBlobUrl); compressBlobUrl = ''; }
  compressQuality.value = 80;
  compressQualityValue.textContent = '80%';
}

/* =========================================================
   IMAGE FORMAT CONVERTER (PNG / JPG / WebP)
========================================================= */
const formatFile = document.getElementById('formatFile');
const formatUploadLabel = document.getElementById('formatUploadLabel');
const formatUploadSection = document.getElementById('formatUploadSection');
const formatChoiceRow = document.getElementById('formatChoiceRow');
const formatBtn = document.getElementById('formatBtn');
const formatResultSection = document.getElementById('formatResultSection');
const formatPreviewImg = document.getElementById('formatPreviewImg');
const downloadFormatBtn = document.getElementById('downloadFormatBtn');
const shareFormatBtn = document.getElementById('shareFormatBtn');

let formatSourceFile = null;
let formatBlobResult = null;
let formatBlobUrl = '';
let formatTargetMime = 'image/jpeg';
let formatTargetExt = 'jpg';

function handleFormatFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast("ไฟล์นี้ไม่ใช่รูปภาพนะเพื่อน ลองเลือกไฟล์ใหม่", 'error');
    return;
  }
  if (file.size > MAX_SIMPLE_IMAGE_SIZE) {
    showToast("ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 30MB)", 'error');
    return;
  }
  formatSourceFile = file;
}

formatFile.addEventListener('change', (e) => handleFormatFile(e.target.files[0]));
wireDropZone(formatUploadLabel, (files) => handleFormatFile(files && files[0]));

formatChoiceRow.querySelectorAll('.format-choice').forEach((btn) => {
  btn.addEventListener('click', () => {
    formatChoiceRow.querySelectorAll('.format-choice').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    formatTargetMime = btn.dataset.format;
    formatTargetExt = btn.dataset.ext;
  });
});

formatBtn.addEventListener('click', () => {
  if (!formatSourceFile) {
    showToast("เพื่อน! อย่าลืมเลือกรูปก่อนนะ", 'error');
    return;
  }
  const img = new Image();
  const url = URL.createObjectURL(formatSourceFile);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    // PNG keeps transparency; JPG/WebP-without-alpha don't, so flatten to
    // white first when the target is JPEG (PNG target keeps transparency).
    if (formatTargetMime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('แปลงฟอร์แมตไม่สำเร็จ เบราว์เซอร์นี้อาจไม่รองรับฟอร์แมตที่เลือก', 'error');
        return;
      }
      formatBlobResult = blob;
      formatBlobUrl = URL.createObjectURL(blob);
      formatUploadSection.style.display = 'none';
      formatResultSection.style.display = 'block';
      formatPreviewImg.src = formatBlobUrl;
      addHistoryEntry('format', (formatSourceFile.name || 'image') + ' → ' + formatTargetExt.toUpperCase());
      fireConfetti();
    }, formatTargetMime, 0.92);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('โหลดรูปไม่สำเร็จ ลองไฟล์อื่นดูนะ', 'error');
  };
  img.src = url;
});

downloadFormatBtn.addEventListener('click', () => {
  if (!formatBlobResult) return;
  const a = document.createElement('a');
  a.href = formatBlobUrl;
  const baseName = sanitizeFileName((formatSourceFile.name || 'image').replace(/\.[^./]+$/, ''));
  a.download = (baseName || 'image') + '.' + formatTargetExt;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

shareFormatBtn.addEventListener('click', async () => {
  if (!formatBlobResult) return;
  const file = new File([formatBlobResult], 'converted.' + formatTargetExt, { type: formatTargetMime });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'รูปที่แปลงฟอร์แมตแล้ว' }); }
    catch (err) { console.log('ยกเลิกการแชร์'); }
  } else {
    showToast('เบราว์เซอร์ของคุณไม่รองรับการแชร์ ลองดาวน์โหลดแทนนะ');
  }
});

document.getElementById('reconvertFormatLink').addEventListener('click', resetFormatApp);

function resetFormatApp() {
  formatResultSection.style.display = 'none';
  formatUploadSection.style.display = 'block';
  formatFile.value = '';
  formatSourceFile = null;
  formatBlobResult = null;
  if (formatBlobUrl) { URL.revokeObjectURL(formatBlobUrl); formatBlobUrl = ''; }
}

/* =========================================================
   MERGE PDFs
   Uses pdf-lib (loaded from cdnjs) to copy pages from every
   selected PDF, in order, into one new document.
========================================================= */
const mergeFiles = document.getElementById('mergeFiles');
const mergeUploadLabel = document.getElementById('mergeUploadLabel');
const mergeList = document.getElementById('mergeList');
const mergeCountEl = document.getElementById('mergeCount');
const mergeUploadSection = document.getElementById('mergeUploadSection');
const mergeLoadingSection = document.getElementById('mergeLoadingSection');
const mergeResultSection = document.getElementById('mergeResultSection');
const mergeBtn = document.getElementById('mergeBtn');
const downloadMergeBtn = document.getElementById('downloadMergeBtn');
const previewMergeBtn = document.getElementById('previewMergeBtn');
const shareMergeBtn = document.getElementById('shareMergeBtn');
const mergePageSummary = document.getElementById('mergePageSummary');
const mergeProgressFill = document.getElementById('mergeProgressFill');
const mergeProgressText = document.getElementById('mergeProgressText');
const mergeLoadingLabel = document.getElementById('mergeLoadingLabel');

const MAX_MERGE_FILES = 20;
const MAX_MERGE_FILE_SIZE = 100 * 1024 * 1024; // 100MB per PDF

let selectedPdfs = []; // [File]
let mergeBlobResult = null;
let mergeBlobUrl = '';

function handleMergeFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    const looksLikePdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!looksLikePdf) {
      showToast(`ข้าม "${file.name}" เพราะไม่ใช่ไฟล์ PDF`, 'error');
      continue;
    }
    if (file.size > MAX_MERGE_FILE_SIZE) {
      showToast(`ข้าม "${file.name}" เพราะไฟล์ใหญ่เกิน 100MB`, 'error');
      continue;
    }
    if (selectedPdfs.length >= MAX_MERGE_FILES) {
      showToast(`เลือกได้สูงสุด ${MAX_MERGE_FILES} ไฟล์ต่อการรวมหนึ่งครั้ง`, 'error');
      break;
    }
    selectedPdfs.push(file);
  }
  renderMergeList();
}

mergeFiles.addEventListener('change', (e) => {
  handleMergeFiles(e.target.files);
  mergeFiles.value = '';
});
wireDropZone(mergeUploadLabel, (files) => handleMergeFiles(files));

function renderMergeList() {
  // Built with createElement/textContent only — filenames are attacker/user
  // controlled and must never be inserted as HTML.
  mergeList.innerHTML = '';
  selectedPdfs.forEach((file, index) => {
    const li = document.createElement('li');
    li.className = 'merge-item';

    const icon = document.createElement('span');
    icon.className = 'merge-item-icon';
    icon.textContent = '📄';

    const name = document.createElement('span');
    name.className = 'merge-item-name';
    name.textContent = file.name;

    const size = document.createElement('span');
    size.className = 'merge-item-size';
    size.textContent = formatBytes(file.size);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'merge-remove';
    removeBtn.setAttribute('aria-label', 'ลบไฟล์นี้');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      selectedPdfs.splice(index, 1);
      renderMergeList();
    });

    li.appendChild(icon);
    li.appendChild(name);
    li.appendChild(size);
    li.appendChild(removeBtn);
    mergeList.appendChild(li);
  });
  mergeCountEl.textContent = String(selectedPdfs.length);
}

mergeBtn.addEventListener('click', async () => {
  if (selectedPdfs.length < 2) {
    showToast("เลือกไฟล์ PDF อย่างน้อย 2 ไฟล์เพื่อรวมนะเพื่อน", 'error');
    return;
  }
  if (typeof window.PDFLib === 'undefined') {
    showToast("โหลดตัวรวม PDF ไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่นะ", 'error');
    return;
  }

  mergeUploadSection.style.display = 'none';
  mergeLoadingSection.style.display = 'block';
  setProgress(mergeProgressFill, mergeProgressText, mergeLoadingLabel, 0, 'กำลังรวมไฟล์...');

  try {
    const { PDFDocument } = window.PDFLib;
    const merged = await PDFDocument.create();
    let totalPages = 0;

    for (let i = 0; i < selectedPdfs.length; i++) {
      const bytes = await selectedPdfs[i].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
      totalPages += pages.length;

      setProgress(
        mergeProgressFill, mergeProgressText, mergeLoadingLabel,
        Math.round(((i + 1) / selectedPdfs.length) * 100),
        `กำลังรวมไฟล์ ${i + 1}/${selectedPdfs.length}`
      );
    }

    const mergedBytes = await merged.save();
    mergeBlobResult = new Blob([mergedBytes], { type: 'application/pdf' });
    mergeBlobUrl = URL.createObjectURL(mergeBlobResult);

    addHistoryEntry('merge', `รวม ${selectedPdfs.length} ไฟล์ (${totalPages} หน้า)`);
    fireConfetti();

    mergeLoadingSection.style.display = 'none';
    mergeResultSection.style.display = 'block';
    mergePageSummary.textContent = `รวม ${totalPages} หน้า จาก ${selectedPdfs.length} ไฟล์`;

  } catch (err) {
    console.error(err);
    mergeLoadingSection.style.display = 'none';
    mergeUploadSection.style.display = 'block';
    showToast("เกิดข้อผิดพลาดตอนรวมไฟล์ — ไฟล์อาจเสียหายหรือมีรหัสผ่านป้องกันอยู่", 'error');
  }
});

downloadMergeBtn.addEventListener('click', () => {
  if (!mergeBlobResult) return;
  const a = document.createElement('a');
  a.href = mergeBlobUrl;
  a.download = 'merged.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

previewMergeBtn.addEventListener('click', () => {
  if (!mergeBlobUrl) return;
  window.open(mergeBlobUrl, '_blank', 'noopener,noreferrer');
});

shareMergeBtn.addEventListener('click', async () => {
  if (!mergeBlobResult) return;
  const file = new File([mergeBlobResult], 'merged.pdf', { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'PDF ที่รวมแล้ว' }); }
    catch (err) { console.log('ยกเลิกการแชร์'); }
  } else {
    showToast('เบราว์เซอร์ของคุณไม่รองรับการแชร์ ลองดาวน์โหลดแทนนะ');
  }
});

document.getElementById('reconvertMergeLink').addEventListener('click', resetMergeApp);

function resetMergeApp() {
  mergeResultSection.style.display = 'none';
  mergeUploadSection.style.display = 'block';
  selectedPdfs = [];
  renderMergeList();
  mergeFiles.value = '';
  mergeBlobResult = null;
  if (mergeBlobUrl) { URL.revokeObjectURL(mergeBlobUrl); mergeBlobUrl = ''; }
  setProgress(mergeProgressFill, mergeProgressText, mergeLoadingLabel, 0, 'กำลังรวมไฟล์...');
}

/* =========================================================
   WATERMARK
   Live canvas preview — updates instantly as text/position/
   opacity change, no separate "loading" step needed since
   drawing one image is effectively instant.
========================================================= */
const watermarkFile = document.getElementById('watermarkFile');
const watermarkUploadLabel = document.getElementById('watermarkUploadLabel');
const watermarkControls = document.getElementById('watermarkControls');
const watermarkText = document.getElementById('watermarkText');
const watermarkPositionRow = document.getElementById('watermarkPositionRow');
const watermarkOpacity = document.getElementById('watermarkOpacity');
const watermarkOpacityValue = document.getElementById('watermarkOpacityValue');
const watermarkCanvas = document.getElementById('watermarkCanvas');
const watermarkBtn = document.getElementById('watermarkBtn');

let watermarkSourceImg = null;
let watermarkSourceFile = null;
let watermarkPosition = 'bottom-right';

function handleWatermarkFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast("ไฟล์นี้ไม่ใช่รูปภาพนะเพื่อน ลองเลือกไฟล์ใหม่", 'error');
    return;
  }
  if (file.size > MAX_SIMPLE_IMAGE_SIZE) {
    showToast("ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 30MB)", 'error');
    return;
  }
  watermarkSourceFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    watermarkSourceImg = img;
    watermarkCanvas.width = img.naturalWidth;
    watermarkCanvas.height = img.naturalHeight;
    watermarkControls.style.display = 'block';
    drawWatermarkPreview();
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('โหลดรูปไม่สำเร็จ ลองไฟล์อื่นดูนะ', 'error');
  };
  img.src = url;
}

watermarkFile.addEventListener('change', (e) => handleWatermarkFile(e.target.files[0]));
wireDropZone(watermarkUploadLabel, (files) => handleWatermarkFile(files && files[0]));

function drawWatermarkPreview() {
  if (!watermarkSourceImg) return;
  const ctx = watermarkCanvas.getContext('2d');
  const w = watermarkCanvas.width;
  const h = watermarkCanvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(watermarkSourceImg, 0, 0, w, h);

  const text = watermarkText.value || '';
  if (text === '') return;

  const opacityFraction = Number(watermarkOpacity.value) / 100;
  const fontSize = Math.max(16, Math.round(w * 0.045));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = `rgba(255,255,255,${opacityFraction})`;
  ctx.strokeStyle = `rgba(0,0,0,${opacityFraction * 0.6})`;
  ctx.lineWidth = Math.max(1, fontSize * 0.06);
  ctx.textBaseline = 'alphabetic';

  const padding = Math.round(w * 0.03);
  let x, y;
  if (watermarkPosition === 'top-left') { x = padding; y = padding + fontSize; ctx.textAlign = 'left'; }
  else if (watermarkPosition === 'top-right') { x = w - padding; y = padding + fontSize; ctx.textAlign = 'right'; }
  else if (watermarkPosition === 'center') { x = w / 2; y = h / 2; ctx.textAlign = 'center'; }
  else if (watermarkPosition === 'bottom-left') { x = padding; y = h - padding; ctx.textAlign = 'left'; }
  else { x = w - padding; y = h - padding; ctx.textAlign = 'right'; } // bottom-right (default)

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

watermarkText.addEventListener('input', drawWatermarkPreview);
watermarkOpacity.addEventListener('input', () => {
  watermarkOpacityValue.textContent = watermarkOpacity.value + '%';
  drawWatermarkPreview();
});
watermarkPositionRow.querySelectorAll('.format-choice').forEach((btn) => {
  btn.addEventListener('click', () => {
    watermarkPositionRow.querySelectorAll('.format-choice').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    watermarkPosition = btn.dataset.pos;
    drawWatermarkPreview();
  });
});

watermarkBtn.addEventListener('click', () => {
  if (!watermarkSourceImg) {
    showToast("เพื่อน! อย่าลืมเลือกรูปก่อนนะ", 'error');
    return;
  }
  watermarkCanvas.toBlob((blob) => {
    if (!blob) {
      showToast('สร้างไฟล์ไม่สำเร็จ ลองใหม่อีกครั้งนะ', 'error');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = sanitizeFileName((watermarkSourceFile.name || 'image').replace(/\.[^./]+$/, ''));
    a.download = (baseName || 'image') + '-watermark.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addHistoryEntry('watermark', watermarkSourceFile.name);
    fireConfetti();
  }, 'image/png');
});

function resetWatermarkApp() {
  watermarkFile.value = '';
  watermarkSourceImg = null;
  watermarkSourceFile = null;
  watermarkControls.style.display = 'none';
  watermarkText.value = '© KKO.com';
  watermarkOpacity.value = 60;
  watermarkOpacityValue.textContent = '60%';
  watermarkPosition = 'bottom-right';
  watermarkPositionRow.querySelectorAll('.format-choice').forEach(b => b.classList.remove('active'));
  const defaultBtn = watermarkPositionRow.querySelector('[data-pos="bottom-right"]');
  if (defaultBtn) defaultBtn.classList.add('active');
  const ctx = watermarkCanvas.getContext('2d');
  ctx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
  watermarkCanvas.width = 0;
  watermarkCanvas.height = 0;
}

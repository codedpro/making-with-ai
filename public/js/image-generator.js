let isRateLimited = false;
let isGenerating = false;
let rateLimitTimer;
let promptUniqueIndex = 1;

function debounceAndImmediateExecute(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    const callNow = !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = null;
      if (!callNow) func.apply(context, args);
    }, wait);

    if (callNow) func.apply(context, args);
  };
}

function enhancePrompt(userPrompt) {
  const prompt = userPrompt + promptUniqueIndex++;
  const selectedStyle = document.getElementById('prompt-style').value;

  if (selectedStyle === 'detailed') {
    return `A high-quality, detailed image of ${prompt}. The image should be vivid, clear, and focus on accurately representing the subject. This Image should be unique and should be a high-quality representation of the subject`;
  } else if (selectedStyle === 'animated') {
    return `A colorful and animated style image of ${prompt}. This Image should always be unique and should be a high-quality representation of the subject`;
  }
}

async function generateImages() {
  if (isRateLimited || isGenerating) {
    console.log('Cannot generate images. Rate limited or already generating.');
    return;
  }

  isGenerating = true;
  setGenerateButtonState(false);

  const userPrompt = document.getElementById('prompt').value.trim();
  const imageCount = parseInt(document.getElementById('image-count').value, 10);
  const imageContainer = document.getElementById('image-container');
  const preloader = document.querySelector('.preloader');
  const errorLog = document.getElementById('error-log');

  if (!userPrompt) {
    logError('Please enter a description for the image.');
    isGenerating = false;
    setGenerateButtonState(true);
    return;
  }

  preloader.classList.add('visible');

  errorLog.style.display = 'none';

  errorLog.innerHTML = '';
  hideRateLimitMessage();

  imageContainer.innerHTML = '';

  try {
    const requests = [];
    for (let i = 0; i < imageCount; i++) {
      const enhancedPrompt = enhancePrompt(`${userPrompt} ${i + 1}`);
      requests.push(axios.post('/api/generate-image', { prompt: enhancedPrompt }));
    }

    const response = await Promise.all(requests);

    imageContainer.innerHTML = '';
    preloader.classList.remove('visible');

    response.forEach((res, index) => {
      if (res.status === 200) {
        errorLog.style.display = 'none';
        preloader.classList.remove('visible');
        const data = res.data;
        const imageElement = createImageElement(data.image, index);
        imageContainer.appendChild(imageElement);
        addToArchive(data.image);
      } else {
        logError(data.error || 'Unknown API error');
      }
      errorLog.style.display = 'none';
      preloader.classList.remove('visible');
    });
  } catch (error) {
    console.log({ error });
    imageContainer.innerHTML = '';
    preloader.classList.remove('visible');
    logError('Network or server error occurred');
  } finally {
    isGenerating = false;
    if (!isRateLimited) {
      setGenerateButtonState(true);
    }
  }
}

function createImageElement(imageUrl, index) {
  const imageElement = document.createElement('div');
  imageElement.className = 'image-item';
  imageElement.innerHTML = `<img class="rounded-lg" src="${imageUrl}" alt="Generated image ${
    index + 1
  }" onclick="openModal('${imageUrl}')">`;
  return imageElement;
}

function handleRateLimitError(waitTime) {
  startRateLimitTimer(waitTime);
}

function showRateLimitMessage(waitTime) {
  isRateLimited = true;
  const messageElement = document.getElementById('rate-limit-message');
  messageElement.style.display = 'block';
  setGenerateButtonState(false);

  if (rateLimitTimer) {
    clearInterval(rateLimitTimer);
  }

  updateRateLimitTimer(waitTime);
}

function hideRateLimitMessage() {
  const rateLimitMessage = document.getElementById('rate-limit-message');
  if (!rateLimitMessage) {
    console.error('Rate limit message element not found!');
    return;
  }
  rateLimitMessage.classList.add('hidden');
  setGenerateButtonState(true);
  isRateLimited = false;
  localStorage.removeItem('rateLimitExpiry');
}

function updateRateLimitTimer(remainingTime) {
  const messageElement = document.getElementById('rate-limit-message');
  const countdownSpan = document.getElementById('countdown');

  function updateTimer() {
    if (remainingTime > 0) {
      countdownSpan.textContent = remainingTime;
      remainingTime--;
    } else {
      clearInterval(rateLimitTimer);
      hideRateLimitMessage();
    }
  }

  updateTimer();
  rateLimitTimer = setInterval(updateTimer, 1000);
}

function setGenerateButtonState(enabled) {
  const generateButton = document.getElementById('generate-btn');
  generateButton.disabled = !enabled;
  const promptInput = document.getElementById('prompt');
  promptInput.disabled = !enabled;
}

async function downloadImage() {
  const modalImage = document.getElementById('modalImage');
  const imageUrl = modalImage.src;
  const resolutionSelect = document.querySelector('.modal .resolution-select');
  const formatSelect = document.querySelector('.modal .format-select');

  if (!resolutionSelect || !formatSelect) {
    logError('Resolution or format select element not found.');
    return;
  }

  const resolution = resolutionSelect.value;
  const [resolutionWidth, resolutionHeight] = resolution.split('x');
  const format = formatSelect.value;

  console.log(resolution, format);

  if (!resolution || !format) {
    logError('Resolution or format is not selected.');
    return;
  }

  try {
    const link = document.createElement('a');
    link.download = `generated-image-${resolution}.${format}`;
    link.href = readyImageForDownload(modalImage, resolutionWidth, resolutionHeight, `image/${format.toLowerCase()}`);
    link.target = '_blank';
    link.click();
    link.remove();
  } catch (error) {
    logError('Error downloading image: ' + error.message);
  }
}

function readyImageForDownload(image = createImageElement(), width, height, fileType) {
  const originalImage = new Image();
  const canvas = document.createElement('canvas');

  originalImage.src = image.src;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  const resizedImage = canvas.toDataURL(fileType);
  canvas.remove();

  return resizedImage;
}

function updateResolutionVisibility(select) {
  if (!select) return;
  const resolutionSelect = select.parentElement.querySelector('.resolution-select');
  resolutionSelect.style.display = select.value === 'webp' ? 'none' : 'inline-block';
}

function addToArchive(imageUrl) {
  let archivedImages = JSON.parse(localStorage.getItem('archivedImages')) || [];

  if (!archivedImages.includes(imageUrl)) {
    archivedImages.unshift(imageUrl);
    localStorage.setItem('archivedImages', JSON.stringify(archivedImages));
  }
  updateArchiveToggleVisibility();
  loadArchive();
}

function loadArchive() {
  const archivedImages = JSON.parse(localStorage.getItem('archivedImages')) || [];
  const archive = document.getElementById('archive');
  archive.innerHTML = '';
  archivedImages.forEach((imageUrl, index) => {
    const archiveItem = document.createElement('div');
    archiveItem.className = 'archive-item';
    archiveItem.innerHTML = `<img class="rounded-lg" src="${imageUrl}" alt="Archived image ${
      index + 1
    }" onclick="openModal('${imageUrl}')" class="rounded-lg">
                <button class="delete-btn" onclick="deleteImage(${index})">×</button>`;
    archive.appendChild(archiveItem);
  });
  updateArchiveToggleVisibility();
}

function deleteImage(index) {
  let archivedImages = JSON.parse(localStorage.getItem('archivedImages')) || [];
  archivedImages.splice(index, 1);
  localStorage.setItem('archivedImages', JSON.stringify(archivedImages));
  loadArchive();
}

function updateArchiveToggleVisibility() {
  const archiveToggle = document.getElementById('archiveToggle');
  const archivedImages = JSON.parse(localStorage.getItem('archivedImages')) || [];
  archiveToggle.style.display = archivedImages.length > 0 ? 'flex' : 'none';
}

function logError(error) {
  const errorLog = document.getElementById('error-log');
  errorLog.style.display = 'block';
  errorLog.innerHTML = `Error: ${error.message || error}`;
  console.error('Error:', error);
}

function toggleArchive() {
  const archive = document.getElementById('archive');
  const archiveToggleIcon = document.getElementById('archiveToggleIcon');
  if (archive.style.display === 'none') {
    archive.style.display = 'flex';
    archiveToggleIcon.classList.add('rotate');
    localStorage.setItem('archiveState', 'open');
  } else {
    archive.style.display = 'none';
    archiveToggleIcon.classList.remove('rotate');
    localStorage.setItem('archiveState', 'closed');
  }
}

function applyArchiveState() {
  const archiveState = localStorage.getItem('archiveState');
  const archive = document.getElementById('archive');
  const archiveToggleIcon = document.getElementById('archiveToggleIcon');
  if (archiveState === 'open') {
    archive.style.display = 'flex';
    archiveToggleIcon.classList.add('rotate');
  } else {
    archive.style.display = 'none';
    archiveToggleIcon.classList.remove('rotate');
  }
}

function openModal(imageUrl) {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  modal.style.display = 'block';
  document.documentElement.classList.add('modal-open');
  modalImage.src = imageUrl;
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  document.documentElement.classList.remove('modal-open');
}

function saveRateLimitState(remainingTime) {
  localStorage.setItem('rateLimitExpiry', Date.now() + remainingTime * 1000);
}

function getRemainingRateLimitTime() {
  const expiryTime = parseInt(localStorage.getItem('rateLimitExpiry'), 10);
  if (isNaN(expiryTime)) {
    return 0;
  }
  return Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
}

function startRateLimitTimer(waitTime) {
  console.log(`Rate limit timer started for ${waitTime} seconds.`);
  const rateLimitMessage = document.getElementById('rate-limit-message');
  const countdownSpan = document.getElementById('countdown');

  if (!rateLimitMessage || !countdownSpan) {
    console.error('Rate limit message element or countdown span not found!');
    return;
  }

  isRateLimited = true;
  saveRateLimitState(waitTime);
  setGenerateButtonState(false);

  let remainingTime = waitTime;
  countdownSpan.textContent = remainingTime;

  rateLimitMessage.classList.remove('hidden');

  const interval = setInterval(() => {
    remainingTime -= 1;
    countdownSpan.textContent = remainingTime;
    if (remainingTime <= 0) {
      clearInterval(interval);
      hideRateLimitMessage();
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', function () {
  const remainingTime = getRemainingRateLimitTime();
  if (remainingTime > 0) {
    startRateLimitTimer(remainingTime);
  }

  document.getElementById('generate-btn').addEventListener('click', generateImages);
  document.getElementById('prompt').addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !isRateLimited) {
      event.preventDefault();
      generateImages();
    }
  });

  document.getElementById('toggleIcon').addEventListener('click', toggleTheme);
  document.getElementById('archiveToggle').addEventListener('click', toggleArchive);
  document.getElementById('downloadButton').addEventListener('click', downloadImage);

  const modal = document.getElementById('imageModal');
  const btnClose = document.querySelector('.close-modal');

  btnClose.addEventListener('click', closeModal);
  window.addEventListener('click', (event) => {
    const modalBox = document.querySelector('.modal > div');
    if (event.target === modalBox) {
      modal.style.display = 'none';
      document.documentElement.classList.remove('modal-open');
    }
  });

  loadArchive();
  applyArchiveState();
});

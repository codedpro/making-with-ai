let isRateLimited = false;
let isGenerating = false;
let rateLimitTimer;

function toggleMenu() {
  const menu = document.getElementById('menu');

  if (menu.style.display === 'block') {
    menu.classList.remove('show');
    menu.style.display = 'none';
  } else {
    menu.style.display = 'block';
    menu.classList.add('show');
  }
}

window.onclick = function (event) {
  if (!event.target.matches('.hamburger-icon')) {
    var menu = document.getElementById('menu');
    if (menu.style.display === 'block') {
      menu.classList.remove('show');
      menu.style.display = 'none';
    }
  }
};

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

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  const toggleIcon = document.getElementById('toggleIcon');
  document.body.setAttribute('data-theme', savedTheme || 'dark');
}

function enhancePrompt(userPrompt) {
  return userPrompt;
}
function initializeImageComparison() {
  const slider = document.getElementById('slider');
  const generatedImage = document.getElementById('generated-image');
  let isSliding = false;

  const minPosition = 10;
  const maxPosition = 502;

  const startSlide = (event) => {
    isSliding = true;
    moveSlider(event);
  };

  const stopSlide = () => {
    isSliding = false;
  };

  const moveSlider = (event) => {
    if (!isSliding) return;

    const rect = slider.parentElement.getBoundingClientRect();
    let position = event.clientX - rect.left;

    if (position < minPosition) position = minPosition;
    if (position > maxPosition) position = maxPosition;

    slider.style.left = `${position}px`;
    generatedImage.style.clipPath = `inset(0 ${rect.width - position}px 0 0)`;
  };

  slider.addEventListener('mousedown', startSlide);
  document.addEventListener('mouseup', stopSlide);
  document.addEventListener('mousemove', moveSlider);
}

document.addEventListener('DOMContentLoaded', initializeImageComparison);

async function generateImages() {
  if (isRateLimited || isGenerating) {
    alert('Cannot generate images. Rate limited or already generating.');
    return;
  }

  isGenerating = true;
  setGenerateButtonState(false);

  const userPrompt = document.getElementById('prompt').value.trim();
  const imageType = document.getElementById('imageType').value;
  const additionalParam = document.getElementById('additionalParam').value;
  const inputImage = document.getElementById('inputImage').files[0];
  const imageContainer = document.getElementById('image-container');
  const errorLog = document.getElementById('error-log');
  const comparisonContainer = document.getElementById('comparison-container');
  const originalImageElement = document.getElementById('original-image');
  const generatedImageElement = document.getElementById('generated-image');
  const spinnerContainer = document.getElementById('spinner-container');

  if (!inputImage) {
    logError('Please upload an image to transform.');
    isGenerating = false;
    setGenerateButtonState(true);
    return;
  }

  const combinedPrompt = `Refine This Image for me`.trim();

  errorLog.innerHTML = '';
  hideRateLimitMessage();

  // Show the spinner
  spinnerContainer.classList.remove('hidden');

  try {
    const formData = new FormData();
    formData.append('prompt', combinedPrompt);
    formData.append('image', inputImage);
    formData.append('imageCount', 1);

    const response = await axios.post('/api/image-to-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    imageContainer.innerHTML = '';

    if (response.status === 200) {
      const data = response.data;
      addToArchive(data.image);
      originalImageElement.src = URL.createObjectURL(inputImage);
      generatedImageElement.src = data.image;
      originalImageElement.onclick = () => openModal(originalImageElement.src);
      generatedImageElement.onclick = () => openModal(generatedImageElement.src);
      generatedImageElement.onload = function () {
        comparisonContainer.style.display = 'block';
        initializeImageComparison();
      };
    } else {
      logError(response.data.error || 'Unknown API error');
    }
  } catch (error) {
    console.log({ error });
    logError('Network or server error occurred');
  } finally {
    spinnerContainer.classList.add('hidden');

    isGenerating = false;
    if (!isRateLimited) {
      setGenerateButtonState(true);
    }
  }
}

function setGenerateButtonState(enabled) {
  const generateButton = document.getElementById('generate-btn');
  generateButton.disabled = !enabled;
  const promptInput = document.getElementById('prompt');
  promptInput.disabled = !enabled;

  if (enabled) {
    generateButton.innerHTML = 'Generate (↵)';
  } else {
    generateButton.innerHTML = 'Generating...';
  }
}

// Other functions remain unchanged

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
  const span = document.getElementsByClassName('close')[0];

  span.addEventListener('click', closeModal);
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  loadArchive();
  applySavedTheme();
  applyArchiveState();
});

function createImageElement(imageUrl, index) {
  // const imageElement = document.createElement('div');
  // imageElement.className = 'image-item';
  //imageElement.innerHTML = `<img src="${imageUrl}" alt="Generated image ${index + 1}" onclick="openModal('${imageUrl}')">`;
  return null;
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
  const promptInput = document.getElementById('prompt');
  generateButton.disabled = !enabled;
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
  let archivedImages = JSON.parse(localStorage.getItem('image-to-image-archived')) || [];
  if (!archivedImages.includes(imageUrl)) {
    archivedImages.push(imageUrl);
    localStorage.setItem('image-to-image-archived', JSON.stringify(archivedImages));
  }
  updateArchiveToggleVisibility();
  loadArchive();
}

document.getElementById('slider').addEventListener('mousedown', function (e) {
  e.preventDefault();
  document.body.style.userSelect = 'none';
});

document.addEventListener('mouseup', function () {
  document.body.style.userSelect = '';
});
function loadArchive() {
  const archivedImages = JSON.parse(localStorage.getItem('image-to-image-archived')) || [];
  const archive = document.getElementById('archive');
  archive.innerHTML = '';
  archivedImages.forEach((imageUrl, index) => {
    const archiveItem = document.createElement('div');
    archiveItem.className = 'archive-item';
    archiveItem.innerHTML = `<img src="${imageUrl}" alt="Archived image ${
      index + 1
    }" onclick="openModal('${imageUrl}')" draggable="false">
                <button class="delete-btn" onclick="deleteImage(${index})">×</button>`;
    archive.appendChild(archiveItem);
  });
  updateArchiveToggleVisibility();
}

function deleteImage(index) {
  let archivedImages = JSON.parse(localStorage.getItem('image-to-image-archived')) || [];
  archivedImages.splice(index, 1);
  localStorage.setItem('image-to-image-archived', JSON.stringify(archivedImages));
  loadArchive();
}

function updateArchiveToggleVisibility() {
  const archiveToggle = document.getElementById('archiveToggle');
  const archivedImages = JSON.parse(localStorage.getItem('image-to-image-archived')) || [];
  archiveToggle.style.display = archivedImages.length > 0 ? 'flex' : 'none';
}

function logError(error) {
  const errorLog = document.getElementById('error-log');
  errorLog.style.display = 'block';
  errorLog.innerHTML = `Error: ${error.message || error}`;
  console.error('Error:', error);
}
const inputImage = document.getElementById('inputImage');
const generateBtn = document.getElementById('generate-btn');

generateBtn.disabled = true;

inputImage.addEventListener('change', function (event) {
  const file = event.target.files[0];
  const errorLog = document.getElementById('error-log');

  generateBtn.disabled = !file;

  if (file) {
    const img = new Image();
    img.onload = function () {
      if (img.width > 1920 || img.height > 1080) {
        logError('Please upload an image with a resolution up to 1920x1080 pixels.');
        event.target.value = ''; // Clear the file input
        generateBtn.disabled = true; // Disable the button if the resolution is too high
      } else {
        console.log('Image is within the acceptable resolution.');
        errorLog.innerHTML = ''; // Clear the error log if the image is acceptable
      }
    };

    img.src = URL.createObjectURL(file);
  } else if (errorLog.innerHTML === '') {
    logError('Please upload an image to transform.');
  }
});

// Add a click event listener to the generate button
generateBtn.addEventListener('click', function (event) {
  const errorLog = document.getElementById('error-log');

  if (generateBtn.disabled && errorLog.innerHTML === '') {
    logError('Please upload an image to transform.');
  }
});

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

function toggleArchive() {
  const archive = document.getElementById('archive');
  const archiveToggleIcon = document.getElementById('archiveToggleIcon');
  if (archive.style.display === 'none') {
    archive.style.display = 'block';
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
    archive.style.display = 'block';
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
  modalImage.src = imageUrl;
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
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
  const span = document.getElementsByClassName('close')[0];

  span.addEventListener('click', closeModal);
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  loadArchive();
  applySavedTheme();
  applyArchiveState();
});

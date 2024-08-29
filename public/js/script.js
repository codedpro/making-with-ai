const images = [

    // 1024x1024

    { name: '', src: 'images/1024x1024/beatch-house-1-1024x1024.webp', resolution: '1024x1024' },
    { name: '', src: 'images/1024x1024/cottage-house-1-1024x1024.webp', resolution: '1024x1024' },
    { name: '', src: 'images/1024x1024/cozy-house-1-1024x1024.webp', resolution: '1024x1024' },
    { name: '', src: 'images/1024x1024/estate-1-1024x1024.webp', resolution: '1024x1024' },
    { name: '', src: 'images/1024x1024/modern-house-1-1024x1024.webp', resolution: '1024x1024' },

    // 1792x1024

    { name: '', src: 'images/1792x1024/coastal-city-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/eco-house-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/futuristic-city-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/historic-city-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/modern-house-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/streets-city-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/vibrant-city-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/victorical-house-1-1792x1024.webp', resolution: '1792x1024' },
    { name: '', src: 'images/1792x1024/wooden-house-1-1792x1024.webp', resolution: '1792x1024' },

];

document.addEventListener('DOMContentLoaded', () => {
    const imageContainer = document.getElementById('imageContainer');
    loadImages(imageContainer, images);

    document.getElementById('searchButton').addEventListener('click', handleSearch);
    document.getElementById('filterTypeSelect').addEventListener('change', handleFilter);
    document.getElementById('filterResolutionSelect').addEventListener('change', handleFilter);
});

function loadImages(container, imageList) {
    container.innerHTML = '';
    imageList.forEach(image => {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.dataset.name = image.name;
        div.dataset.type = image.name.split('.').pop().toLowerCase();
        div.dataset.resolution = image.resolution;

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.name;

        const button = document.createElement('button');
        button.innerText = 'Download';
        button.onclick = function() {
            const link = document.createElement('a');
            link.href = image.src;
            link.download = image.name;
            link.click();
        };

        const nameText = document.createElement('p');
        nameText.innerText = `${image.name} (${image.resolution})`;

        div.appendChild(img);
        div.appendChild(nameText);
        div.appendChild(button);
        container.appendChild(div);
    });
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const imageItems = document.querySelectorAll('.image-item');

    imageItems.forEach(item => {
        const imageName = item.dataset.name.toLowerCase();
        if (imageName.includes(searchInput)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function handleFilter() {
    const filterTypeValue = document.getElementById('filterTypeSelect').value;
    const filterResolutionValue = document.getElementById('filterResolutionSelect').value;
    const imageItems = document.querySelectorAll('.image-item');

    imageItems.forEach(item => {
        const imageType = item.dataset.type;
        const imageResolution = item.dataset.resolution;

        const typeMatch = filterTypeValue === 'all' || imageType === filterTypeValue;
        const resolutionMatch = filterResolutionValue === 'all' || imageResolution === filterResolutionValue;

        if (typeMatch && resolutionMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}
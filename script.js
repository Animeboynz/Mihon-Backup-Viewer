document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const useDemoDataButton = document.getElementById('use-demo-data');

    fileInput.addEventListener('change', handleFileUpload);
    useDemoDataButton.addEventListener('click', () => {
        fetch('data.json')
            .then(response => response.json())
            .then(data => initializeLibrary(data))
            .catch(error => console.error('Error loading demo data:', error));
        closeModal('upload-modal');
    });

    document.getElementById('close-manga-modal').addEventListener('click', () => {
        closeModal('manga-modal');
    });

    // Show the upload modal by default
    showModal('upload-modal');
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            initializeLibrary(data);
            closeModal('upload-modal');
        } catch (error) {
            alert('Invalid JSON file. Please upload a valid JSON.');
        }
    };

    if (file) {
        reader.readAsText(file);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function initializeLibrary(data) {
    const tabsContainer = document.getElementById('tabs');
    const tabContentsContainer = document.getElementById('tab-contents');
    const categories = data.backupCategories;
    const mangaItems = data.backupManga;

    // Clear existing content
    tabsContainer.innerHTML = '';
    tabContentsContainer.innerHTML = '';

    // Ensure 'Default' tab is always first
    categories.unshift({ name: 'Default', order: -1 });

    // Create tabs and tab contents
    categories.sort((a, b) => a.order - b.order).forEach(category => {
        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = category.name;
        tabButton.onclick = () => showTab(category.name);
        tabsContainer.appendChild(tabButton);

        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = category.name;
        tabContentsContainer.appendChild(tabContent);
    });

    // Populate manga items into the correct tab content
    mangaItems.forEach((item, index) => {
        const itemCategories = item.categories || [-1]; // -1 represents Default
        itemCategories.forEach(catOrder => {
            const category = categories.find(cat => cat.order === catOrder) || { name: 'Default' };
            const tabContent = document.getElementById(category.name);

            const mangaItem = document.createElement('div');
            mangaItem.className = 'manga-item';
            mangaItem.innerHTML = `
                <img src="${item.thumbnailUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='nocover.jpg';">
                <p>${item.title}</p>`;
            mangaItem.addEventListener('click', () => {
                showMangaDetails(item, data.backupCategories);
            });
            tabContent.appendChild(mangaItem);
        });
    });

    // Show the Default tab on page load
    showTab('Default');
}


function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Show the selected tab content
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add('active');
}

function showMangaDetails(manga, categories) {
    document.getElementById('manga-title').textContent = manga.title;
    document.getElementById('manga-thumbnail').src = manga.thumbnailUrl;
    document.getElementById('manga-genres').textContent = `Genres: ${manga.genre.join(', ')}`;
    document.getElementById('manga-author').textContent = `Author: ${manga.author}`;
    document.getElementById('manga-description').textContent = manga.description;

    const categoriesText = manga.categories && manga.categories.length > 0 ?
        `Categories: ${manga.categories.map(catOrder => {
            const category = categories.find(cat => cat.order === catOrder);
            return category ? category.name : 'Unknown';
        }).join(', ')}` :
        'Categories: Unknown';
    document.getElementById('manga-categories').textContent = categoriesText;

    const chaptersContainer = document.getElementById('manga-chapters');
    chaptersContainer.innerHTML = '';

    if (Array.isArray(manga.chapters)) {
        manga.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
        manga.chapters.forEach((chapter) => {
            const chapterBox = document.createElement('div');
            chapterBox.className = 'chapter-box';

            const chapterLink = document.createElement('a');
            chapterLink.href = chapter.url;
            chapterLink.textContent = chapter.name;
            chapterLink.target = '_blank';
            if (chapter.read) {
                chapterLink.classList.add('read');
            }

            const lastReadDate = document.createElement('span');
            lastReadDate.className = 'chapter-date';
            if (Array.isArray(manga.history)) {
                const historyItem = manga.history.find(history => history.url === chapter.url);
                if (historyItem) {
                    const date = new Date(parseInt(historyItem.lastRead));
                    const options = { day: 'numeric', month: 'long', year: 'numeric' };
                    lastReadDate.textContent = `${date.toLocaleDateString('en-GB', options)}`;
                }
            }

            chapterBox.appendChild(chapterLink);
            chapterBox.appendChild(lastReadDate);
            chaptersContainer.appendChild(chapterBox);
        });
    }

    showModal('manga-modal');
}










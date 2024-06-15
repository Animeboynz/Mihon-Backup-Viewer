const re = RegExp('^(http|https)://');

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

    document.addEventListener('mousedown', (event) => {
        const mangaModal = document.getElementById('manga-modal');
        if (event.target === mangaModal && mangaModal.classList.contains('active')) {
            closeModal('manga-modal');
        }
    })

    // Show the upload modal by default
    showModal('upload-modal');
});

document.getElementById('file-input').addEventListener('change', function(event) {
    var file = event.target.files[0];

    if (!file) {
        alert('Please select a file.');
        return;
    }

    // Load protobuf schema
    protobuf.load("schema.proto", function(err, root) {
        if (err) throw err;

        // Resolve Backup message type
        var Backup = root.lookupType("Backup");

        var reader = new FileReader();
        reader.onload = function(event) {
            var arrayBuffer = event.target.result;

            // Decompress the gzip file
            var inflated = pako.inflate(new Uint8Array(arrayBuffer));

            // Decode the protobuf encoded binary data
            var message = Backup.decode(inflated);

            // Convert the decoded message to JSON format
            var jsonMessage = Backup.toObject(message, {
                longs: String,
                enums: String,
                bytes: String,
            });

            // Display the decoded message in the HTML
            //document.getElementById("output").textContent = JSON.stringify(jsonMessage, null, 2);
            initializeLibrary(jsonMessage);
            closeModal('upload-modal');
        };
        reader.readAsArrayBuffer(file);
    });
});


function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const fileName = file.name;
            const extension = fileName.split('.').pop().toLowerCase();
            let data;
            if (extension === 'json') {
                data = JSON.parse(e.target.result);
            } else if (extension === 'tachibk') {
                //decodeTachibkFile(e.target.result);
                return;
            } else {
                alert('Unsupported file type. Please upload a valid JSON or .tachibk file.');
                return;
            }
            initializeLibrary(data);
            closeModal('upload-modal');
        } catch (error) {
            alert('Error processing the file. Please upload a valid file.');
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
    categories.sort((a, b) => a.order - b.order).forEach((category, index) => {
        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        if (category.order === -1) {
            tabButton.textContent = `${category.name} (${mangaItems.filter((manga) => manga.categories == null).length})`;
        } else {
            tabButton.textContent = `${category.name} (${mangaItems.filter((manga) => manga.categories?.indexOf(category.order) >= 0).length})`;
        }
        tabButton.onclick = () => showTab(category.name);
        if (index === 0) {
            tabButton.classList.add('active');
        }
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

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show the selected tab content
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add('active');

    // Add active class to the selected tab button
    const selectedTabButton = Array.from(tabButtons).find(button => button.textContent === tabId);
    if (selectedTabButton) {
        selectedTabButton.classList.add('active');
    }
}

function showMangaDetails(manga, categories) {
    document.getElementById('manga-title').textContent = manga.title;
    const mangaThumbnail = document.getElementById('manga-thumbnail');
    mangaThumbnail.src = manga.thumbnailUrl;
    mangaThumbnail.onerror = () => {
        mangaThumbnail.src = 'nocover.jpg';
    };
    document.getElementById('manga-genres').textContent = `Genres: ${manga.genre.join(', ')}`;
    document.getElementById('manga-author').textContent = `Author: ${manga.author}`;
    document.getElementById('manga-description').textContent = manga.description;

    const categoriesText = manga.categories && manga.categories.length > 0 ?
        `Categories: ${manga.categories.map(catOrder => {
            const category = categories.find(cat => cat.order === catOrder);
            return category ? category.name : 'Default';
        }).join(', ')}` :
        'Categories: Default';
    document.getElementById('manga-categories').textContent = categoriesText;

    const chaptersContainer = document.getElementById('manga-chapters');
    chaptersContainer.innerHTML = '';

    if (Array.isArray(manga.chapters)) {
        manga.chapters.sort((a, b) => {
            if (a.sourceOrder === undefined) return 1;
            if (b.sourceOrder === undefined) return -1;
            return b.sourceOrder - a.sourceOrder;
        });

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

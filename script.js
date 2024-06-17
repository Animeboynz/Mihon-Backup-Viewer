const re = RegExp('^https?://');

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const useDemoDataButton = document.getElementById('use-demo-data');

    fileInput.addEventListener('change', handleFileLoad);
    //Loads Demo Data from data.json when button pressed on Load Modal
    useDemoDataButton.addEventListener('click', () => {
        fetch('data.json')
            .then(response => response.json())
            .then(data => initializeLibrary(data))
            .catch(error => console.error('Error loading demo data:', error));
        closeModal('load-modal'); // Closes the Load Modal
    });

    // Closes the Manga Model is the X button is pressed
    document.getElementById('close-manga-modal').addEventListener('click', () => {
        closeModal('manga-modal');
    });

    document.addEventListener('mousedown', (event) => {
        const mangaModal = document.getElementById('manga-modal');
        if (event.target === mangaModal && mangaModal.classList.contains('active')) {
            closeModal('manga-modal');
        }
    })

    // Show the load modal by default
    showModal('load-modal');
});

function handleFileLoad(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const fileName = file.name; // Gets filename to check nested extensions e.g. proto.gz
        const extension = fileName.split('.').pop().toLowerCase(); // Used to check extensions (Future me replace with fileName.endsWith(''))

        try {
            if (extension === 'json') {
                const data = JSON.parse(e.target.result);
                initializeLibrary(data); // Initialises Library with loaded JSON
                closeModal('load-modal'); // Closes the Load Modal
            } else if (extension === 'tachibk' || fileName.endsWith('.proto.gz')) {
                // Load protobuf schema
                protobuf.load("schema.proto", (err, root) => {
                    if (err) {
                        alert('Error loading protobuf schema.');
                        return;
                    }

                    const Backup = root.lookupType("Backup"); // Resolve Backup message type
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        try {
                            const arrayBuffer = e.target.result;
                            const inflated = pako.inflate(new Uint8Array(arrayBuffer)); // Decompress the gzip file
                            const message = Backup.decode(inflated); // Decode the protobuf encoded binary data
                            // Convert the decoded message to JSON format
                            const jsonMessage = Backup.toObject(message, {
                                longs: String,
                                enums: String,
                                bytes: String,
                            });
                            initializeLibrary(jsonMessage); // Initialises Library with the Converter protobuf
                            closeModal('load-modal'); // Closes the Load Modal
                        } catch (error) {
                            alert('Error decoding protobuf file.');
                        }
                    };

                    reader.readAsArrayBuffer(file);
                });
            } else {
                alert('Unsupported file type. Please pick a valid .json, .tachibk, or .proto.gz file.');
            }
        } catch (error) {
            alert('Error processing the file. Please pick a valid file.');
        }
    };

    if (file) {
        reader.readAsText(file);
    }
}

// Function to close the modal with the passed ID
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Function to show the modal with the passed ID
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

// Function to Initialise the Tab Contents and Library from the JSON data passed to it.
function initializeLibrary(data) {
    const tabsContainer = document.getElementById('tabs');
    const tabContentsContainer = document.getElementById('tab-contents');
    const categories = data.backupCategories;
    const mangaItems = data.backupManga;

    // Sets the order to 0 if a category has no order property
    if (!categories[0].hasOwnProperty('order')) categories[0].order = '0';

    // Clear existing content
    tabsContainer.innerHTML = '';
    tabContentsContainer.innerHTML = '';

    // Tab for entries with read history but not in library
    categories.unshift({ name: 'History', order: 65535 }); // Sets history tab's order as last

    // Ensure 'Default' tab is always first
    categories.unshift({ name: 'Default', order: -1 });

    // Create tabs and tab contents
    categories.sort((a, b) => a.order - b.order).forEach((category, index) => {
        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.id = `btn${category.name}`;
        tabButton.textContent = category.order === 65535 ? '⌛' : category.name;

        const badge = document.createElement('span');
        badge.className = 'badge';
        switch (category.order) {
            default:
                badge.textContent = mangaItems.filter((manga) =>
                    manga.favorite !== false &&
                    manga.categories?.indexOf(category.order) >= 0
                ).length;
                break;
            case -1:
                badge.textContent = mangaItems.filter((manga) =>
                    manga.favorite !== false &&
                    !manga.categories
                ).length;
                break;
            case 65535:
                badge.textContent = mangaItems.filter((manga) =>
                    manga.favorite === false
                ).length;
                break;
        }

        tabButton.onclick = () => showTab(category.name);
        tabButton.appendChild(badge);
        if (badge.textContent === '0') return  // Don't bother creating empty elements
        tabsContainer.appendChild(tabButton);

        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = category.name;
        tabContentsContainer.appendChild(tabContent);
    });

    // Populate manga items into the correct tab content
    mangaItems.sort((a, b) =>
        (b.history?.lastread || b.lastModifiedAt) - (a.history?.lastread || a.lastModifiedAt)
    ).forEach((manga) => {
        const itemCategories = manga.favorite === false ? [65535] : manga.categories || [-1]; // -1 = Default | 65535 = History
        itemCategories.forEach((catOrder) => {
            const category = categories.find((cat) => cat.order === catOrder) || { name: 'Default' };
            const tabContent = document.getElementById(category.name);

            const mangaItem = document.createElement('div');
            mangaItem.className = 'manga-item';
            mangaItem.innerHTML = `
                <img src="${manga.customThumbnailUrl || manga.thumbnailUrl}" loading="lazy" title="${manga.customTitle || manga.title}" alt="">
                <p>${manga.customTitle || manga.title}</p>`;
            mangaItem.addEventListener('click', () => {
                showMangaDetails(manga, data.backupCategories, data.backupSources.find(source => source.sourceId === manga.source).name);
            });
            tabContent.appendChild(mangaItem);
        });
    });

    // Show the first tab on page load
    showTab(document.querySelector(".tab-content").id);
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
    const selectedTabButton = Array.from(tabButtons).find(button => button.id === `btn${tabId}`);
    if (selectedTabButton) {
        selectedTabButton.classList.add('active');
    }
}

function showMangaDetails(manga, categories, source) {
    document.getElementById('manga-title').textContent = manga.customTitle || manga.title;
    document.getElementById('manga-source').textContent = source;
    const mangaThumbnail = document.getElementById('manga-thumbnail');
    mangaThumbnail.src = manga.customThumbnailUrl || manga.thumbnailUrl;
    const mangaStatus = (() => {
      switch (manga.status) {
          case 1: return 'Ongoing';
          case 2: return 'Completed';
          case 3: return 'Licenced';
          case 4: return 'Publishing Finished';
          case 5: return 'Cancelled';
          case 6: return 'On Hiatus';
          default: return 'Unknown';
      }
    })();
    document.getElementById('manga-genres').textContent = `Genres: ${(manga.customGenre || manga.genre || ["None"]).join(', ')}`;
    document.getElementById('manga-author').textContent = `Author: ${manga.customAuthor || manga.author}`;
    document.getElementById('manga-author').hidden = (!manga.customAuthor && !manga.author) ? true : false;
    document.getElementById('manga-artist').textContent = `Artist: ${manga.customArtist || manga.artist}`;
    document.getElementById('manga-artist').hidden = (!manga.customArtist && !manga.artist) ? true : false;
    document.getElementById('manga-description').innerText = (manga.customDescription || manga.description);
    document.getElementById('manga-status').textContent = mangaStatus; 

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
            chapterLink.textContent = chapter.name;
            if (chapter.url.match(re)) {
                chapterLink.href = chapter.url;
                chapterLink.target = '_blank';
            }
            if (chapter.read) {
                chapterLink.classList.add('read');
            }

            const lastReadDate = document.createElement('span');
            lastReadDate.className = 'chapter-date';
            if (Array.isArray(manga.history)) {
                const historyItem = manga.history.find(history => history.url === chapter.url);
                if (historyItem) {
                    const date = new Date(parseInt(historyItem.lastRead));
                    lastReadDate.textContent = `${date.toLocaleString()}`;
                }
            }

            chapterBox.appendChild(chapterLink);
            chapterBox.appendChild(lastReadDate);
            chaptersContainer.appendChild(chapterBox);
        });
    }


    showModal('manga-modal');
    const mangaModalContent = document.querySelector('#manga-modal .modal-content');
    mangaModalContent.scrollTop = 0;
}

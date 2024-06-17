const re = RegExp('^https?://');

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

    if (!categories[0].hasOwnProperty('order')) categories[0].order = '0'; // The first category doesn't seem to have order property in my backups.

    // Clear existing content
    tabsContainer.innerHTML = '';
    tabContentsContainer.innerHTML = '';

    // Tab for entries with read history but not in library
    categories.unshift({ name: 'History', order: 65535 });

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
    document.documentElement.style.setProperty('--manga-header-bg', `url('${mangaThumbnail.src}')`);
    const mangaAuthor = document.getElementById('manga-author');
    const mangaArtist = document.getElementById('manga-artist');
    const mangaDescription = document.getElementById('manga-description');
    const mangaStatus = document.getElementById('manga-status');

    const mangaStatusText = (() => {
      switch (manga.status) {
          case 1: 
	    addMaterialSymbol(mangaStatus, 'schedule');
	    return 'Ongoing';
          case 2:
	    addMaterialSymbol(mangaStatus, 'done_all');
	    return 'Completed';
	  case 3:
	    addMaterialSymbol(mangaStatus, 'attach_money');
	    return 'Licenced';
          case 4: 
	    addMaterialSymbol(mangaStatus, 'check');
	    return 'Publishing Finished';
          case 5:
	    addMaterialSymbol(mangaStatus, 'close');
	    return 'Cancelled';
          case 6:
	    addMaterialSymbol(mangaStatus, 'pause');
	    return 'On Hiatus';
          default:
	    addMaterialSymbol(mangaStatus, 'block');
	    return 'Unknown';
      }
    })();

    mangaAuthor.innerHTML = '';
    mangaArtist.innerHTML = '';
    mangaStatus.innerHTML = '';
    
    document.getElementById('manga-genres').textContent = `Genres: ${(manga.customGenre || manga.genre || ["None"]).join(', ')}`;
    addMaterialSymbol(mangaAuthor, 'person');
    mangaAuthor.innerHTML += (manga.customAuthor || manga.author);
    mangaAuthor.hidden = (!manga.customAuthor && !manga.author) ? true : false;
    addMaterialSymbol(mangaArtist, 'brush');
    mangaArtist.innerHTML += (manga.customArtist || manga.artist);
    mangaArtist.hidden = (!manga.customArtist && !manga.artist) ? true : false;
    mangaDescription.innerText = (manga.customDescription || manga.description);
    mangaDescription.innerHTML += '<span class="fade-out" onclick="toggleExpand(this)"></span>';
    mangaDescription.classList.remove('expanded');
    document.getElementById('manga-status').innerHTML += mangaStatusText; 

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
}

function toggleExpand(element) {
    if (element.parentNode.classList.toggle('expanded')) {
	element.style.transition = 'opacity 0.5s ease';
	element.style.opacity = '0';
    } else {
	setTimeout(() => {
	    element.style.transition = 'none';
	    element.style.opacity = '1';
	}, 500);
    }
}

function addMaterialSymbol(element, symbol) {
    const symbolSpan = document.createElement('span');
    symbolSpan.className = 'material-symbols-outlined';
    symbolSpan.textContent = symbol;
    element.appendChild(symbolSpan);    
}

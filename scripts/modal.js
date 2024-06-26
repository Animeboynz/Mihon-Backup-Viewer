
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

    mangaStatus.innerHTML = '';
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
                return 'Licensed';
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

    const genres = document.getElementById('manga-genres');
    genres.innerHTML = '';
    (manga.customGenre || manga.genre || ['None']).forEach(tag => {
        const li = document.createElement('li');
        li.innerText = tag;
        genres.appendChild(li);
    });
    addMaterialSymbol(mangaAuthor, 'person');
    mangaAuthor.innerHTML += manga.customAuthor || manga.author;
    mangaAuthor.hidden = !manga.customAuthor && !manga.author ? true : false;
    addMaterialSymbol(mangaArtist, 'brush');
    mangaArtist.innerHTML += manga.customArtist || manga.artist;
    mangaArtist.hidden = !manga.customArtist && !manga.artist ? true : false;
    mangaDescription.innerText = manga.customDescription || manga.description;
    mangaDescription.parentNode.classList.remove('expanded');
    mangaDescription.parentNode.style.maxHeight = '3.6em';
    document.getElementById('description-expand-icon').style.transform = 'none';
    document.getElementById('manga-status').innerHTML += mangaStatusText;

    const mangaCategories = document.getElementById('manga-categories');
    mangaCategories.innerHTML = '';

    if (manga.categories && manga.categories.length > 0) {
        manga.categories
            .map(catOrder => {
                const category = categories.find(cat => cat.order === catOrder);
                return category ? category.name : 'Default';
            })
            .forEach(cat => {
                const li = document.createElement('li');
                li.id = cat;
                addMaterialSymbol(li, 'label');
                li.innerHTML += cat;
                li.addEventListener('click', function () {
                    closeModal('manga-modal');
                    showTab(this.id);
                });
                mangaCategories.appendChild(li);
            });
    } else {
        const li = document.createElement('li');
        addMaterialSymbol(li, 'label');
        li.id = 'Default';
        li.innerHTML += 'Default';
        li.addEventListener('click', function () {
            closeModal('manga-modal');
            showTab(this.id);
        });
        mangaCategories.appendChild(li);
    }

    const chaptersContainer = document.getElementById('manga-chapters');
    chaptersContainer.innerHTML = '';

    if (Array.isArray(manga.chapters)) {
        manga.chapters.sort((a, b) => {
            if (a.sourceOrder === undefined) return 1;
            if (b.sourceOrder === undefined) return -1;
            return b.sourceOrder - a.sourceOrder;
        });

        manga.chapters.forEach(chapter => {
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

function toggleExpandDescription() {
    const mangaDescriptionDiv = document.getElementById('manga-description-div');
    if (document.querySelector('.fade-out').parentNode.classList.toggle('expanded')) {
        const mangaDescription = document.getElementById('manga-description');
        const maxDivSize =
            mangaDescription.offsetHeight / parseInt(window.getComputedStyle(mangaDescription).fontSize) +
            5;
        mangaDescriptionDiv.style.maxHeight = `${maxDivSize}em`;
        document.getElementById('description-expand-icon').style.transform = 'scaleY(-1)';
    } else {
        document.getElementById('description-expand-icon').style.transform = 'none';
        mangaDescriptionDiv.style.maxHeight = '3.6em';
    }
}

function addMaterialSymbol(element, symbol) {
    const symbolSpan = document.createElement('span');
    symbolSpan.className = 'material-symbols-outlined';
    symbolSpan.textContent = symbol;
    element.appendChild(symbolSpan);
}
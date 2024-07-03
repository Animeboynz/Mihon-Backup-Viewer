import Constants from './constants.js';
import { closeModal, showModal } from './modals.js';
import { addMaterialSymbol } from './materialSymbol.js';

const url = new URL(window.location);
var filterStatus = ['-1'];
var filterSource = ['all'];
var filterTracking = 'all-entries';
var sortOrder =
  url.searchParams.get('sort-order') || localStorage.getItem('MBV_SortOrder') || 'title-asc';
var activeTabId = null;
const re = RegExp('^https?://');

export { filterStatus, filterTracking, filterSource, sortOrder, activeTabId };

// Function to Initialise the Tab Contents and Library from the JSON found in the data variable.
export function initializeLibrary() {
  const categories = window.data.backupCategories || [];
  let mangaItems = window.data.backupManga;

  mangaItems = mangaItems.filter(manga => {
    let matchesStatus =
      filterStatus.includes('-1') || filterStatus.includes(manga.status?.toString());
    let matchesSource = filterSource.includes('all') || filterSource.includes(manga.source);
    let matchesTracking =
      filterTracking === 'all-entries' ||
      (filterTracking === 'tracked' && manga.tracking) ||
      (filterTracking === 'untracked' && !manga.tracking);
    let matchesSearch = search(
      Constants.searchField.value,
      `${manga.title}\n${manga.description}\n${manga.genre?.join(' ')}`
    );
    return matchesStatus && matchesSource && matchesTracking && matchesSearch;
  });

  // Sets the order to 0 if a category has no order property
  if (categories[0] && !categories[0].hasOwnProperty('order')) categories[0].order = '0';

  // Clear existing content
  Constants.tabsContainer.innerHTML = '';
  Constants.tabContentsContainer.innerHTML = '';

  // Add 'History' tab if it doesn't exist
  if (!categories.some(category => category.name === 'History')) {
    categories.push({ name: 'History', order: 65535 }); // Sets history tab's order as last
  }

  // Ensure 'Default' tab is always first, but add only if it doesn't exist
  if (!categories.some(category => category.name === 'Default')) {
    categories.unshift({ name: 'Default', order: -1 });
  }

  // Create tabs and tab contents
  categories
    .sort((a, b) => a.order - b.order)
    .forEach((category, index) => {
      // Create tab button
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-button';
      tabButton.id = `btn${category.name}`;
      tabButton.title = tabButton.textContent = category.name;
      if (category.order === 65535) {
        tabButton.textContent = null;
        addMaterialSymbol(tabButton, 'history');
      }

      const badge = document.createElement('span');
      badge.className = 'badge';
      switch (category.order) {
        default:
          badge.textContent = mangaItems.filter(
            manga => manga.favorite !== false && manga.categories?.indexOf(category.order) >= 0
          ).length;
          break;
        case -1:
          badge.textContent = mangaItems.filter(
            manga => manga.favorite !== false && !manga.categories
          ).length;
          break;
        case 65535:
          badge.textContent = mangaItems.filter(manga => manga.favorite === false).length;
          break;
      }

      tabButton.onclick = () => showTab(category.name);
      tabButton.appendChild(badge);
      if (badge.textContent === '0' && [-1, 65535].includes(category.order)) return; // Don't create empty meta-categories
      Constants.tabsContainer.appendChild(tabButton);

      // Create tab content container
      const tabContent = document.createElement('div');
      tabContent.className = 'tab-content';
      tabContent.id = category.name;
      Constants.tabContentsContainer.appendChild(tabContent);
    });

  // Populate manga items into the correct tab content
  mangaItems
    .sort((a, b) => {
      switch (sortOrder) {
        case 'recently-updated':
          return (
            (b.history?.lastread || b.lastModifiedAt) - (a.history?.lastread || a.lastModifiedAt)
          );
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          // Default to recently-updated if sortOrder is not recognized
          return (
            (b.history?.lastread || b.lastModifiedAt) - (a.history?.lastread || a.lastModifiedAt)
          );
      }
    })
    .forEach(manga => {
      const itemCategories = manga.favorite === false ? [65535] : manga.categories || [-1]; // -1 = Default | 65535 = History
      itemCategories.forEach(catOrder => {
        const category = categories.find(cat => cat.order === catOrder) || { name: 'Default' };
        const tabContent = document.getElementById(category.name);

        const titleFull = manga.customTitle || manga.title;
        const titleTrimmed = titleFull.length > 35 ? titleFull.substring(0, 35) + '…' : titleFull;
        const mangaItem = document.createElement('div');
        mangaItem.className = 'manga-item';
        var title = `Chapters: ${manga.chapters?.length}`;
        title += ` | Read: ${manga.chapters?.filter(c => c.read).length}`;
        if (manga.dateAdded) title += `\nAdded: ${parseDate(manga.dateAdded)}`;
        if (manga.history)
          title += `\nLast Read: ${parseDate(
            Math.max.apply(
              0,
              manga.history.map(h => parseInt(h.lastRead || '0'))
            )
          )}`;
        mangaItem.title = title;
        const cover = document.createElement('img');
        cover.src = manga.customThumbnailUrl || manga.thumbnailUrl;
        cover.loading = 'lazy';
        cover.alt = '';
        const entryTitle = document.createElement('p');
        entryTitle.innerText = titleTrimmed;
        entryTitle.classList.add('manga-item-title');
        mangaItem.appendChild(cover);
        mangaItem.appendChild(entryTitle);
        mangaItem.addEventListener('click', () => {
          showMangaDetails(
            manga,
            window.data.backupCategories,
            window.data.backupSources.find(source => source.sourceId === manga.source).name
          );
        });
        mangaItem.addEventListener('mouseenter', event => {
          entryTitle.innerText = titleFull;
          entryTitle.classList.add('full-title');
        });
        mangaItem.addEventListener('mouseleave', event => {
          entryTitle.innerText = titleTrimmed;
          entryTitle.classList.remove('full-title');
        });
        tabContent.appendChild(mangaItem);
      });
    });

  const tabToShow = document.getElementById(activeTabId)
    ? activeTabId
    : document.querySelector('.tab-content').id;
  showTab(tabToShow);
  addOptionsFromData();
  disableMissingStatusOptions();
}

export function search(searchQuery = '', text = '') {
  let results = [];
  const queryParams = searchQuery.matchAll(
    /(?:(?<!\w)-"(?<excludephrase>.+?)"|"(?<phrase>.+?)"|(?<!\w)-(?<exclude>\w+)|(?<word>\S+))/gi
  );
  for (const match of queryParams) {
    const group = match.groups;
    const re =
      group.phrase || group.excludephrase
        ? new RegExp(`\\b${group.phrase || group.excludephrase}\\b`, 'gi')
        : new RegExp(group.word || group.exclude, 'gi');
    if (group.excludephrase || group.exclude) results.push(text.match(re) === null);
    if (group.phrase || group.word) results.push(text.match(re) !== null);
  }

  if (searchQuery) url.searchParams.set('search', searchQuery);
  else url.searchParams.delete('search');

  if (url.toString() != window.location.toString())
    window.history.replaceState(null, '', url.toString());

  return results.indexOf(false) === -1;
}

export function showTab(tabId) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.classList.remove('active'));

  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => button.classList.remove('active'));

  // Show the selected tab content
  const selectedTab = document.getElementById(tabId) || document.querySelector('.tab-content');
  selectedTab.classList.add('active');

  // Add active class to the selected tab button
  const selectedTabButton = Array.from(tabButtons).find(
    button => button.id === `btn${selectedTab.id}`
  );
  if (selectedTabButton) {
    selectedTabButton.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Save the active tab ID
  activeTabId = tabId;
}

function addOptionsFromData() {
  // Get the filter-source select element

  // Clear existing options (optional, if you want to remove the placeholder option)
  Constants.filterSource.innerHTML = '';

  // Add the default "All Sources" option
  let defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.text = 'All Sources';
  Constants.filterSource.add(defaultOption);

  // Iterate over the data and add options to the select element
  [...new Set(window.data.backupSources.map(source => source.name))]
    .sort()
    .map(name => {
      var obj = new Object();
      obj.name = name;
      obj.sourceId = window.data.backupSources
        .filter(source => source.name === name)
        .map(source => source.sourceId);
      return obj;
    })
    .forEach(function (source) {
      let newOption = document.createElement('option');
      newOption.value = source.sourceId;
      newOption.text = source.name;
      Constants.filterSource.add(newOption);
    });
}

function disableMissingStatusOptions() {
  // Get the filter-status select element
  let filterStatus = document.getElementById('filter-status');

  // Get the unique statuses from the data
  let validStatuses = new Set(window.data.backupManga.map(manga => manga.status));

  // Iterate over the options and disable those that are not in the validStatuses set
  for (let i = 0; i < filterStatus.options.length; i++) {
    let option = filterStatus.options[i];
    if (option.value != '-1' && !validStatuses.has(parseInt(option.value))) {
      option.disabled = true;
    } else {
      option.disabled = false;
    }
  }
}

function showMangaDetails(manga, categories, source) {
  Constants.modalTitle.forEach(element => (element.textContent = manga.customTitle || manga.title));
  Constants.modalSource.forEach(element => (element.textContent = source));
  Constants.modalThumb.forEach(
    element => (element.src = manga.customThumbnailUrl || manga.thumbnailUrl)
  );
  document.documentElement.style.setProperty(
    '--manga-header-bg',
    `url('${Constants.modalThumb[0].src}')`
  );

  const mangaStatusText = (() => {
    switch (manga.status) {
      case 1:
        addMaterialSymbol(Constants.modalStatus, 'schedule');
        return 'Ongoing';
      case 2:
        addMaterialSymbol(Constants.modalStatus, 'done_all');
        return 'Completed';
      case 3:
        addMaterialSymbol(Constants.modalStatus, 'attach_money');
        return 'Licensed';
      case 4:
        addMaterialSymbol(Constants.modalStatus, 'check');
        return 'Publishing Finished';
      case 5:
        addMaterialSymbol(Constants.modalStatus, 'close');
        return 'Cancelled';
      case 6:
        addMaterialSymbol(Constants.modalStatus, 'pause');
        return 'On Hiatus';
      default:
        addMaterialSymbol(Constants.modalStatus, 'block');
        return 'Unknown';
    }
  })();

  const genres = document.getElementById('manga-genres');
  genres.innerHTML = '';
  (manga.customGenre || manga.genre || ['None']).forEach(tag => {
    const li = document.createElement('li');
    li.innerText = tag;
    genres.appendChild(li);
  });
  Constants.modalAuthor.forEach(element => {
    element.innerHTML = '';
    addMaterialSymbol(element, 'person');
    element.innerHTML += manga.customAuthor || manga.author;
    element.hidden = !manga.customAuthor && !manga.author ? true : false;
  });

  Constants.modalArtist.forEach(element => {
    element.innerHTML = '';
    addMaterialSymbol(element, 'brush');
    element.innerHTML += manga.customArtist || manga.artist;
    element.hidden = !manga.customArtist && !manga.artist ? true : false;
  });

  Constants.modalDescription.innerText = manga.customDescription || manga.description;
  Constants.modalDescription.parentNode.classList.remove('expanded');
  Constants.modalDescription.parentNode.style.maxHeight = 'var(--manga-desc-collapsed-height)';
  document.getElementById('description-expand-icon').style.transform = 'none';
  Constants.modalStatus.forEach(element => {
    element.innerHTML = '';
    element.innerHTML += mangaStatusText;
  });

  // const mangaCategories = document.getElementById('manga-categories');
  Constants.modalCategories.forEach(mangaCategories => {
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
  });

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
          lastReadDate.textContent = parseDate(historyItem.lastRead);
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

export function parseDate(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString();
}

export function toggleExpandDescription() {
  if (document.querySelector('.fade-out').parentNode.classList.toggle('expanded')) {
    const maxDivSize =
      Constants.modalDescription.offsetHeight /
        parseInt(window.getComputedStyle(Constants.modalDescription).fontSize) +
      5;
    Constants.modalDescriptionDiv.style.maxHeight = `${maxDivSize}em`;
    document.getElementById('description-expand-icon').style.transform = 'scaleY(-1)';
  } else {
    document.getElementById('description-expand-icon').style.transform = 'none';
    Constants.modalDescriptionDiv.style.maxHeight = '3.6em';
  }
}

export function setActiveTabId(data) {
  activeTabId = data;
}
export function setFilterStatus(data) {
  filterStatus = data;
}
export function setFilterSource(data) {
  filterSource = data;
}
export function setFilterTracking(data) {
  filterTracking = data;
}
export function setSortOrder(data) {
  sortOrder = data;
  url.searchParams.set('sort-order', data);
  window.history.replaceState(data, '', url.toString());
}

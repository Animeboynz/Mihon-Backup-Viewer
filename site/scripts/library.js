import consts from './constants.js';
import { closeModal, showModal } from './modals.js';
import { addMaterialSymbol } from './materialSymbol.js';
import { deleteManga, toggleForkOnlyElements } from './editBackup.js';
import { loadSettings } from './settings.js';
import { setTitle } from '../script.js';

const url = new URL(window.location);
export var activeTabId = null;
const httpRegex = RegExp('^https?://');
var repoData = null;

// Function to Initialise the Tab Contents and Library from the JSON found in the data variable.
export function initializeLibrary() {
  if (!repoData) repoData = getRepoIndex();
  const categories = window.data.backupCategories || [];
  let mangaItems = window.data.backupManga;
  const editCategoryOptions = document.getElementById('edit-category-options');
  DEV: console.log('Loading Settings from initializeLibrary');
  const savedSettings = loadSettings();
  const filters = savedSettings['filters'];

  if (consts.fork.value !== 'mihon') {
    toggleForkOnlyElements();
  }

  mangaItems = mangaItems.filter(manga => {
    let matchesStatus =
      filters['status']?.includes('-1') || filters['status']?.includes(manga.status?.toString());
    let matchesSource =
      filters['source']?.includes('all') || filters['source']?.includes(manga.source);
    let matchesTracking =
      filters['tracker'] === 'all-entries' ||
      (filters['tracker'] === 'tracked' && manga.tracking) ||
      (filters['tracker'] === 'untracked' && !manga.tracking);
    let matchesSearch = search(consts.searchField.value, manga);
    return (
      matchesStatus &&
      matchesSource &&
      matchesTracking &&
      matchesSearch &&
      matchesChapters(manga, filters.unread) &&
      matchesChapters(manga, filters.bookmark)
    );
  });
  if (
    Object.keys(filters).every(
      // Need to stringify because Arrays don't match
      k => filters[k].toString() == consts.defaultSettings.filters[k].toString()
    )
  ) {
    consts.settingsIcon.classList.remove('filtered');
  } else {
    consts.settingsIcon.classList.add('filtered');
  }

  // Sets the order to 0 if a category has no order property
  if (categories[0] && !categories[0].hasOwnProperty('order')) categories[0].order = '0';

  // Clear existing content
  consts.tabsContainer.innerHTML = '';
  consts.tabContentsContainer.innerHTML = '';
  editCategoryOptions.innerHTML = '';

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

      //const editCategoryOptions = document.getElementById("edit-category-options");
      if (![-1, 65535].includes(category.order)) {
        const option = document.createElement('option');
        option.value = category.order;
        option.textContent = category.name;
        editCategoryOptions.appendChild(option);
      }

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
      consts.tabsContainer.appendChild(tabButton);

      // Create tab content container
      const tabContent = document.createElement('div');
      tabContent.className = 'tab-content';
      tabContent.id = category.name;
      consts.tabContentsContainer.appendChild(tabContent);
    });

  // Populate manga items into the correct tab content
  mangaItems
    .sort((a, b) => {
      const sortOrder = savedSettings['sort']['library'];
      const i1 = sortOrder < 64 ? b : a;
      const i2 = sortOrder < 64 ? a : b;
      switch (consts.sortFlags[sortOrder]) {
        default:
        case 'Alphabetical':
          return i1.title.localeCompare(i2.title);
        case 'LastRead':
          return (
            Math.max.apply(0, i1.history?.map(h => parseInt(h.lastRead || '0')) || [0]) -
            Math.max.apply(0, i2.history?.map(h => parseInt(h.lastRead || '0')) || [0])
          );
        case 'LastUpdated':
          return i1.lastModifiedAt - i2.lastModifiedAt;
        case 'UnreadCount':
          return (
            i1.chapters?.filter(c => !c.read).length - i2.chapters?.filter(c => !c.read).length
          );
        case 'TotalChapters':
          return (i1.chapters?.length || '0') - (i2.chapters?.length || '0');
        case 'LatestChapter':
          return (
            Math.max.apply(
              0,
              i1.chapters?.map(h => parseInt(h.dateUpload || '0'))
            ) ||
            [0] -
              Math.max.apply(
                0,
                i2.chapters?.map(h => parseInt(h.dateUpload || '0'))
              ) || [0]
          );
        case 'ChapterFetchDate':
          return (
            (Math.max.apply(
              0,
              i1.chapters?.map(h => parseInt(h.dateFetch || '0'))
            ) || [0]) -
            (Math.max.apply(
              0,
              i2.chapters?.map(h => parseInt(h.dateFetch || '0'))
            ) || [0])
          );
        case 'DateAdded':
          return parseInt(i1.dateAdded || '0') - parseInt(i2.dateAdded || '0');
      }
    })
    .forEach((manga, index) => {
      const itemCategories = manga.favorite === false ? [65535] : manga.categories || [-1];
      itemCategories.forEach(catOrder => {
        const category = categories.find(cat => cat.order === catOrder) || { name: 'Default' };
        const tabContent = document.getElementById(category.name);

        const titleFull = manga.customTitle || manga.title;
        const titleTrimmed = titleFull.length > 35 ? titleFull.substring(0, 35) + '…' : titleFull;
        const mangaItem = document.createElement('div');
        mangaItem.className = 'manga-item';

        var title = `${manga.title} Chapters: ${manga.chapters?.length}`;
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
        const unreadBadge = document.createElement('span');
        unreadBadge.classList.add('unread-badge');
        unreadBadge.innerText = manga.chapters?.filter(
          c => !c.read && !manga.excludedScanlators?.includes(c.scanlator)
        ).length;
        const cover = document.createElement('img');
        cover.loading = 'lazy';
        cover.src = mangaCover(manga);
        cover.alt = '';
        const entryTitle = document.createElement('p');
        entryTitle.innerText = titleTrimmed;
        entryTitle.classList.add('manga-item-title');

        const coverContainer = document.createElement('div');
        coverContainer.classList.add('manga-item-container');
        const kebabMenu = document.createElement('div');
        kebabMenu.classList.add('kebab-menu');

        // Capture original index before sorting
        const originalIndex = window.data.backupManga.indexOf(manga);

        kebabMenu.hidden = true;
        addMaterialSymbol(kebabMenu, 'more_vert');

        kebabMenu.addEventListener('click', event => {
          event.stopPropagation(); // Prevent triggering the manga item click
          //alert(`Title: ${title}\nOriginal Index: ${index}`);
          console.log(`Title: ${manga.title}\\nOriginal Index: ${index}`);
          showEditMenu(event, manga, originalIndex);
        });

        coverContainer.appendChild(cover);
        if (unreadBadge.innerText > 0) coverContainer.appendChild(unreadBadge);
        coverContainer.appendChild(kebabMenu);
        mangaItem.appendChild(coverContainer);
        mangaItem.appendChild(entryTitle);
        mangaItem.addEventListener('click', () => {
          showMangaDetails(
            manga,
            window.data.backupCategories,
            repoData?.find(entry => entry.id == manga.source)
              ? repoData?.find(entry => entry.id == manga.source)
              : window.data.backupSources.find(source => source.sourceId === manga.source)
          );
        });
        mangaItem.addEventListener('mouseenter', () => {
          entryTitle.innerText = titleFull;
          entryTitle.classList.add('full-title');
          kebabMenu.hidden = false;
        });
        mangaItem.addEventListener('mouseleave', () => {
          entryTitle.innerText = titleTrimmed;
          entryTitle.classList.remove('full-title');
          kebabMenu.hidden = true;
        });
        mangaItem.addEventListener('contextmenu', e => {
          e.preventDefault();
          showEditMenu(e, manga, originalIndex);
        });
        tabContent.appendChild(mangaItem);
      });
    });

  const tabToShow = document.getElementById(activeTabId)
    ? activeTabId
    : document.querySelector('.tab-content').id;
  showTab(tabToShow);
}

export function search(searchQuery = '', manga = { title: '' }) {
  let results = [];
  const searchTarget = [
    manga.title || '',
    manga.artist || '',
    manga.author || '',
    manga.description || '',
    manga.genre?.join('\n') || '',
  ].join('\n');
  const queryParams = searchQuery
    .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    .matchAll(
      /(?:(?<!\w)-"(?<excludephrase>.+?)"|"(?<phrase>.+?)"|(?<!\w)-(?<exclude>\w+)|(?<word>\S+))/gi
    );
  for (const match of queryParams) {
    const group = match.groups;
    const re =
      group.phrase || group.excludephrase
        ? new RegExp(`\\b${group.phrase || group.excludephrase}\\b`, 'gi')
        : new RegExp(group.word || group.exclude, 'gi');
    if (group.excludephrase || group.exclude) results.push(searchTarget.match(re) === null);
    if (group.phrase || group.word) results.push(searchTarget.match(re) !== null);
  }

  if (searchQuery) {
    url.searchParams.set('search', searchQuery);
    consts.searchButton.classList.add('filtered');
  } else {
    url.searchParams.delete('search');
    consts.searchButton.classList.remove('filtered');
  }

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

  setTitle(selectedTab.id);

  // Save the active tab ID
  activeTabId = tabId;
}

//Adds info to Manga Details Modal
function showMangaDetails(manga, categories, source) {
  const repoMatch = repoData?.find(entry => entry.id == manga.source);
  const newWindowIcon = addMaterialSymbol(null, 'open_in_new');
  newWindowIcon.classList.add('link-icon');
  consts.mangaModal.dataset.index = window.data.backupManga.indexOf(manga);
  consts.modalTitle.forEach(element => {
    element.textContent = manga.customTitle || manga.title;
    element.parentNode.removeAttribute('href');
    if (manga.url.match(httpRegex)) {
      element.parentNode.href = manga.url;
      element.appendChild(newWindowIcon.cloneNode(true));
    } else if (repoMatch) {
      element.parentNode.href =
        repoMatch.baseUrl + (manga.url[0] == '/' ? manga.url : `/${manga.url}`);
      element.appendChild(newWindowIcon.cloneNode(true));
    }
  });
  consts.modalSource.forEach(element => {
    element.innerHTML = '';
    if (source.baseUrl) {
      const favicon = document.createElement('img');
      favicon.src = `https://external-content.duckduckgo.com/ip3/${source.baseUrl.split('/')[2]}.ico`;
      favicon.height = 24;
      favicon.classList.add('material-symbols-outlined');
      element.append(favicon);
      const link = document.createElement('a');
      link.setAttribute('href', source.baseUrl);
      link.append(`${source.name} (${source.lang.toUpperCase()})`);
      link.appendChild(newWindowIcon.cloneNode(true));
      element.append(link);
    } else {
      addMaterialSymbol(element, 'language');
      element.append(source.name);
    }
  });
  consts.modalThumb.forEach(element => (element.src = mangaCover(manga)));
  document.documentElement.style.setProperty(
    '--manga-header-bg',
    `url('${consts.modalThumb[0].src}')`
  );

  const mangaStatusText = (() => {
    switch (manga.status) {
      case 1:
        return ['schedule', 'Ongoing'];
      case 2:
        return ['done_all', 'Completed'];
      case 3:
        return ['attach_money', 'Licensed'];
      case 4:
        return ['check', 'Publishing Finished'];
      case 5:
        return ['close', 'Cancelled'];
      case 6:
        return ['pause', 'On Hiatus'];
      default:
        return ['block', 'Unknown'];
    }
  })();
  /////////////////////////////////////

  consts.modalTracking.forEach(modal => {
    modal.innerHTML = '';
    manga.tracking?.forEach(item => {
      const li = document.createElement('li');
      li.style.backgroundImage = `url(${consts.trackingImages[item.syncId]})`;
      if (item.trackingUrl.match(httpRegex)) {
        const a = document.createElement('a');
        a.href = item.trackingUrl;
        a.target = '_blank'; // Open in a new tab
        a.appendChild(li);
        modal.appendChild(a);
      } else {
        modal.appendChild(li);
      }
    });
  });
  //////////////////////////////////

  const genres = document.getElementById('manga-genres');
  genres.innerHTML = '';
  (manga.customGenre || manga.genre || ['None']).forEach(tag => {
    const li = document.createElement('li');
    li.innerText = tag;
    li.addEventListener('click', () => {
      consts.searchField.value = `"${tag.replace(/^[\w\s]+: ?/i, '')}"`;
      closeModal('manga-modal');
      initializeLibrary();
    });
    genres.appendChild(li);
  });
  consts.modalAuthor.forEach(element => {
    element.innerHTML = '';
    addMaterialSymbol(element, 'person');
    element.innerHTML += manga.customAuthor || manga.author;
    element.hidden = !manga.customAuthor && !manga.author ? true : false;
  });

  consts.modalArtist.forEach(element => {
    element.innerHTML = '';
    addMaterialSymbol(element, 'brush');
    element.innerHTML += manga.customArtist || manga.artist;
    element.hidden = !manga.customArtist && !manga.artist ? true : false;
  });

  consts.modalDescription.innerText = manga.customDescription || manga.description;
  consts.modalDescriptionDiv.classList.remove('expanded');
  consts.modalDescriptionDiv.style.maxHeight = 'var(--manga-desc-collapsed-height)';
  document.getElementById('description-expand-icon').style.transform = 'none';
  consts.modalStatus.forEach(element => {
    element.innerHTML = '';
    addMaterialSymbol(element, mangaStatusText[0]);
    element.append(mangaStatusText[1]);
  });

  // const mangaCategories = document.getElementById('manga-categories');
  consts.modalCategories.forEach(mangaCategories => {
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

    // Populate Scanlators filter list
    const scanlators = [...new Set(manga.chapters.map(c => c.scanlator).filter(s => s))];
    if (scanlators.length) {
      consts.chapterFilterScanlator.parentNode.hidden = false;
      consts.chapterFilterScanlator.innerHTML = '';
      scanlators.forEach(group => {
        const option = document.createElement('option');
        option.innerText = group;
        option.selected = !manga.excludedScanlators?.includes(group);
        consts.chapterFilterScanlator.appendChild(option);
      });
    } else {
      consts.chapterFilterScanlator.innerHTML = '<option disabled="true">Any</option>';
      consts.chapterFilterScanlator.parentNode.hidden = true;
    }

    manga.chapters.forEach(chapter => {
      const chapterBox = document.createElement('div');
      chapterBox.className = 'chapter-box';

      const chapterName = document.createElement('div');
      if (chapter.url.match(httpRegex) || repoMatch) {
        const chapterLink = document.createElement('a');
        chapterLink.target = '_blank';
        if (repoMatch)
          chapterLink.href =
            repoMatch.baseUrl + (chapter.url[0] == '/' ? chapter.url : `/${chapter.url}`);
        else chapterLink.href = chapter.url;
        chapterLink.textContent = chapter.name;
        chapterLink.appendChild(newWindowIcon.cloneNode(true));
        chapterName.appendChild(chapterLink);
      } else chapterName.textContent = chapter.name;
      if (chapter.read) {
        chapterName.classList.add('read');
      }
      if (chapter.scanlator) {
        const chapterScanlator = document.createElement('div');
        chapterScanlator.classList.add('scanlator');
        chapterScanlator.textContent = chapter.scanlator;
        chapterName.appendChild(chapterScanlator);
      }
      chapterBox.appendChild(chapterName);

      if (Array.isArray(manga.history)) {
        const historyItem = manga.history.find(history => history.url === chapter.url);
        if (historyItem) {
          const lastReadDate = document.createElement('span');
          lastReadDate.className = 'chapter-date';
          lastReadDate.textContent = parseDate(historyItem.lastRead);
          chapterBox.appendChild(lastReadDate);
        }
      }

      chaptersContainer.appendChild(chapterBox);
    });
    consts.sortButton.hidden = false;
  } else consts.sortButton.hidden = true;

  toggleChapterFilter();

  showModal('manga-modal');
  consts.expandDescriptionArrow.hidden =
    consts.modalDescriptionDiv.offsetHeight <
    parseInt(getComputedStyle(consts.modalDescription).fontSize) *
      parseInt(getComputedStyle(document.body).getPropertyValue('--manga-desc-collapsed-height'));
  const mangaModalContent = document.querySelector('#manga-modal .modal-content');
  mangaModalContent.scrollTop = 0;
}

export function parseDate(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString();
}

export function toggleExpandDescription() {
  if (consts.expandDescriptionArrow.parentNode.classList.toggle('expanded')) {
    const maxDivSize =
      consts.modalDescription.offsetHeight /
        parseInt(window.getComputedStyle(consts.modalDescription).fontSize) +
      5;
    consts.modalDescriptionDiv.style.maxHeight = `${maxDivSize}em`;
    document.getElementById('description-expand-icon').style.transform = 'scaleY(-1)';
  } else {
    document.getElementById('description-expand-icon').style.transform = 'none';
    consts.modalDescriptionDiv.style.maxHeight = 'var(--manga-desc-collapsed-height)';
  }
}

function mangaCover(manga) {
  return (manga.customThumbnailUrl || manga.thumbnailUrl || '').replace(
    /(?:s.)?exhentai.org(?:\/t)?/,
    'ehgt.org'
  );
}
export function setActiveTabId(data) {
  activeTabId = data;
}

export function matchesChapters(manga = null, filter = 'all-entries') {
  // Filtering from initializeLibrary()
  const chapterCount = manga?.chapters?.filter(c =>
    filter.search('read') != -1
      ? !c.read && !manga?.excludedScanlators?.includes(c.scanlator)
      : c.bookmark
  )?.length;
  switch (filter) {
    case 'unread':
    case 'bookmarked':
      return Boolean(chapterCount);
    case 'read':
    case 'unbookmarked':
      return !Boolean(chapterCount);
    case 'all-entries':
    default:
      return true;
  }
}

const editMenu = document.getElementById('edit-menu');

function showEditMenu(event, manga, index) {
  event.stopPropagation(); // Prevent triggering other click events

  // Position the edit menu next to the kebab menu
  editMenu.style.top = `${event.pageY}px`;
  editMenu.style.left = `${event.pageX}px`;

  // Show the edit menu
  editMenu.classList.add('active');

  // Add event listeners to edit and delete options
  document.getElementById('delete').onclick = () => {
    hideEditMenu();
    console.log(`Delete clicked for manga: ${manga.title}`);
    if (confirm(`Do you really want to delete ${manga.title}`) == true) {
      deleteManga(index);
    } else {
      console.log('not-delete');
    }
  };

  document.getElementById('edit').onclick = () => {
    hideEditMenu(); //Hides the kebab menu after clicking the edit button
    showModal('edit-details-modal'); // Shows the edit details modal

    const manga = data.backupManga[index]; // Get the manga to edit

    const unixToDateTimeLocal = timestamp => {
      const date = new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds
      var isoDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
      return isoDateTime.slice(0, 16); // Format as YYYY-MM-DDTHH:mm
    };

    // Prefill modal fields
    document.getElementById('custom-title').value = manga.customTitle || manga.title;
    document.getElementById('custom-artist').value = manga.customArtist || manga.artist || '';
    document.getElementById('custom-author').value = manga.customAuthor || manga.author || '';
    document.getElementById('custom-thumbnail').value =
      manga.customThumbnailUrl || manga.thumbnailUrl;
    document.getElementById('custom-desc').value = manga.customDescription || manga.description;
    document.getElementById('custom-genre').value =
      manga.customGenre?.toString() || manga.genre?.toString();
    document.getElementById('date-added').value = unixToDateTimeLocal(manga.dateAdded.slice(0, 10));
    document.getElementById('last-modified').value = unixToDateTimeLocal(manga.lastModifiedAt);
    document.getElementById('favorite-modified').value = unixToDateTimeLocal(
      manga.favoriteModifiedAt
    );

    // Preselect the categories
    const categories = document.getElementById('edit-category-options');
    const mangaValues = manga.categories;
    for (let i = 0; i < categories.options.length; i++) {
      categories.options[i].selected = false;
    }

    for (let i = 0; i < categories.options.length; i++) {
      const option = categories.options[i];

      // Check if mangaValues is defined and not null
      if (mangaValues && mangaValues.includes(option.value)) {
        option.selected = true;
      }
    }
  };

  document.getElementById('apply-edits').onclick = () => {
    const dateTimeLocalToUnix = datetimeInput => {
      if (datetimeInput) {
        const date = new Date(datetimeInput);
        return Math.floor(date.getTime() / 1000).toString();
      }
      return null; // or handle the case where input is empty or invalid
    };

    // Get Values from the inputs
    const dateAdded = document.getElementById('date-added').value;
    const lastModifiedAt = document.getElementById('last-modified').value;
    const favoriteModifiedAt = document.getElementById('favorite-modified').value;
    // Get selected categories
    const categoriesSelect = document.getElementById('edit-category-options');
    const selectedCategories = Array.from(categoriesSelect.options)
      .filter(option => option.selected)
      .map(option => option.value);

    // Set the values from the inputs to the backup
    const manga = data.backupManga[index];
    manga.dateAdded = `${dateTimeLocalToUnix(dateAdded)}000`;
    manga.lastModifiedAt = dateTimeLocalToUnix(lastModifiedAt);
    manga.favoriteModifiedAt = dateTimeLocalToUnix(favoriteModifiedAt);
    manga.categories = selectedCategories;

    // Set custom values if they exist and only if fork != mihon
    if (consts.fork.value !== 'mihon') {
      const customTitle = document.getElementById('custom-title').value;
      const customArtist = document.getElementById('custom-artist').value;
      const customAuthor = document.getElementById('custom-author').value;
      const customThumbnail = document.getElementById('custom-thumbnail').value;
      const customDescription = document.getElementById('custom-desc').value;
      const customGenre = document
        .getElementById('custom-genre')
        .value.split(',')
        .map(g => g.trim());

      const updateField = (customField, originalField, fieldName) => {
        if (customField !== manga[fieldName] || manga[originalField]) {
          manga[fieldName] = customField;
          if (manga[fieldName] === manga[originalField]) {
            delete manga[fieldName];
          }
        }
      };

      updateField(customTitle, 'title', 'customTitle');
      updateField(customArtist, 'artist', 'customArtist');
      updateField(customAuthor, 'author', 'customAuthor');
      updateField(customThumbnail, 'thumbnailUrl', 'customThumbnailUrl');
      updateField(customDescription, 'description', 'customDescription');
      if (customGenre.toString() !== manga.customGenre?.toString() || manga.genre.toString()) {
        manga.customGenre = customGenre;
        if (manga.customGenre?.toString() === manga.genre.toString()) {
          delete manga.customGenre;
        }
      }
    }

    if (manga.categories === null || manga.categories.length === 0) {
      delete manga.categories;
    }
    [
      'customTitle',
      'customArtist',
      'customAuthor',
      'customThumbnailUrl',
      'customDescription',
    ].forEach(field => {
      if (manga[field]?.length === 0) {
        delete manga[field];
      }
    });
    if (manga.customGenre?.length === 1 && manga.customGenre[0] === '') {
      delete manga.customGenre;
    }

    closeModal('edit-details-modal');
    initializeLibrary();
  };
}

function hideEditMenu() {
  editMenu.classList.remove('active');
}

// Hide the edit menu when clicking outside
document.addEventListener('click', event => {
  if (!editMenu.contains(event.target)) {
    hideEditMenu();
  }
});

// Fetch repo from saved settings
function getRepoFromSettings() {
  const repoSetting = window.data.backupPreferences?.find(s => s.key == 'extension_repos');
  if (!repoSetting) return false;
  const newList = [];
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  try {
    const byteArray = encoder.encode(atob(repoSetting.value.truevalue));
    byteArray.forEach(byte => {
      if (byte == byteArray[0]) newList.push([]);
      else newList[newList.length - 1].push(byte);
    });
    newList.forEach((item, index) => {
      newList[index] = decoder.decode(new Uint8Array(item.slice(1)));
    });
  } catch {
    console.log('Malformed repo field');
    return false;
  }
  return newList;
}

function getRepoIndex() {
  const repoUrls = getRepoFromSettings();
  if (!repoUrls) return [];
  const usedSources = window.data.backupSources?.map(source => source.sourceId);
  const sources =
    consts.fork.value == 'sy'
      ? [
          { name: 'E-Hentai', lang: 'all', id: '6901', baseUrl: 'https://e-hentai.org' },
          { name: 'ExHentai', lang: 'all', id: '6902', baseUrl: 'https://exhentai.org' },
        ]
      : [];
  repoUrls.forEach(repoUrl => {
    // fetch(`../index.min.json`)
    fetch(`${repoUrl}/index.min.json`)
      .then(response => response.json())
      .then(response =>
        response.forEach(pkg => {
          pkg.sources.forEach(source => {
            if (usedSources && usedSources.length && !usedSources.includes(source.id)) return;
            sources.push(source);
          });
        })
      )
      .catch(e => alert(`Error fetching the repo list. ${e}`));
  });
  return sources;
}

export function toggleChapterFilter(reset = false) {
  const manga = window.data.backupManga[consts.mangaModal.dataset.index];
  if (reset) {
    consts.chapterFilterUnread.checked = true;
    consts.chapterFilterRead.checked = true;
    Array.from(consts.chapterFilterScanlator.options).forEach(
      option => (option.selected = !option.disabled)
    );
  }
  const scanlators = Array.from(consts.chapterFilterScanlator.selectedOptions).map(
    option => option.innerText
  );

  if (
    (!consts.chapterFilterScanlator.parentNode.hidden &&
      scanlators.length < consts.chapterFilterScanlator.options.length) ||
    !consts.chapterFilterUnread.checked ||
    !consts.chapterFilterRead.checked
  )
    consts.chapterFilterButton.classList.add('active');
  else consts.chapterFilterButton.classList.remove('active');

  // Ugly AF. Let the minimizer optimize it
  document.querySelectorAll('.chapter-box').forEach(element => {
    element.hidden = false;
    if (consts.chapterFilterButton.classList.contains('active')) {
      if (
        (scanlators.length == 0 ||
          scanlators.includes(element.querySelector('.scanlator')?.textContent)) &&
        ((!consts.chapterFilterUnread.checked &&
          consts.chapterFilterRead.checked &&
          element.firstChild.classList.contains('read')) ||
          (consts.chapterFilterUnread.checked &&
            !consts.chapterFilterRead.checked &&
            !element.firstChild.classList.contains('read')) ||
          consts.chapterFilterUnread.checked == consts.chapterFilterRead.checked)
      )
        return;
      element.hidden = true;
    }
  });
}

const re = RegExp('^https?://');
var sortOrder = localStorage.getItem('MBV_SortOrder') || 'title';
var filterStatus = -1;
var filterSource = 'all';
var filterTracking = 'all-entries';
var activeTabId = null;
var data;

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  const useDemoDataButton = document.getElementById('use-demo-data');

  fileInput.addEventListener('change', handleFileLoad);
  //Loads Demo Data from data.json when button pressed on Load Modal
  useDemoDataButton.addEventListener('click', () => {
    fetch('data.json')
      .then(response => response.json())
      .then(data => (window.data = data))
      .then(data => initializeLibrary())
      .catch(error => console.error('Error loading demo data:', error));
    closeModal('load-modal'); // Closes the Load Modal
  });

  // Closes the Manga Model is the X button is pressed
  document.getElementById('close-manga-modal').addEventListener('click', () => {
    closeModal('manga-modal');
  });

  document.querySelector('.fade-out').addEventListener('click', toggleExpand);

  document.addEventListener('mousedown', event => {
    const mangaModal = document.getElementById('manga-modal');
    if (event.target === mangaModal && mangaModal.classList.contains('active')) {
      closeModal('manga-modal');
    }
  });

  // Show the load modal by default
  showModal('load-modal');
});

function handleFileLoad(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = e => {
    const fileName = file.name; // Gets filename to check nested extensions e.g. proto.gz
    const extension = fileName.split('.').pop().toLowerCase(); // Used to check extensions (Future me replace with fileName.endsWith(''))

    try {
      if (extension === 'json') {
        window.data = JSON.parse(e.target.result);
        initializeLibrary(); // Initialises Library with loaded JSON
        closeModal('load-modal'); // Closes the Load Modal
      } else if (extension === 'tachibk' || fileName.endsWith('.proto.gz')) {
        // Load protobuf schema
        protobuf.load('schema.proto', (err, root) => {
          if (err) {
            alert('Error loading protobuf schema.');
            return;
          }

          const Backup = root.lookupType('Backup'); // Resolve Backup message type
          const reader = new FileReader();

          reader.onload = e => {
            try {
              const arrayBuffer = e.target.result;
              const inflated = pako.inflate(new Uint8Array(arrayBuffer)); // Decompress the gzip file
              const message = Backup.decode(inflated); // Decode the protobuf encoded binary data
              // Convert the decoded message to JSON format
              data = Backup.toObject(message, {
                longs: String,
                enums: String,
                bytes: String,
              });
              initializeLibrary(); // Initialises Library with the Converter protobuf
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
  document.getElementById('settings-icon').hidden = false;
}

// Function to show the modal with the passed ID
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('active');
  document.getElementById('settings-icon').hidden = true;
}

// Function to Initialise the Tab Contents and Library from the JSON data passed to it.
function initializeLibrary() {
  const tabsContainer = document.getElementById('tabs');
  const tabContentsContainer = document.getElementById('tab-contents');
  const categories = data.backupCategories;
  let mangaItems = data.backupManga;

  mangaItems = mangaItems.filter(manga => {
    let matchesStatus = filterStatus == -1 || manga.status == filterStatus;
    let matchesSource = filterSource == 'all' || manga.source == filterSource;
    let matchesTracking =
      filterTracking === 'all-entries' ||
      (filterTracking === 'tracked' && manga.tracking) ||
      (filterTracking === 'untracked' && !manga.tracking);
    return matchesStatus && matchesSource && matchesTracking;
  });

  // Sets the order to 0 if a category has no order property
  if (!categories[0].hasOwnProperty('order')) categories[0].order = '0';

  // Clear existing content
  tabsContainer.innerHTML = '';
  tabContentsContainer.innerHTML = '';

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
      tabButton.textContent = category.order === 65535 ? '⌛' : category.name;

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
      tabsContainer.appendChild(tabButton);

      // Create tab content container
      const tabContent = document.createElement('div');
      tabContent.className = 'tab-content';
      tabContent.id = category.name;
      tabContentsContainer.appendChild(tabContent);
    });

  // Populate manga items into the correct tab content
  mangaItems
    .sort((a, b) => {
      switch (sortOrder) {
        case 'recently-updated':
          return (
            (b.history?.lastread || b.lastModifiedAt) - (a.history?.lastread || a.lastModifiedAt)
          );
        case 'title':
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

        const mangaItem = document.createElement('div');
        mangaItem.className = 'manga-item';
        mangaItem.innerHTML = `
                <img src="${manga.customThumbnailUrl || manga.thumbnailUrl}" loading="lazy" title="${manga.customTitle || manga.title}" alt="">
                <p>${manga.customTitle || manga.title}</p>`;
        mangaItem.addEventListener('click', () => {
          showMangaDetails(
            manga,
            data.backupCategories,
            data.backupSources.find(source => source.sourceId === manga.source).name
          );
        });
        tabContent.appendChild(mangaItem);
      });
    });

  // Show the first tab on page load
  //showTab(document.querySelector(".tab-content").id);
  const tabToShow = activeTabId ? activeTabId : document.querySelector('.tab-content').id;
  showTab(tabToShow);
  addOptionsFromData();
  disableMissingStatusOptions();
}

function addOptionsFromData() {
  // Get the filter-source select element
  let filterSource = document.getElementById('filter-source');

  // Clear existing options (optional, if you want to remove the placeholder option)
  filterSource.innerHTML = '';

  // Add the default "All Sources" option
  let defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.text = 'All Sources';
  filterSource.add(defaultOption);

  // Iterate over the data and add options to the select element
  data.backupSources.forEach(function (source) {
    let newOption = document.createElement('option');
    newOption.value = source.sourceId;
    newOption.text = source.name;
    filterSource.add(newOption);
  });
}

function disableMissingStatusOptions() {
  // Get the filter-status select element
  let filterStatus = document.getElementById('filter-status');

  // Get the unique statuses from the data
  let validStatuses = new Set(data.backupManga.map(manga => manga.status));

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

function showTab(tabId) {
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

  // Save the active tab ID
  activeTabId = tabId;
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

  const categoriesText =
    manga.categories && manga.categories.length > 0
      ? `Categories: ${manga.categories
          .map(catOrder => {
            const category = categories.find(cat => cat.order === catOrder);
            return category ? category.name : 'Default';
          })
          .join(', ')}`
      : 'Categories: Default';
  document.getElementById('manga-categories').textContent = categoriesText;

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

function toggleExpand() {
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

///////////////////////////////

const settingsIcon = document.getElementById('settings-icon');
const closeSettingsModalBtn = document.getElementById('close-settings-modal');
const applySettingsBtn = document.getElementById('apply-settings');
const sortOrderSelect = document.getElementById('sort-order');
const filterStatusSelect = document.getElementById('filter-status');
const filterSourceSelect = document.getElementById('filter-source');
//const highlightTrackerCheckbox = document.getElementById('highlight-tracker');
const filterTrackedSelect = document.getElementById('filter-tracked');

//filterTrackedSelect.addEventListener('change', applySettings);
settingsIcon.addEventListener('click', openSettingsModal);
closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
applySettingsBtn.addEventListener('click', applySettings);

function openSettingsModal() {
  sortOrderSelect.value = sortOrder;
  filterStatusSelect.value = filterStatus;
  filterSourceSelect.value = filterSource;
  filterTrackedSelect.value = filterTracking;
  showModal('settings-modal');
}

function closeSettingsModal() {
  closeModal('settings-modal');
}

function applySettings() {
  // Store the current active tab ID before reinitializing
  activeTabId = document.querySelector('.tab-content.active').id;
  sortOrder = sortOrderSelect.value;
  filterStatus = filterStatusSelect.value;
  filterSource = filterSourceSelect.value;
  filterTracking = filterTrackedSelect.value;

  // Save sortOrder to local storage
  localStorage.setItem('MBV_SortOrder', sortOrder);

  //const highlightTracker = highlightTrackerCheckbox.checked;

  console.log('Settings applied:', { sortOrder, filterStatus, filterSource, filterTracking });

  closeSettingsModal();
  initializeLibrary();
}

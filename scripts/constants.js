export default {
  // ----- GLOBALS -----
  urlParams: new URLSearchParams(window.location.search),
  // File Load
  fileInput: document.querySelector('#file-input'),
  fork: document.querySelector('#fork-select').value,
  loadBackup: document.querySelector('#load-backup'),
  // Modals
  mangaModal: document.querySelector('#manga-modal'),
  settingsModal: document.querySelector('#settings-modal'),
  // Manga Details Modal
  modalTitle: document.querySelectorAll('#manga-title'),
  modalSource: document.querySelectorAll('#manga-source'),
  modalThumb: document.querySelectorAll('#manga-thumbnail'),
  modalAuthor: document.querySelectorAll('#manga-author'),
  modalArtist: document.querySelectorAll('#manga-artist'),
  modalStatus: document.querySelectorAll('#manga-status'),
  modalCategories: document.querySelectorAll('#manga-categories'),
  modalDescription: document.querySelector('#manga-description'),
  modalDescriptionDiv: document.querySelector('#manga-description-div'),
  sortButton: document.querySelector('#chapters-sort-button'),
  chapterList: document.querySelector('#manga-chapters'),
  // Main Screen
  tabsContainer: document.querySelector('#tabs'),
  tabContentsContainer: document.querySelector('#tab-contents'),
  // Settings
  settingsIcon: document.querySelector('#settings-icon'),
  closeSettingsModalBtn: document.querySelector('#close-settings-modal'),
  applySettingsBtn: document.querySelector('#apply-settings'),
  closeSettingsBtn: document.querySelector('#close-manga-modal'),
  filterSource: document.querySelector('#filter-source'),
  // Re-encode
  dlJSONBtn: document.querySelector('#download-json'),
  dlTachibkBtn: document.querySelector('#download-tachibk'),
  expandDescriptionArrow: document.querySelector('.fade-out'),
  // Search
  searchButton: document.querySelector('#search > .search-icon'),
  searchField: document.querySelector('#search > input'),
};

export default {
  // ----- GLOBALS -----
  urlParams: new URLSearchParams(window.location.search),
  sortFlags: {
    // Descending
    0: 'Alphabetical',
    4: 'LastRead',
    8: 'LastUpdate',
    12: 'UnreadCount',
    16: 'TotalChapters',
    20: 'LatestChapter',
    24: 'ChapterFetchDate',
    28: 'DateAdded',
    // 32: 'TrackerMean',
    // 36: 'TagList', // Descending // SY
    // Ascending
    64: 'Alphabetical',
    68: 'LastRead',
    72: 'LastUpdate',
    76: 'UnreadCount',
    80: 'TotalChapters',
    84: 'LatestChapter',
    88: 'ChapterFetchDate',
    92: 'DateAdded',
    // 96: 'TrackerMean',
    // 100: 'TagList', // Ascending // SY
  },
  // File Load
  fileInput: document.querySelector('#file-input'),
  fork: document.querySelector('#fork-select'),
  loadBackup: document.querySelector('#load-backup'),
  // Modals
  mangaModal: document.querySelector('#manga-modal'),
  settingsModal: document.querySelector('#settings-modal'),
  // Manga Details Modal
  trackingImages: [
    { src: 'img/trackers/ic_tracker_mal.webp', visible: false, syncId: 1 },
    { src: 'img/trackers/ic_tracker_anilist.webp', visible: false, syncId: 2 },
    { src: 'img/trackers/ic_tracker_kitsu.webp', visible: false, syncId: 3 },
    { src: 'img/trackers/ic_tracker_shikimori.webp', visible: false, syncId: 4 },
    { src: 'img/trackers/ic_tracker_bangumi.webp', visible: false, syncId: 5 },
    { src: 'img/trackers/ic_tracker_komga.webp', visible: false, syncId: 6 },
    { src: 'img/trackers/ic_tracker_manga_updates.webp', visible: false, syncId: 7 },
    { src: 'img/trackers/ic_tracker_kavita.webp', visible: false, syncId: 8 },
    { src: 'img/trackers/ic_tracker_suwayomi.webp', visible: false, syncId: 9 },
    { src: 'img/trackers/ic_tracker_mdlist.webp', visible: false, syncId: 60 }
  ],
  modalTitle: document.querySelectorAll('#manga-title'),
  modalSource: document.querySelectorAll('#manga-source'),
  modalThumb: document.querySelectorAll('#manga-thumbnail'),
  modalAuthor: document.querySelectorAll('#manga-author'),
  modalArtist: document.querySelectorAll('#manga-artist'),
  modalStatus: document.querySelectorAll('#manga-status'),
  modalCategories: document.querySelectorAll('#manga-categories'),
  //modalTracking: document.querySelectorAll('#manga-tracking'),
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
  filterUnread: document.querySelector('#filter-unread'),
  // Re-encode
  dlJSONBtn: document.querySelector('#download-json'),
  dlTachibkBtn: document.querySelector('#download-tachibk'),
  expandDescriptionArrow: document.querySelector('.fade-out'),
  // Search
  searchButton: document.querySelector('#search > .search-icon'),
  searchField: document.querySelector('#search > input'),
  // Edit Modal
  closeEditDetailsModalBtn: document.querySelector('#close-edit-details-modal'),
};

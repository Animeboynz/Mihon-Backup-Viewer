export default {
  // ----- GLOBALS -----
  sortFlags: {
    // Descending
    0: 'Alphabetical',
    4: 'LastRead',
    8: 'LastUpdate',
    12: 'UnreadCount',
    16: 'TotalChapters',
    18: 'FirstChapter', // BackupViewer
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
    82: 'FirstChapter', // BackupViewer
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
  trackingImages: {
    1: 'img/trackers/ic_tracker_mal.webp',
    2: 'img/trackers/ic_tracker_anilist.webp',
    3: 'img/trackers/ic_tracker_kitsu.webp',
    4: 'img/trackers/ic_tracker_shikimori.webp',
    5: 'img/trackers/ic_tracker_bangumi.webp',
    6: 'img/trackers/ic_tracker_komga.webp',
    7: 'img/trackers/ic_tracker_manga_updates.webp',
    8: 'img/trackers/ic_tracker_kavita.webp',
    9: 'img/trackers/ic_tracker_suwayomi.webp',
    60: 'img/trackers/ic_tracker_mdlist.webp',
  },
  modalTitle: document.querySelectorAll('#manga-title'),
  modalSource: document.querySelectorAll('#manga-source'),
  modalThumb: document.querySelectorAll('#manga-thumbnail'),
  modalAuthor: document.querySelectorAll('#manga-author'),
  modalArtist: document.querySelectorAll('#manga-artist'),
  modalStatus: document.querySelectorAll('#manga-status'),
  modalCategories: document.querySelectorAll('#manga-categories'),
  modalTracking: document.querySelectorAll('#manga-tracking'),
  modalDescription: document.querySelector('#manga-description'),
  modalDescriptionDiv: document.querySelector('#manga-description-div'),
  expandDescriptionArrow: document.querySelector('.fade-out'),
  sortButton: document.querySelector('#chapters-sort-button'),
  chapterFilterButton: document.querySelector('#chapters-filter-button'),
  chapterFilterModal: document.querySelector('#chapter-filters-modal'),
  chapterFilterUnread: document.querySelector('#unread-chapter-filter'),
  chapterFilterRead: document.querySelector('#read-chapter-filter'),
  chapterFilterScanlator: document.querySelector('#scanlator-filter'),
  chapterFilterOkButton: document.querySelector('#apply-chapter-filter'),
  chapterFilterResetButton: document.querySelector('#reset-chapter-filter'),
  chapterList: document.querySelector('#manga-chapters'),
  // Main Screen
  tabsContainer: document.querySelector('#tabs'),
  tabContentsContainer: document.querySelector('#tab-contents'),
  // Settings
  defaultSettings: {
    filters: {
      status: ['-1'],
      unread: 'all-entries',
      bookmark: 'all-entries',
      source: ['all'],
      tracker: 'all-entries',
    },
    sort: { chapters: 'asc', library: 64 },
    lastFork: 'mihon',
  },
  settingsIcon: document.querySelector('#settings-icon'),
  closeSettingsModalBtn: document.querySelector('#close-settings-modal'),
  applySettingsBtn: document.querySelector('#apply-settings'),
  closeSettingsBtn: document.querySelector('#close-manga-modal'),
  filterSource: document.querySelector('#filter-source'),
  filterUnread: document.querySelector('#filter-unread'),
  filterBookmark: document.querySelector('#filter-bookmark'),
  // Re-encode
  dlJSONBtn: document.querySelector('#download-json'),
  dlTachibkBtn: document.querySelector('#download-tachibk'),
  // Search
  searchButton: document.querySelector('#search > .search-icon'),
  searchField: document.querySelector('#search > input'),
  searchClear: document.querySelector('#clear-search'),
  // Edit Modal
  closeEditDetailsModalBtn: document.querySelector('#close-edit-details-modal'),
};

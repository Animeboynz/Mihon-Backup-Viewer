import consts from './scripts/constants.js';
import { dlJSON, encodeToProtobuf } from './scripts/export.js';
import { handleFileLoad, loadDemoData, loadStoredData } from './scripts/loadBackup.js';
import { closeModal, showModal } from './scripts/modals.js';
import {
  initializeLibrary,
  toggleChapterFilter,
  toggleExpandDescription,
} from './scripts/library.js';
import { applySettings, loadSettings, saveSetting } from './scripts/settings.js';

var searchCooldown;

export function setTitle(title = null) {
  document.title = title ? `${title} - Tachibk Viewer` : 'Tachibk Viewer';
}

document.addEventListener('DOMContentLoaded', () => {
  consts.fileInput.addEventListener('change', e => handleFileLoad(e, consts.fork.value)); //Handles File Loading
  consts.settingsIcon.addEventListener('click', showModal.bind(null, 'settings-modal')); // Opens settings modal on click
  consts.closeSettingsModalBtn.addEventListener('click', closeModal.bind(null, 'settings-modal')); //Closes settings modal on click
  consts.applySettingsBtn.addEventListener('click', applySettings); // Applies settings modal on click
  consts.dlJSONBtn.addEventListener('click', dlJSON); // Downloads backup as JSON on click
  consts.dlTachibkBtn.addEventListener('click', e => encodeToProtobuf(consts.fork.value)); // Downloads backup as Protobuf on click
  consts.closeSettingsBtn.addEventListener('click', closeModal.bind(null, 'manga-modal')); // Closes the Manga Model is the X button is pressed
  consts.expandDescriptionArrow.addEventListener('click', toggleExpandDescription); // Expands manga description on click
  consts.sortButton.addEventListener('click', () => {
    consts.chapterList.classList.toggle('desc');
    saveSetting({
      sort: { chapters: consts.chapterList.classList.contains('desc') ? 'desc' : 'asc' },
    });
  }); // Sort chapters
  consts.chapterFilterButton.addEventListener('click', () => showModal('chapter-filters-modal'));
  consts.chapterFilterOkButton.addEventListener('click', () => {
    toggleChapterFilter();
    closeModal('chapter-filters-modal');
  });
  consts.chapterFilterResetButton.addEventListener('click', () => {
    toggleChapterFilter(true);
    closeModal('chapter-filters-modal');
  });
  consts.loadBackup.addEventListener('click', e => {
    closeModal('settings-modal');
    window.data = null;
    localStorage.removeItem('data');
    consts.tabsContainer.innerHTML = '';
    consts.tabContentsContainer.innerHTML = '';
    showModal('load-modal');
  });
  consts.closeEditDetailsModalBtn.addEventListener(
    'click',
    closeModal.bind(null, 'edit-details-modal')
  );
  // Search Library
  consts.searchButton.addEventListener('click', () => {
    consts.searchField.toggleAttribute('disabled');
    if (!consts.searchField.disabled) consts.searchField.focus();
  });
  consts.searchField.addEventListener('blur', () => (consts.searchField.disabled = true));
  consts.searchField.addEventListener('input', () => {
    clearTimeout(searchCooldown);
    searchCooldown = setTimeout(initializeLibrary, 1300);
  });

  // Closes Modals when clicking outside
  document.addEventListener('mousedown', event => {
    if (
      [consts.mangaModal, consts.chapterFilterModal, consts.settingsModal].includes(event.target) &&
      event.target.classList.contains('active')
    ) {
      closeModal(event.target.id);
    }
  });

  // Auto-load demo data if `?demo=1` is passed
  // Show the load modal otherwise
  DEV: if (new URLSearchParams(window.location.search).get('demo') == '1') loadDemoData();
  if (!loadStoredData()) showModal('load-modal');
  consts.fork.value = loadSettings()['lastFork'];
});

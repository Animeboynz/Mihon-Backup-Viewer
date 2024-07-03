import Constants from './constants.js';
import { dlJSON, encodeToProtobuf } from './export.js';
import { handleFileLoad, loadDemoData } from './loadBackup.js';
import { closeModal, showModal } from './modals.js';
import { initializeLibrary, toggleExpandDescription } from './library.js';
import { openSettingsModal, closeSettingsModal, applySettings } from './settings.js';

var searchCooldown;

document.addEventListener('DOMContentLoaded', () => {
  Constants.fileInput.addEventListener('change', e => handleFileLoad(e, Constants.fork)); //Handles File Upload
  Constants.settingsIcon.addEventListener('click', openSettingsModal); // Opens settings modal on click
  Constants.closeSettingsModalBtn.addEventListener('click', closeSettingsModal); //Closes settings modal on click
  Constants.applySettingsBtn.addEventListener('click', applySettings); // Applies settings modal on click
  Constants.dlJSONBtn.addEventListener('click', dlJSON); // Downloads backup as JSON on click
  Constants.dlTachibkBtn.addEventListener('click', e => encodeToProtobuf(e, Constants.fork)); // Downloads backup as Protobuf on click
  Constants.closeSettingsBtn.addEventListener('click', closeModal.bind(null, 'manga-modal')); // Closes the Manga Model is the X button is pressed
  Constants.expandDescriptionArrow.addEventListener('click', toggleExpandDescription); // Expands manga description on click
  Constants.sortButton.addEventListener('click', () =>
    Constants.chapterList.classList.toggle('desc')
  ); // Sort chapters
  Constants.loadBackup.addEventListener('click', e => {
    closeModal('settings-modal');
    window.data = null;
    Constants.tabsContainer.innerHTML = '';
    Constants.tabContentsContainer.innerHTML = '';
    showModal('load-modal');
  });
  // Search Library
  Constants.searchButton.addEventListener('click', () => {
    Constants.searchField.toggleAttribute('disabled');
    if (!Constants.searchField.disabled) Constants.searchField.focus();
  });
  Constants.searchField.addEventListener('blur', () =>
    setTimeout(() => {
      Constants.searchField.disabled = true;
      if (Constants.searchField.value)
        Constants.searchButton.setAttribute('style', 'color: var(--color-filter-active);');
      else Constants.searchButton.removeAttribute('style');
    }, 200)
  );
  Constants.searchField.addEventListener('input', () => {
    clearTimeout(searchCooldown);
    searchCooldown = setTimeout(initializeLibrary, 1300);
  });

  // Closes Modal
  document.addEventListener('mousedown', event => {
    if (
      event.target === Constants.mangaModal &&
      Constants.mangaModal.classList.contains('active')
    ) {
      closeModal('manga-modal');
    } else if (
      event.target === Constants.settingsModal &&
      Constants.settingsModal.classList.contains('active')
    ) {
      closeSettingsModal();
    }
  });

  // Auto-load demo data if `?demo=1` is passed
  // Show the load modal otherwise
  if (Constants.urlParams.get('demo') == '1') {
    loadDemoData();
  } else {
    showModal('load-modal');
  }
});

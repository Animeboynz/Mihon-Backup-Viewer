import consts from './constants.js';
import { dlJSON, encodeToProtobuf } from './export.js';
import { handleFileLoad, loadDemoData } from './loadBackup.js';
import { closeModal, showModal } from './modals.js';
import { initializeLibrary, toggleExpandDescription } from './library.js';
import { openSettingsModal, closeSettingsModal, applySettings } from './settings.js';

var searchCooldown;

document.addEventListener('DOMContentLoaded', () => {
  consts.fileInput.addEventListener('change', e => handleFileLoad(e, consts.fork)); //Handles File Loading
  consts.settingsIcon.addEventListener('click', openSettingsModal); // Opens settings modal on click
  consts.closeSettingsModalBtn.addEventListener('click', closeSettingsModal); //Closes settings modal on click
  consts.applySettingsBtn.addEventListener('click', applySettings); // Applies settings modal on click
  consts.dlJSONBtn.addEventListener('click', dlJSON); // Downloads backup as JSON on click
  consts.dlTachibkBtn.addEventListener('click', e => encodeToProtobuf(e, consts.fork)); // Downloads backup as Protobuf on click
  consts.closeSettingsBtn.addEventListener('click', closeModal.bind(null, 'manga-modal')); // Closes the Manga Model is the X button is pressed
  consts.expandDescriptionArrow.addEventListener('click', toggleExpandDescription); // Expands manga description on click
  consts.sortButton.addEventListener('click', () => consts.chapterList.classList.toggle('desc')); // Sort chapters
  consts.loadBackup.addEventListener('click', e => {
    closeModal('settings-modal');
    window.data = null;
    consts.tabsContainer.innerHTML = '';
    consts.tabContentsContainer.innerHTML = '';
    showModal('load-modal');
  });
  // Search Library
  consts.searchButton.addEventListener('click', () => {
    consts.searchField.toggleAttribute('disabled');
    if (!consts.searchField.disabled) consts.searchField.focus();
  });
  consts.searchField.addEventListener('blur', () =>
    setTimeout(() => {
      consts.searchField.disabled = true;
      if (consts.searchField.value)
        consts.searchButton.setAttribute('style', 'color: var(--color-filter-active);');
      else consts.searchButton.removeAttribute('style');
    }, 200)
  );
  consts.searchField.addEventListener('input', () => {
    clearTimeout(searchCooldown);
    searchCooldown = setTimeout(initializeLibrary, 1300);
  });

  // Closes Modal
  document.addEventListener('mousedown', event => {
    if (event.target === consts.mangaModal && consts.mangaModal.classList.contains('active')) {
      closeModal('manga-modal');
    } else if (
      event.target === consts.settingsModal &&
      consts.settingsModal.classList.contains('active')
    ) {
      closeSettingsModal();
    }
  });

  // Auto-load demo data if `?demo=1` is passed
  // Show the load modal otherwise
  if (consts.urlParams.get('demo') == '1') {
    loadDemoData();
  } else {
    showModal('load-modal');
  }
});
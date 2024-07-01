import { dlJSON, encodeToProtobuf } from './export.js';
import { handleFileLoad, loadDemoData } from './loadBackup.js';
import { closeModal, showModal } from './modals.js';
import { initializeLibrary, toggleExpandDescription } from './library.js';
import { openSettingsModal, closeSettingsModal, applySettings } from './settings.js';

var searchCooldown;
const urlParams = new URLSearchParams(window.location.search);

document.addEventListener('DOMContentLoaded', () => {
  // File Load
  const fileInput = document.getElementById('file-input');
  const fork = document.getElementById('fork-select').value;
  const loadBackup = document.getElementById('load-backup');
  // Modals
  const mangaModal = document.getElementById('manga-modal');
  const settingsModal = document.getElementById('settings-modal');
  // Settings
  const settingsIcon = document.getElementById('settings-icon');
  const closeSettingsModalBtn = document.getElementById('close-settings-modal');
  const applySettingsBtn = document.getElementById('apply-settings');
  const closeSettingsBtn = document.getElementById('close-manga-modal');
  // Re-encode
  const dlJSONBtn = document.getElementById('download-json');
  const dlTachibkBtn = document.getElementById('download-tachibk');
  const expandDescriptionArrow = document.querySelector('.fade-out');
  // Search
  const searchButton = document.querySelector('#search > .search-icon');
  const searchField = document.querySelector('#search > input');

  fileInput.addEventListener('change', e => handleFileLoad(e, fork)); //Handles File Upload
  settingsIcon.addEventListener('click', openSettingsModal); // Opens settings modal on click
  closeSettingsModalBtn.addEventListener('click', closeSettingsModal); //Closes settings modal on click
  applySettingsBtn.addEventListener('click', applySettings); // Applies settings modal on click
  dlJSONBtn.addEventListener('click', dlJSON); // Downloads backup as JSON on click
  dlTachibkBtn.addEventListener('click', e => encodeToProtobuf(e, fork)); // Downloads backup as Protobuf on click
  closeSettingsBtn.addEventListener('click', closeModal.bind(null, 'manga-modal')); // Closes the Manga Model is the X button is pressed
  expandDescriptionArrow.addEventListener('click', toggleExpandDescription); // Expands manga description on click
  document
    .querySelector('#chapters-sort-button')
    .addEventListener('click', () =>
      document.querySelector('#manga-chapters').classList.toggle('desc')
    ); // Sort chapters
  loadBackup.addEventListener('click', e => {
    closeModal('settings-modal');
    data = null;
    document.getElementById('tabs').innerHTML = '';
    document.getElementById('tab-contents').innerHTML = '';
    showModal('load-modal');
  });
  // Search Library
  searchButton.addEventListener('click', () => {
    searchField.toggleAttribute('disabled');
    if (!searchField.disabled) searchField.focus();
  });
  searchField.addEventListener('blur', () =>
    setTimeout(() => {
      searchField.disabled = true;
      if (searchField.value)
        searchButton.setAttribute('style', 'color: var(--color-filter-active);');
      else searchButton.removeAttribute('style');
    }, 200)
  );
  searchField.addEventListener('input', () => {
    clearTimeout(searchCooldown);
    searchCooldown = setTimeout(initializeLibrary, 1300);
  });

  // Closes Modal
  document.addEventListener('mousedown', event => {
    if (event.target === mangaModal && mangaModal.classList.contains('active')) {
      closeModal('manga-modal');
    } else if (event.target === settingsModal && settingsModal.classList.contains('active')) {
      closeSettingsModal();
    }
  });

  // Auto-load demo data if `?demo=1` is passed
  // Show the load modal otherwise
  if (urlParams.get('demo') == '1') {
    loadDemoData();
  } else {
    showModal('load-modal');
  }
});

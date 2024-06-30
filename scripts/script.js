import { dlJSON, encodeToProtobuf } from './export.js';
import { handleFileLoad, loadDemoData } from './loadBackup.js';
import { closeModal, showModal } from './modals.js';
import { initializeLibrary, toggleExpandDescription } from './library.js';
import { openSettingsModal, closeSettingsModal, applySettings } from './settings.js';

var data;

document.addEventListener('DOMContentLoaded', () => {
  // File Load
  const fileInput = document.getElementById('file-input');
  const fork = document.getElementById('fork-select').value;
  const useDemoDataButton = document.getElementById('use-demo-data');
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
  const search = document.querySelector('.search > button');

  fileInput.addEventListener('change', e => handleFileLoad(e, fork)); //Handles File Upload
  //Loads Demo Data from data.json on trigger
  useDemoDataButton.addEventListener('click', loadDemoData);
  settingsIcon.addEventListener('click', openSettingsModal); // Opens settings modal on click
  closeSettingsModalBtn.addEventListener('click', closeSettingsModal); //Closes settings modal on click
  applySettingsBtn.addEventListener('click', applySettings); // Applies settings modal on click
  dlJSONBtn.addEventListener('click', dlJSON); // Downloads backup as JSON on click
  dlTachibkBtn.addEventListener('click', e => encodeToProtobuf(e, fork)); // Downloads backup as Protobuf on click
  closeSettingsBtn.addEventListener('click', closeModal.bind(null, 'manga-modal')); // Closes the Manga Model is the X button is pressed
  expandDescriptionArrow.addEventListener('click', toggleExpandDescription); // Expands manga description on click
  search.addEventListener('click', initializeLibrary); // Search Library
  // Closes Modal
  document.addEventListener('mousedown', event => {
    if (event.target === mangaModal && mangaModal.classList.contains('active')) {
      closeModal('manga-modal');
    } else if (event.target === settingsModal && settingsModal.classList.contains('active')) {
      closeSettingsModal();
    }
  });

  // Show the load modal by default
  showModal('load-modal');
});

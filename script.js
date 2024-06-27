import { dlJSON, encodeToProtobuf } from './export.js'
import { deleteManga, deleteCategory } from './editBackup.js'
import { handleFileLoad, loadDemoData } from './loadBackup.js'
import { closeModal, showModal } from './modals.js'

var data;

document.addEventListener('DOMContentLoaded', () => {
  // File Load
  const fileInput = document.getElementById('file-input');
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

  fileInput.addEventListener('change', handleFileLoad); //Handles File Upload
  //Loads Demo Data from data.json on trigger
  useDemoDataButton.addEventListener('click', loadDemoData);
  settingsIcon.addEventListener('click', openSettingsModal); // Opens settings modal on click
  closeSettingsModalBtn.addEventListener('click', closeSettingsModal); //Closes settings modal on click
  applySettingsBtn.addEventListener('click', applySettings); // Applies settings modal on click
  dlJSONBtn.addEventListener('click', dlJSON); // Downloads backup as JSON on click
  dlTachibkBtn.addEventListener('click', encodeToProtobuf); // Downloads backup as Protobuf on click
  closeSettingsBtn.addEventListener('click', closeModal.bind(null, 'manga-modal')); // Closes the Manga Model is the X button is pressed
  expandDescriptionArrow.addEventListener('click', toggleExpandDescription); // Expands manga description on click
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

function toggleExpandDescription() {
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

const sortOrderSelect = document.getElementById('sort-order');
const filterStatusSelect = document.getElementById('filter-status');
const filterSourceSelect = document.getElementById('filter-source');
//const highlightTrackerCheckbox = document.getElementById('highlight-tracker');
const filterTrackedSelect = document.getElementById('filter-tracked');

//filterTrackedSelect.addEventListener('change', applySettings);

function openSettingsModal() {
  this.firstChild.style.transform = 'rotate(90deg)';
  sortOrderSelect.value = sortOrder;
  for (const option of filterStatusSelect.options) {
    if (filterStatus.includes(option.value)) {
      option.selected = true;
    }
  }
  for (const option of filterSourceSelect.options) {
    if (option.value.split(',').every(uid => filterSource.includes(uid))) {
      option.selected = true;
    }
  }
  filterTrackedSelect.value = filterTracking;
  showModal('settings-modal');
}

function closeSettingsModal() {
  document.getElementById('settings-icon').firstChild.style.transform = 'rotate(0deg)';
  closeModal('settings-modal');
}

function applySettings() {
  // Store the current active tab ID before reinitializing
  activeTabId = document.querySelector('.tab-content.active').id;
  sortOrder = sortOrderSelect.value;
  filterStatus = [];
  for (const option of filterStatusSelect.options) {
    if (option.selected) {
      filterStatus.push(option.value);
    }
  }

  filterSource = [];
  for (const option of filterSourceSelect.options) {
    if (option.selected) {
      option.value.split(',').forEach(uid => filterSource.push(uid));
    }
  }

  filterTracking = filterTrackedSelect.value;

  // Save sortOrder to local storage
  localStorage.setItem('MBV_SortOrder', sortOrder);

  //const highlightTracker = highlightTrackerCheckbox.checked;

  console.log('Settings applied:', { sortOrder, filterStatus, filterSource, filterTracking });

  closeSettingsModal();
  initializeLibrary();
}

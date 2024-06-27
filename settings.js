import { closeModal, showModal } from './modals.js';
import {
  initializeLibrary,
  setSortOrder,
  setFilterTracking,
  setActiveTabId,
  setFilterStatus,
  setFilterSource,
  sortOrder,
  filterStatus,
  filterSource,
  filterTracking,
} from './library.js';

const sortOrderSelect = document.getElementById('sort-order');
const filterStatusSelect = document.getElementById('filter-status');
const filterSourceSelect = document.getElementById('filter-source');
//const highlightTrackerCheckbox = document.getElementById('highlight-tracker');
const filterTrackedSelect = document.getElementById('filter-tracked');

//filterTrackedSelect.addEventListener('change', applySettings);

export function openSettingsModal() {
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

export function closeSettingsModal() {
  document.getElementById('settings-icon').firstChild.style.transform = 'rotate(0deg)';
  closeModal('settings-modal');
}

export function applySettings() {
  // Store the current active tab ID before reinitializing
  //window.activeTabId = document.querySelector('.tab-content.active').id;
  setActiveTabId(document.querySelector('.tab-content.active').id);
  //window.sortOrder = sortOrderSelect.value;
  setSortOrder(sortOrderSelect.value);

  var tempFilterStatus = [];
  for (const option of filterStatusSelect.options) {
    if (option.selected) {
      tempFilterStatus.push(option.value);
    }
  }
  setFilterStatus(tempFilterStatus);

  var tempFilterSource = [];
  for (const option of filterSourceSelect.options) {
    if (option.selected) {
      option.value.split(',').forEach(uid => tempFilterSource.push(uid));
    }
  }
  setFilterSource(tempFilterSource);

  //window.filterTracking = filterTrackedSelect.value;
  setFilterTracking(filterTrackedSelect.value);

  // Save sortOrder to local storage
  localStorage.setItem('MBV_SortOrder', window.sortOrder);

  //const highlightTracker = highlightTrackerCheckbox.checked;

  console.log('Settings applied:', { sortOrder, filterStatus, filterSource, filterTracking });

  closeSettingsModal();
  initializeLibrary();
}

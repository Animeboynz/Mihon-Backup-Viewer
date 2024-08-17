import consts from './constants.js';
import { closeModal, showModal } from './modals.js';
import { initializeLibrary, setActiveTabId } from './library.js';

const sortOrderSelect = document.getElementById('sort-order');
const sortAscending = document.getElementById('sort-ascending');
const filterStatusSelect = document.getElementById('filter-status');
const filterSourceSelect = document.getElementById('filter-source');
//const highlightTrackerCheckbox = document.getElementById('highlight-tracker');
const filterTrackedSelect = document.getElementById('filter-tracked');

//filterTrackedSelect.addEventListener('change', applySettings);

export function openSettingsModal() {
  this.firstChild.style.transform = 'rotate(90deg)';

  DEV: console.log('Loading Settings from openSettingsModal');
  const savedSettings = loadSettings();
  DEV: console.log(savedSettings);
  for (const [filter, val] of Object.entries(savedSettings['filters'])) {
    switch (filter) {
      case 'status':
        for (const option of filterStatusSelect.options) {
          if (val.includes(option.value)) {
            option.selected = true;
          }
        }
        break;
      case 'unread':
        consts.filterUnread.value = val;
        break;
      case 'source':
        for (const option of filterSourceSelect.options) {
          if (option.value.split(',').every(uid => val.includes(uid))) {
            option.selected = true;
          }
        }
        break;
      case 'tracker':
        filterTrackedSelect.value = val;
        break;
      default:
        break;
    }
  }
  for (const [key, val] of Object.entries(savedSettings['sort'])) {
    switch (key) {
      case 'library':
        sortOrder = val;
        sortOrderSelect.value = sortOrder < 64 ? sortOrder : sortOrder - 64;
        sortAscending.checked = sortOrder >= 64;
        break;
      case 'chapters':
        if (val == 'asc') {
          consts.chapterList.classList.remove('desc');
        }
        if (val == 'desc') {
          if (!consts.chapterList.classList.contains('desc'))
            consts.chapterList.classList.add('desc');
        }
        break;
      default:
        break;
    }
  }

  showModal('settings-modal');
}

export function closeSettingsModal() {
  document.getElementById('settings-icon').firstChild.style.transform = 'rotate(0deg)';
  closeModal('settings-modal');
}

export function applySettings() {
  DEV: console.log('Loading Settings from applySettings');
  var settings = loadSettings();
  // Store the current active tab ID before reinitializing
  //window.activeTabId = document.querySelector('.tab-content.active').id;
  setActiveTabId(document.querySelector('.tab-content.active').id);
  settings['sort']['library'] = parseInt(sortOrderSelect.value) + (sortAscending.checked ? 64 : 0);

  var tempFilterStatus = [];
  for (const option of filterStatusSelect.options) {
    if (option.selected) {
      tempFilterStatus.push(option.value);
    }
  }
  settings['filters']['status'] = tempFilterStatus;
  // Save Unread filter
  settings['filters']['unread'] = consts.filterUnread.value;

  var tempFilterSource = [];
  for (const option of filterSourceSelect.options) {
    if (option.selected) {
      option.value.split(',').forEach(uid => tempFilterSource.push(uid));
    }
  }
  settings['filters']['source'] = tempFilterSource;

  settings['filters']['tracker'] = filterTrackedSelect.value;

  console.log('Settings applied:', settings);

  saveSetting(settings);
  closeSettingsModal();
  initializeLibrary();
}

export function loadSettings() {
  var settings = JSON.parse(
    localStorage.getItem('settings') ||
      `{
        "filters": {
          "status": ["-1"],
          "unread": "all-entries",
          "source": ["all"],
          "tracker": "all-entries"
        },
        "sort": {
          "chapters": "asc",
          "library": 4
        }
      }`
  );
  // const url = new URL(window.location);
  // url.searchParams.forEach((value, key) => (settings[key] = JSON.parse(value)));
  DEV: console.log('Loaded settings:', settings);
  return settings;
}

export function saveSetting(settingObj = {}) {
  DEV: console.log('Loading Settings from saveSettings');
  var settings = loadSettings();
  // const url = new URL(window.location);
  for (const [key, value] of Object.entries(settingObj)) {
    settings[key] = value;
    // url.searchParams.set(key, JSON.stringify(value));
  }
  localStorage.setItem('settings', JSON.stringify(settings));
  // if (url.toString() != window.location.toString())
  //   window.history.replaceState(null, '', url.toString());
  return settings;
}

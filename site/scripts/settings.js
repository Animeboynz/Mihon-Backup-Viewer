import consts from './constants.js';
import { closeModal, showModal } from './modals.js';
import { initializeLibrary, setActiveTabId } from './library.js';

const sortOrderSelect = document.getElementById('sort-order');
const sortAscending = document.getElementById('sort-ascending');
//const highlightTrackerCheckbox = document.getElementById('highlight-tracker');
const filterTrackedSelect = document.getElementById('filter-tracked');

//filterTrackedSelect.addEventListener('change', applySettings);

export function applySettings() {
  DEV: console.log('Loading Settings from applySettings');
  var settings = loadSettings();
  // Store the current active tab ID before reinitializing
  //window.activeTabId = document.querySelector('.tab-content.active').id;
  setActiveTabId(document.querySelector('.tab-content.active').id);
  settings['sort']['library'] = parseInt(sortOrderSelect.value) + (sortAscending.checked ? 64 : 0);

  settings['filters']['status'] = consts.filterStatus.selectedValues;
  // Save Unread filter
  settings['filters']['unread'] = consts.filterUnread.value;
  settings['filters']['bookmark'] = consts.filterBookmark.value;

  settings['filters']['source'] = consts.filterSource.selectedValues.flatMap(s => s.split(','));

  settings['filters']['tracker'] = filterTrackedSelect.value;

  console.log('Settings applied:', settings);

  saveSetting(settings);
  closeModal('settings-modal');
  initializeLibrary();
}

export function loadSettings(updateModal = false) {
  var settings = JSON.parse(localStorage.getItem('settings')) || consts.defaultSettings;
  // const url = new URL(window.location);
  // url.searchParams.forEach((value, key) => (settings[key] = JSON.parse(value)));
  DEV: console.log('Loaded settings:', settings);
  if (!updateModal) return settings;

  console.log('Updating modal settings');
  addOptionsFromData();
  // disableMissingStatusOptions();
  for (const [filter, val] of Object.entries(settings['filters'])) {
    switch (filter) {
      case 'status':
        consts.filterStatus.data.forEach(option => (option.selected = val.includes(option.value)));
        consts.filterStatus.data = consts.filterStatus.data; // Seems redundant, but triggers the getter
        break;
      case 'unread':
        consts.filterUnread.value = val;
        break;
      case 'bookmark':
        consts.filterBookmark.value = val;
        break;
      case 'source':
        consts.filterSource.data.forEach(
          option => (option.selected = option.value.split(',').some(uid => val.includes(uid)))
        );
        consts.filterSource.data = consts.filterSource.data; // Seems redundant, but triggers the getter
        break;
      case 'tracker':
        filterTrackedSelect.value = val;
        break;
      default:
        break;
    }
  }
  for (const [key, val] of Object.entries(settings['sort'])) {
    switch (key) {
      case 'library':
        sortOrderSelect.value = val < 64 ? val : val - 64;
        sortAscending.checked = val >= 64;
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
  return settings;
}

export function saveSetting(settingObj = {}, updateModal = false) {
  DEV: console.log('Loading Settings from saveSettings');
  var settings = loadSettings(updateModal);
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

//Add Options to Settings modal
function addOptionsFromData() {
  // Iterate over the data and add options to the select element
  consts.filterSource.data = [...new Set(window.data.backupSources.map(source => source.name))]
    .sort()
    .map(name => {
      return {
        disabled: false,
        html: null,
        selected: false,
        text: name,
        value: window.data.backupSources
          .filter(source => source.name === name)
          .map(source => source.sourceId)
          .join(),
      };
    });
  // consts.filterSource = new MultiSelect('#filter-source', consts.filterSource.options);
}

//Disable Missing Status Options for the Settings modal
function disableMissingStatusOptions() {
  // Get the unique statuses from the data
  let validStatuses = new Set(window.data.backupManga.map(manga => manga.status));

  // Iterate over the options and disable those that are not in the validStatuses set
  for (let i = 0; i < consts.filterStatus.data.length; i++) {
    let option = consts.filterStatus.data[i];
    if (option.value != '-1' && !validStatuses.has(parseInt(option.value))) {
      option.disabled = true;
    } else {
      option.disabled = false;
    }
  }
}

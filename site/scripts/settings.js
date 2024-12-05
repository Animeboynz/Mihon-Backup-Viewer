import consts from './constants.js';
import { closeModal, showModal } from './modals.js';
import { initializeLibrary, setActiveTabId } from './library.js';

const sortOrderSelect = document.getElementById('sort-order');
const sortAscending = document.getElementById('sort-ascending');
const filterStatusSelect = document.getElementById('filter-status');
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

  var tempFilterStatus = [];
  for (const option of filterStatusSelect.options) {
    if (option.selected) {
      tempFilterStatus.push(option.value);
    }
  }
  settings['filters']['status'] = tempFilterStatus;
  // Save Unread filter
  settings['filters']['unread'] = consts.filterUnread.value;
  settings['filters']['bookmark'] = consts.filterBookmark.value;

  var tempFilterSource = [];
  for (const option of consts.filterSource.options) {
    if (option.selected) {
      option.value.split(',').forEach(uid => tempFilterSource.push(uid));
    }
  }
  settings['filters']['source'] = tempFilterSource;

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
  disableMissingStatusOptions();
  for (const [filter, val] of Object.entries(settings['filters'])) {
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
      case 'bookmark':
        consts.filterBookmark.value = val;
        break;
      case 'source':
        for (const option of consts.filterSource.options) {
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
  // Get the filter-source select element

  // Clear existing options (optional, if you want to remove the placeholder option)
  consts.filterSource.innerHTML = '';

  // Add the default "All Sources" option
  let defaultOption = document.createElement('option');
  defaultOption.value = 'all';
  defaultOption.text = 'All Sources';
  consts.filterSource.add(defaultOption);

  // Iterate over the data and add options to the select element
  [...new Set(window.data.backupSources.map(source => source.name))]
    .sort()
    .map(name => {
      var obj = new Object();
      obj.name = name;
      obj.sourceId = window.data.backupSources
        .filter(source => source.name === name)
        .map(source => source.sourceId);
      return obj;
    })
    .forEach(function (source) {
      let newOption = document.createElement('option');
      newOption.value = source.sourceId;
      newOption.text = source.name;
      consts.filterSource.add(newOption);
    });
}

//Disable Missing Status Options for the Settings modal
function disableMissingStatusOptions() {
  // Get the filter-status select element
  let filterStatus = document.getElementById('filter-status');

  // Get the unique statuses from the data
  let validStatuses = new Set(window.data.backupManga.map(manga => manga.status));

  // Iterate over the options and disable those that are not in the validStatuses set
  for (let i = 0; i < filterStatus.options.length; i++) {
    let option = filterStatus.options[i];
    if (option.value != '-1' && !validStatuses.has(parseInt(option.value))) {
      option.disabled = true;
    } else {
      option.disabled = false;
    }
  }
}

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
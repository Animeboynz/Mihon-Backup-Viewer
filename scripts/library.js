// Function to Initialise the Tab Contents and Library from the JSON found in the data variable.
function initializeLibrary() {
    const tabsContainer = document.getElementById('tabs');
    const tabContentsContainer = document.getElementById('tab-contents');
    const categories = data.backupCategories || [];
    let mangaItems = data.backupManga;

    mangaItems = mangaItems.filter(manga => {
        let matchesStatus =
            filterStatus.includes('-1') || filterStatus.includes(manga.status?.toString());
        let matchesSource = filterSource.includes('all') || filterSource.includes(manga.source);
        let matchesTracking =
            filterTracking === 'all-entries' ||
            (filterTracking === 'tracked' && manga.tracking) ||
            (filterTracking === 'untracked' && !manga.tracking);
        return matchesStatus && matchesSource && matchesTracking;
    });

    // Sets the order to 0 if a category has no order property
    if (categories[0] && !categories[0].hasOwnProperty('order')) categories[0].order = '0';

    // Clear existing content
    tabsContainer.innerHTML = '';
    tabContentsContainer.innerHTML = '';

    // Add 'History' tab if it doesn't exist
    if (!categories.some(category => category.name === 'History')) {
        categories.push({ name: 'History', order: 65535 }); // Sets history tab's order as last
    }

    // Ensure 'Default' tab is always first, but add only if it doesn't exist
    if (!categories.some(category => category.name === 'Default')) {
        categories.unshift({ name: 'Default', order: -1 });
    }

    // Create tabs and tab contents
    categories
        .sort((a, b) => a.order - b.order)
        .forEach((category, index) => {
            // Create tab button
            const tabButton = document.createElement('button');
            tabButton.className = 'tab-button';
            tabButton.id = `btn${category.name}`;
            tabButton.textContent = category.order === 65535 ? '⌛' : category.name;

            const badge = document.createElement('span');
            badge.className = 'badge';
            switch (category.order) {
                default:
                    badge.textContent = mangaItems.filter(
                        manga => manga.favorite !== false && manga.categories?.indexOf(category.order) >= 0
                    ).length;
                    break;
                case -1:
                    badge.textContent = mangaItems.filter(
                        manga => manga.favorite !== false && !manga.categories
                    ).length;
                    break;
                case 65535:
                    badge.textContent = mangaItems.filter(manga => manga.favorite === false).length;
                    break;
            }

            tabButton.onclick = () => showTab(category.name);
            tabButton.appendChild(badge);
            if (badge.textContent === '0' && [-1, 65535].includes(category.order)) return; // Don't create empty meta-categories
            tabsContainer.appendChild(tabButton);

            // Create tab content container
            const tabContent = document.createElement('div');
            tabContent.className = 'tab-content';
            tabContent.id = category.name;
            tabContentsContainer.appendChild(tabContent);
        });

    // Populate manga items into the correct tab content
    mangaItems
        .sort((a, b) => {
            switch (sortOrder) {
                case 'recently-updated':
                    return (
                        (b.history?.lastread || b.lastModifiedAt) - (a.history?.lastread || a.lastModifiedAt)
                    );
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                default:
                    // Default to recently-updated if sortOrder is not recognized
                    return (
                        (b.history?.lastread || b.lastModifiedAt) - (a.history?.lastread || a.lastModifiedAt)
                    );
            }
        })
        .forEach(manga => {
            const itemCategories = manga.favorite === false ? [65535] : manga.categories || [-1]; // -1 = Default | 65535 = History
            itemCategories.forEach(catOrder => {
                const category = categories.find(cat => cat.order === catOrder) || { name: 'Default' };
                const tabContent = document.getElementById(category.name);

                const mangaItem = document.createElement('div');
                mangaItem.className = 'manga-item';
                mangaItem.innerHTML = `
                <img src="${
                    manga.customThumbnailUrl || manga.thumbnailUrl
                }" loading="lazy" title="${manga.customTitle || manga.title}" alt="">
                <p>${manga.customTitle || manga.title}</p>`;
                mangaItem.addEventListener('click', () => {
                    showMangaDetails(
                        manga,
                        data.backupCategories,
                        data.backupSources.find(source => source.sourceId === manga.source).name
                    );
                });
                tabContent.appendChild(mangaItem);
            });
        });

    const tabToShow = activeTabId ? activeTabId : document.querySelector('.tab-content').id;
    showTab(tabToShow);
    addOptionsFromData();
    disableMissingStatusOptions();
}

function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show the selected tab content
    const selectedTab = document.getElementById(tabId) || document.querySelector('.tab-content');
    selectedTab.classList.add('active');

    // Add active class to the selected tab button
    const selectedTabButton = Array.from(tabButtons).find(
        button => button.id === `btn${selectedTab.id}`
    );
    if (selectedTabButton) {
        selectedTabButton.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Save the active tab ID
    activeTabId = tabId;
}

function addOptionsFromData() {
    // Get the filter-source select element
    let filterSource = document.getElementById('filter-source');

    // Clear existing options (optional, if you want to remove the placeholder option)
    filterSource.innerHTML = '';

    // Add the default "All Sources" option
    let defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.text = 'All Sources';
    filterSource.add(defaultOption);

    // Iterate over the data and add options to the select element
    [...new Set(data.backupSources.map(source => source.name))]
        .sort()
        .map(name => {
            obj = new Object();
            obj.name = name;
            obj.sourceId = data.backupSources
                .filter(source => source.name === name)
                .map(source => source.sourceId);
            return obj;
        })
        .forEach(function (source) {
            let newOption = document.createElement('option');
            newOption.value = source.sourceId;
            newOption.text = source.name;
            filterSource.add(newOption);
        });
}

function disableMissingStatusOptions() {
    // Get the filter-status select element
    let filterStatus = document.getElementById('filter-status');

    // Get the unique statuses from the data
    let validStatuses = new Set(data.backupManga.map(manga => manga.status));

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
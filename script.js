document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => initializeLibrary(data))
        .catch(error => console.error('Error loading JSON data:', error));
});

function initializeLibrary(data) {
    const tabsContainer = document.getElementById('tabs');
    const tabContentsContainer = document.getElementById('tab-contents');
    const categories = data.backupCategories.map(category => {
        // Assume order 0 if the order field is missing
        if (category.order === undefined) {
            category.order = "0";
        }
        return category;
    });
    const mangaItems = data.backupManga;

    // Ensure 'Default' tab is always first
    categories.unshift({ name: 'Default', order: -1 });

    // Create tabs and tab contents
    categories.sort((a, b) => a.order - b.order).forEach(category => {
        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = category.name;
        tabButton.onclick = () => showTab(category.name);
        tabsContainer.appendChild(tabButton);

        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = category.name;
        tabContentsContainer.appendChild(tabContent);
    });

    // Populate manga items into the correct tab content
    mangaItems.forEach(item => {
        const itemCategories = item.categories || [-1]; // -1 represents Default
        itemCategories.forEach(catOrder => {
            const category = categories.find(cat => cat.order === catOrder) || { name: 'Default' };
            const tabContent = document.getElementById(category.name);

            const mangaItem = document.createElement('div');
            mangaItem.className = 'manga-item';
            mangaItem.innerHTML = `
                <img src="${item.thumbnailUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='nocover.jpg';">
                <p>${item.title}</p>`;
            tabContent.appendChild(mangaItem);
        });
    });

    // Show the Default tab on page load
    showTab('Default');
}

function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Show the selected tab content
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add('active');
}

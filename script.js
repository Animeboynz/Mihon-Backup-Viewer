document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const useDemoDataButton = document.getElementById('use-demo-data');

    fileInput.addEventListener('change', handleFileUpload);
    useDemoDataButton.addEventListener('click', () => {
        fetch('data.json')
            .then(response => response.json())
            .then(data => initializeLibrary(data))
            .catch(error => console.error('Error loading demo data:', error));
        closeModal();
    });
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            initializeLibrary(data);
            closeModal();
        } catch (error) {
            alert('Invalid JSON file. Please upload a valid JSON.');
        }
    };

    if (file) {
        reader.readAsText(file);
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

function initializeLibrary(data) {
    const tabsContainer = document.getElementById('tabs');
    const tabContentsContainer = document.getElementById('tab-contents');
    const categories = data.backupCategories;
    const mangaItems = data.backupManga;

    // Clear existing content
    tabsContainer.innerHTML = '';
    tabContentsContainer.innerHTML = '';

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

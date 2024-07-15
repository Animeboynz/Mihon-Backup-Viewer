import { initializeLibrary } from './library.js';

export function deleteManga(index) {
  if (index >= 0 && index < window.data.backupManga.length) {
    window.data.backupManga.splice(index, 1);
    initializeLibrary(); // Re-initialize the library to reflect changes
    console.log(`Manga at index ${index} deleted successfully.`);
  } else {
    console.error('Invalid index. Cannot delete manga.');
  }
}

export function deleteCategory(index) {
  if (index >= 0 && index < window.data.backupCategories.length) {
    // Get the order value of the category to be deleted
    const categoryOrderToDelete = window.data.backupCategories[index].order;

    // Delete the category
    window.data.backupCategories.splice(index, 1);

    // Iterate over all manga items to update their categories
    window.data.backupManga.forEach(manga => {
      if (manga.categories) {
        // Remove the categoryOrderToDelete from the manga's categories
        manga.categories = manga.categories.filter(order => order !== categoryOrderToDelete);

        // If the categories array becomes empty, delete it
        if (manga.categories.length === 0) {
          delete manga.categories;
        }
      }
    });

    // Re-initialize the library to reflect changes
    initializeLibrary();
    console.log(`Category at index ${index} deleted successfully.`);
  } else {
    console.error('Invalid index. Cannot delete Category.');
  }
}

export function toggleSyOnlyElements() {
  const syOnlyElements = document.querySelectorAll('.sy-only');
  syOnlyElements.forEach(element => {
    element.style.display = 'block';
  });
}

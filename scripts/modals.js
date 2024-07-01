// Function to close the modal with the passed ID
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal?.classList.remove('active');
}

// Function to show the modal with the passed ID
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal?.classList.add('active');
}

// TODO: Make it a single function with a secondary parameter for show/close/toggle

// Function to close the modal with the passed ID
export function closeModal(modalId) {
  const modal = modalId instanceof NodeList ? modalId : document.querySelectorAll(`#${modalId}`);
  modal?.forEach(element => element.classList.remove('active'));
}

// Function to show the modal with the passed ID
export function showModal(modalId) {
  const modal = modalId instanceof NodeList ? modalId : document.querySelectorAll(`#${modalId}`);
  modal?.forEach(element => element.classList.add('active'));
}

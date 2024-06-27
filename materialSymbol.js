export function addMaterialSymbol(element, symbol) {
  const symbolSpan = document.createElement('span');
  symbolSpan.className = 'material-symbols-outlined';
  symbolSpan.textContent = symbol;
  element.appendChild(symbolSpan);
}

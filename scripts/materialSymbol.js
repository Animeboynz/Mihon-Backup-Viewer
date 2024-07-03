export function addMaterialSymbol(element, symbol) {
  const symbolSpan = document.createElement('span');
  symbolSpan.className = 'material-symbols-outlined';
  symbolSpan.textContent = symbol;
  if (element instanceof NodeList) element.forEach(e => e.appendChild(symbolSpan.cloneNode(true)));
  else element.appendChild(symbolSpan);
}

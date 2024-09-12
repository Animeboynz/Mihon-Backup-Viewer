export function addMaterialSymbol(element, symbol) {
  const symbolSpan = document.createElement('span');
  symbolSpan.classList.add('material-symbols-outlined');
  symbolSpan.textContent = symbol;
  if (element instanceof NodeList) element.forEach(e => e.appendChild(symbolSpan.cloneNode(true)));
  else if (element) element.appendChild(symbolSpan.cloneNode(true));
  return symbolSpan;
}

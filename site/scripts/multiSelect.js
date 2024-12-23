/*
 * Created by David Adams
 * https://codeshack.io/multi-select-dropdown-html-javascript/
 *
 * Released under the MIT license
 */
export class MultiSelect {
  constructor(element, options = {}) {
    let defaults = {
      placeholder: 'Select item(s)',
      max: null,
      search: true,
      selectAll: true,
      listAll: true,
      closeListOnItemSelect: false,
      name: '',
      width: '',
      height: '',
      dropdownWidth: '',
      dropdownHeight: '',
      data: [],
      onChange: function () {},
      onSelect: function () {},
      onUnselect: function () {},
    };
    this.options = Object.assign(defaults, options);
    this.selectElement = typeof element === 'string' ? document.querySelector(element) : element;
    for (const prop in this.selectElement.dataset) {
      if (this.options[prop] !== undefined) {
        this.options[prop] = this.selectElement.dataset[prop];
      }
    }
    this.name = this.selectElement.getAttribute('name')
      ? this.selectElement.getAttribute('name')
      : 'multi-select-' + Math.floor(Math.random() * 1000000);
    if (!this.options.data.length) {
      let options = this.selectElement.querySelectorAll('option');
      for (let i = 0; i < options.length; i++) {
        this.options.data.push({
          value: options[i].value,
          text: options[i].innerHTML,
          selected: options[i].selected,
          disabled: options[i].disabled,
          html: options[i].getAttribute('data-html'),
        });
      }
    }
    this.element = this._template();
    this.selectElement.replaceWith(this.element);
    this._updateSelected();
    this._eventHandlers();
  }

  _template() {
    let optionsHTML = '';
    for (let i = 0; i < this.data.length; i++) {
      optionsHTML += `
                <div class="multi-select-option${this.selectedValues.includes(this.data[i].value) ? ' multi-select-selected' : ''}" data-value="${this.data[i].value}">
                    <span class="multi-select-option-radio"></span>
                    <span class="multi-select-option-text">${this.data[i].html ? this.data[i].html : this.data[i].text}</span>
                </div>
            `;
    }
    let selectAllHTML = '';
    if (this.options.selectAll === true || this.options.selectAll === 'true') {
      selectAllHTML = `<div class="multi-select-all">
                <span class="multi-select-option-radio"></span>
                <span class="multi-select-option-text">Select all</span>
            </div>`;
    }
    let template = `
            <div class="multi-select ${this.name}"${this.selectElement.id ? ' id="' + this.selectElement.id + '"' : ''} style="${this.width ? 'width:' + this.width + ';' : ''}${this.height ? 'height:' + this.height + ';' : ''}">
                ${this.selectedValues.map(value => `<input type="hidden" name="${this.name}[]" value="${value}">`).join('')}
                <div class="multi-select-header" style="${this.width ? 'width:' + this.width + ';' : ''}${this.height ? 'height:' + this.height + ';' : ''}">
                    <span class="multi-select-header-max">${this.options.max ? this.selectedValues.length + '/' + this.options.max : ''}</span>
                    <span class="multi-select-header-placeholder">${this.placeholder}</span>
                </div>
                <div class="multi-select-options" style="${this.options.dropdownWidth ? 'width:' + this.options.dropdownWidth + ';' : ''}${this.options.dropdownHeight ? 'height:' + this.options.dropdownHeight + ';' : ''}">
                    ${this.options.search === true || this.options.search === 'true' ? '<input type="text" class="multi-select-search" placeholder="Search...">' : ''}
                    ${selectAllHTML}
                    ${optionsHTML}
                </div>
            </div>
        `;
    let element = document.createElement('span');
    element.innerHTML = template;
    return element.firstElementChild;
  }

  _eventHandlers() {
    let headerElement = this.element.querySelector('.multi-select-header');
    this.element.querySelectorAll('.multi-select-option').forEach(option => {
      option.onclick = () => {
        let selected = true;
        if (!option.classList.contains('multi-select-selected')) {
          if (this.options.max && this.selectedValues.length >= this.options.max) {
            return;
          }
          option.classList.add('multi-select-selected');
          if (this.options.listAll === true || this.options.listAll === 'true') {
            if (this.element.querySelector('.multi-select-header-option')) {
              let opt = Array.from(
                this.element.querySelectorAll('.multi-select-header-option')
              ).pop();
              opt.insertAdjacentHTML(
                'afterend',
                `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`
              );
            } else {
              headerElement.insertAdjacentHTML(
                'afterbegin',
                `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`
              );
            }
          }
          this.element
            .querySelector('.multi-select')
            ?.insertAdjacentHTML(
              'afterbegin',
              `<input type="hidden" name="${this.name}[]" value="${option.dataset.value}">`
            );
          this.data.filter(data => data.value == option.dataset.value)[0].selected = true;
        } else {
          option.classList.remove('multi-select-selected');
          this.element
            .querySelectorAll('.multi-select-header-option')
            .forEach(headerOption =>
              headerOption.dataset.value == option.dataset.value ? headerOption.remove() : ''
            );
          this.element.querySelector(`input[value="${option.dataset.value}"]`)?.remove();
          this.data.filter(data => data.value == option.dataset.value)[0].selected = false;
          selected = false;
        }
        this.element
          .querySelectorAll('.multi-select-header-option')
          .forEach(header => header.remove());
        if (
          this.options.listAll === false ||
          this.options.listAll === 'false' ||
          this.selectedValues.length > 3
        ) {
          headerElement.insertAdjacentHTML(
            'afterbegin',
            `<span class="multi-select-header-option">${this.selectedValues.length} selected</span>`
          );
        } else {
          this.selectedItems.forEach(item =>
            headerElement.insertAdjacentHTML(
              'afterbegin',
              `<span class="multi-select-header-option" data-value="${item.value}">${item.text}</span>`
            )
          );
        }

        if (!this.element.querySelector('.multi-select-header-option')) {
          headerElement.insertAdjacentHTML(
            'afterbegin',
            `<span class="multi-select-header-placeholder">${this.placeholder}</span>`
          );
        } else if (this.element.querySelector('.multi-select-header-placeholder')) {
          this.element.querySelector('.multi-select-header-placeholder').remove();
        }
        if (this.options.max) {
          this.element.querySelector('.multi-select-header-max').innerHTML =
            this.selectedValues.length + '/' + this.options.max;
        }
        if (this.options.search === true || this.options.search === 'true') {
          this.element.querySelector('.multi-select-search').value = '';
        }
        this.element
          .querySelectorAll('.multi-select-option')
          .forEach(option => (option.style.display = 'flex'));
        if (
          this.options.closeListOnItemSelect === true ||
          this.options.closeListOnItemSelect === 'true'
        ) {
          headerElement.classList.remove('multi-select-header-active');
        }
        this.options.onChange(
          option.dataset.value,
          option.querySelector('.multi-select-option-text').innerHTML,
          this
        );
        if (selected) {
          this.options.onSelect(
            option.dataset.value,
            option.querySelector('.multi-select-option-text').innerHTML,
            this
          );
        } else {
          this.options.onUnselect(
            option.dataset.value,
            option.querySelector('.multi-select-option-text').innerHTML,
            this
          );
        }
      };
    });
    headerElement.onclick = () => headerElement.classList.toggle('multi-select-header-active');
    if (this.options.search === true || this.options.search === 'true') {
      let search = this.element.querySelector('.multi-select-search');
      search.oninput = () => {
        this.element.querySelectorAll('.multi-select-option').forEach(option => {
          option.style.display =
            option
              .querySelector('.multi-select-option-text')
              .innerHTML.toLowerCase()
              .indexOf(search.value.toLowerCase()) > -1
              ? 'flex'
              : 'none';
        });
      };
    }
    if (this.options.selectAll === true || this.options.selectAll === 'true') {
      let selectAllButton = this.element.querySelector('.multi-select-all');
      selectAllButton.onclick = () => {
        let allSelected = selectAllButton.classList.contains('multi-select-selected');
        this.element.querySelectorAll('.multi-select-option').forEach(option => {
          let dataItem = this.data.find(data => data.value == option.dataset.value);
          if (
            dataItem &&
            ((allSelected && dataItem.selected) || (!allSelected && !dataItem.selected))
          ) {
            option.click();
          }
        });
        selectAllButton.classList.toggle('multi-select-selected');
      };
    }
    if (
      this.selectElement.id &&
      document.querySelector('label[for="' + this.selectElement.id + '"]')
    ) {
      document.querySelector('label[for="' + this.selectElement.id + '"]').onclick = () => {
        headerElement.classList.toggle('multi-select-header-active');
      };
    }
    document.addEventListener('click', event => {
      if (
        !event.target.closest('.' + this.name) &&
        !event.target.closest('label[for="' + this.selectElement.id + '"]')
      ) {
        headerElement.classList.remove('multi-select-header-active');
      }
    });
  }

  _updateSelected() {
    if (this.options.listAll === true || this.options.listAll === 'true') {
      this.element.querySelectorAll('.multi-select-option').forEach(option => {
        if (option.classList.contains('multi-select-selected')) {
          this.element
            .querySelector('.multi-select-header')
            .insertAdjacentHTML(
              'afterbegin',
              `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`
            );
        }
      });
    } else {
      if (this.selectedValues.length > 0) {
        this.element
          .querySelector('.multi-select-header')
          .insertAdjacentHTML(
            'afterbegin',
            `<span class="multi-select-header-option">${this.selectedValues.length} selected</span>`
          );
      }
    }
    if (this.element.querySelector('.multi-select-header-option')) {
      this.element.querySelector('.multi-select-header-placeholder').remove();
    }
  }

  _redraw() {
    this.selectElement = document.querySelector(`.${this.name}`);
    this.element = this._template();
    this.selectElement.replaceWith(this.element);
    this._updateSelected();
    this._eventHandlers();
  }

  get selectedValues() {
    return this.data.filter(data => data.selected).map(data => data.value);
  }

  get selectedItems() {
    return this.data.filter(data => data.selected);
  }

  set data(value) {
    console.log('Updating selections', this.selectElement.id);
    this.options.data = value;
    this._redraw();
  }

  get data() {
    return this.options.data;
  }

  set selectElement(value) {
    this.options.selectElement = value;
  }

  get selectElement() {
    return this.options.selectElement;
  }

  set element(value) {
    this.options.element = value;
  }

  get element() {
    return this.options.element;
  }

  set placeholder(value) {
    this.options.placeholder = value;
  }

  get placeholder() {
    return this.options.placeholder;
  }

  set name(value) {
    this.options.name = value;
  }

  get name() {
    return this.options.name;
  }

  set width(value) {
    this.options.width = value;
  }

  get width() {
    return this.options.width;
  }

  set height(value) {
    this.options.height = value;
  }

  get height() {
    return this.options.height;
  }
}
// document.querySelectorAll('[data-multi-select]').forEach(select => new MultiSelect(select));

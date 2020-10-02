const getEl = (id) => {return document.getElementById(id)};

const getValue = (id) => {
  const el = getEl(id);
  if (!el.validity.valid) throw 'Not filled required field';

  return el.value;
};
const setValue = (id, val) => { getEl(id).value = val; };
const getText = (id) => { return getEl(id).innerHTML; };
const setText = (id, val) => { getEl(id).innerHTML = val; };
const addOption = (id, val, label = false) => {
	label = label || val;
	getEl(id).innerHTML+= `<option value="${val}">${label}</option>`;
}


HTMLElement.prototype.show = function show() {this.style.display = 'block'};
HTMLElement.prototype.hide = function hide() {this.style.display = "none"};
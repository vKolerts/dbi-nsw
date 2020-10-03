const {clipboard} = require('electron');
const audioError = new global.window.Audio('file://' + __dirname + '/dialog-warning.oga');

function error(err = '') {
  if (err) console.error(err);
  const status = getEl('error');
  status.innerText = err.toString();

  if (!err) return;
  blink(status);
  audioError.play();
  return;
}

function status(text = '') {
  const status = getEl('status');
  status.innerText = text;
  blink(status);
}

function blink(el) {
  el.className = 'blink';
  setTimeout(()=>{el.className = ''},100);
}

function saveJson(filename, data) { // TODO: use native dialog
    filename+= '.json';
    if (typeof data != 'string') {
      data = JSON.stringify(data);
    }

    const blob = new Blob([data], {type: 'application/json'});

    let elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

function upload(input, callback) {
	const fr = new FileReader();
    fr.readAsText(input.files[0]);
    fr.onload = r => {callback(r.target.result)};
}

function initDragDrop(dropArea, func) {
  ['dragenter', 'dragover'].forEach(event => {
    dropArea.addEventListener(event, (e) => {
      preventDef(e);
      dropArea.classList.add('highlight');
    }, false)
  });

  ['dragleave', 'drop'].forEach(event => {
    dropArea.addEventListener(event, (e) => {
      preventDef(e);
      dropArea.classList.remove('highlight');
      if (event === 'drop') func(e.dataTransfer);
    }, false)
  });
}

function preventDef(e) {
  e.preventDefault();
  e.stopPropagation();
}

const cfgSet = (key, val) => {
  if (typeof val != 'string') {
    val = JSON.stringify(val);
  }

  localStorage.setItem(key, val);
};

const cfgGet = (key) => {
  let val = localStorage.getItem(key);
  if (!val) return val;
  if (val === 'undefined') return undefined;
  if (val === 'null') return null;

  try {
    return JSON.parse(val);
  }
  catch(e) {
    return val;
  }
};

function copy(input) {
  status('Text copied to clipboard');
  const text = input.value || input.title;
  if (input.value) input.select();

  clipboard.writeText(text);
  // document.execCommand("copy");
  error();
}

function humanFileSize(bytes, si = false, dp = 2) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' b';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}


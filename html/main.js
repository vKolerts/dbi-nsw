const DBI = require('switch-dbi');
const Path = require('path');
const fs = require('fs');

let dbi;
let list = {};
nspDrawList();
initDragDrop(getEl('dnd_overlay'), ({files}) => {
  addNsp({files});
})
chkArgs();


async function addNsp(input) {
  await nspStop();
  const files = [...input.files];

  for (let i =  0; i < files.length; i++) {
    const {name, path, size} = files[i];
    if (fs.statSync(path).isDirectory()) {
      readDirRecursive(path, files);
      continue;
    }

    list[name] = {
      name,
      path,
      size,
      humanSize: humanFileSize(size),
      state: 'queue',
    };
  }

  input.value = '';
  nspDrawList();
}

async function nspSend() {
  await nspStop();
  if (!Object.keys(list).length) return status('Add NSP files before');

  dbi = new DBI(Object.values(list).map(i => i.path), dbiEvents);
  try {
    dbi.start()
    .catch(err => {
      status();
      error(err);
    });
  }
  catch (err) {
    status();
    return error(err)
  }

  getEl('nsp_stop_btn').disabled = false;
  status('DBI sending server started');
  return error();
}

async function nspStop() {
  if (!dbi) return;

  console.log('close prev dbi proccess');
  await dbi.exit();
  delete dbi;

  status('DBI sending server stoped');
  return;
}

function nspDrawList() {
  if (!Object.keys(list).length) {
    getEl('nsp_clear_btn').disabled = true;
    getEl('nsp_send_btn').disabled = true;
    return setText('nsp_list', '<p align="center">list empty</p>');
  }

  getEl('nsp_clear_btn').disabled = false;
  getEl('nsp_send_btn').disabled = false;
  const rows = Object.values(list).map(({name, path, humanSize, state}) => `<tr title="${path}">
  <td style="text-align:left">${name}</td>
  <td>${humanSize}</td>
  <td>${state}</td>
</tr>`).join('');

  let table = `
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Size</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table><hr/>`;


  return setText('nsp_list', table);
}

function nspClear() {
  list = {};
  nspDrawList();
}

function dbiEvents(event, data) {
  if (event === 'error') return error(data.nspName + ': ' + data.err);
  if (event === 'proccessCmdFileRange') return;
  if (event === 'readFileRange') {
    let state = list[data.nspName].state;

    if (state === 'queue') {
      state = 'active';
      status('Prepare nsp ' + data.nspName);
    }
    else if (data.range_size === 32) {
      state = 'finished';
      status('Finished nsp ' + data.nspName);
    }
    else if ([2097152, 4194304].includes(data.range_size)) {
      const sended = (data.range_offset + data.range_size);
      const percent = (sended * 100/ list[data.nspName].size)
      state = `proccess ${humanFileSize(sended)} (${percent.toFixed(2)} %)`;
    }
    else if (state.includes('proccess')) {
      state = `proccess ${humanFileSize(list[data.nspName].size)} (100.00 %)`;
    }

    if (list[data.nspName].state === 'active' && state !== 'active') {
      status('Proccess nsp ' + data.nspName);
    }

    list[data.nspName].state = state;

    return nspDrawList();
  }

  status(event);
  error();
}


function chkArgs() {
  // console.log({argv});
  if (!argv || !argv.length) return;
  let files = [];
  for (const f of argv) {
    readFile(f, files);
  }

  addNsp({files});
}

function readDirRecursive(path, files) {
  for (const f of fs.readdirSync(path)) {
    readFile(Path.join(path, f), files);
  };
}

function readFile(path, files) {
  if (!path.includes(Path.sep)) return;

  const stat = fs.statSync(path);
  if (stat.isDirectory()) {
    readDirRecursive(path, files);
    return;
  }

  name = path.split(Path.sep).pop();
  const ext = name.split('.').pop();
  if (!['nsp', 'nsz','xci'].includes(ext)) return;

  const file = {
    name,
    path,
    size: stat.size,
  };
  files.push(file);
  // console.log({file, files});

  return file;
}

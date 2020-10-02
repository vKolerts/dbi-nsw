const DBI = require('switch-dbi');

let dbi;
let list = {};
nspDrawList();

async function addNsp(input) {
  await nspStop();
  console.log(input.files);
  for (let i =  0; i < input.files.length; i++) {
    const {name, path, size} = input.files[i];
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

  status('Files loaded');
  return error();
}

async function nspStop() {
  if (!dbi) return;

  console.log('close prev dbi proccess');
  await dbi.exit();
  delete dbi;

  status('dbi stoped');
  return;
}

function nspDrawList() {
  if (!Object.keys(list).length) {
    getEl('nsp_clear_btn').disabled = true;
    return setText('nsp_list', '<p align="center">list empty</p>');
  }

  getEl('nsp_clear_btn').disabled = false;
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
    else if (data.range_size === 4194304) {
      const percent = ((data.range_offset + data.range_size) * 100/ list[data.nspName].size)
      state = `proccess ${humanFileSize(data.range_offset + data.range_size)} (${percent.toFixed(2)} %)`;
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

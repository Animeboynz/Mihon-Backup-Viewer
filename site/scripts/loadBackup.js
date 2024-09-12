import { closeModal, showModal } from './modals.js';
import { initializeLibrary } from './library.js';
import { loadSettings, saveSetting } from './settings.js';

export function handleFileLoad(event, fork = 'mihon') {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = e => {
    const fileName = file.name; // Gets filename to check nested extensions e.g. proto.gz
    const extension = fileName.split('.').pop().toLowerCase(); // Used to check extensions (Future me replace with fileName.endsWith(''))

    try {
      if (extension === 'json') {
        window.data = JSON.parse(e.target.result);
        saveSetting({ lastFork: fork }, true);
        initializeLibrary(); // Initialises Library with loaded JSON
        closeModal('load-modal'); // Closes the Load Modal
      } else if (extension === 'tachibk' || fileName.endsWith('.proto.gz')) {
        // Load protobuf schema
        protobuf.load(`schemas/schema-${fork}.proto`, (err, root) => {
          if (err) {
            alert(`Error loading protobuf schema.\n${err}`);
            return;
          }

          const Backup = root.lookupType('Backup'); // Resolve Backup message type
          const reader = new FileReader();

          reader.onload = e => {
            try {
              const arrayBuffer = e.target.result;
              const inflated = pako.inflate(new Uint8Array(arrayBuffer)); // Decompress the gzip file
              const message = Backup.decode(inflated); // Decode the protobuf encoded binary data
              // Convert the decoded message to JSON format
              window.data = Backup.toObject(message, {
                longs: String,
                enums: String,
                bytes: String,
              });
              saveSetting({ lastFork: fork }, true);
              initializeLibrary(); // Initialises Library with the Converter protobuf
              closeModal('load-modal'); // Closes the Load Modal
            } catch (error) {
              alert(`Error decoding protobuf file.\n${error}`);
            }
          };

          reader.readAsArrayBuffer(file);
        });
      } else {
        alert('Unsupported file type. Please pick a valid .json, .tachibk, or .proto.gz file.');
      }
    } catch (error) {
      alert('Error processing the file. Please pick a valid file.\n' + error);
    }
  };

  if (file) {
    reader.readAsText(file);
  }
}

export function loadDemoData() {
  fetch('../data.json')
    .then(response => response.json())
    .then(data => (window.data = data))
    .then(() => loadSettings(true))
    .then(() => closeModal('load-modal'))
    .then(data => initializeLibrary())
    .catch(error => {
      console.error('Error loading demo data:', error);
      showModal('load-modal');
    });
}

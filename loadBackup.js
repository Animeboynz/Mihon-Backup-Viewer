import { closeModal } from './modals.js';
import { initializeLibrary, showTab } from './library.js';

export function handleFileLoad(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = e => {
    const fileName = file.name; // Gets filename to check nested extensions e.g. proto.gz
    const extension = fileName.split('.').pop().toLowerCase(); // Used to check extensions (Future me replace with fileName.endsWith(''))

    try {
      if (extension === 'json') {
        window.data = JSON.parse(e.target.result);
        initializeLibrary(); // Initialises Library with loaded JSON
        closeModal('load-modal'); // Closes the Load Modal
      } else if (extension === 'tachibk' || fileName.endsWith('.proto.gz')) {
        // Load protobuf schema
        protobuf.load('schemas/schema-mihon.proto', (err, root) => {
          if (err) {
            alert('Error loading protobuf schema.');
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
              initializeLibrary(); // Initialises Library with the Converter protobuf
              closeModal('load-modal'); // Closes the Load Modal
            } catch (error) {
              alert('Error decoding protobuf file.');
            }
          };

          reader.readAsArrayBuffer(file);
        });
      } else {
        alert('Unsupported file type. Please pick a valid .json, .tachibk, or .proto.gz file.');
      }
    } catch (error) {
      alert('Error processing the file. Please pick a valid file.');
    }
  };

  if (file) {
    reader.readAsText(file);
  }
}

export function loadDemoData() {
  fetch('data.json')
    .then(response => response.json())
    .then(data => (window.data = data))
    .then(data => initializeLibrary())
    .catch(error => console.error('Error loading demo data:', error));
  closeModal('load-modal'); // Closes the Load Modal
}

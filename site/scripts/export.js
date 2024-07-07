export function encodeToProtobuf(fork = 'mihon') {
  // Load protobuf schema
  protobuf.load(`schemas/schema-${fork}.proto`, function (err, root) {
    if (err) throw err;

    // Resolve Backup message type
    var Backup = root.lookupType('Backup');

    try {
      var parsedData = window.data;

      parsedData.backupCategories = parsedData.backupCategories.filter(
        category => category.order !== -1 && category.order !== 65535
      );

      // Encode the JSON data using the protobuf schema
      var encodedData = Backup.encode(Backup.fromObject(parsedData)).finish();

      // Compress the encoded data
      var compressedData = pako.gzip(encodedData);

      // Create Blob from compressed data
      var blob = new Blob([compressedData], { type: 'application/octet-stream' });

      // Create download link
      var downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'output.tachibk';

      // Append to body to ensure it is part of the document
      document.body.appendChild(downloadLink);

      // Programmatically click the download link
      downloadLink.click();

      // Remove the download link from the document
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error:', error);
      alert('Error: Invalid JSON data');
    }
  });
}

export function dlJSON() {
  var parsedData = window.data;
  parsedData.backupCategories = parsedData.backupCategories.filter(
    category => category.order !== -1 && category.order !== 65535
  );

  var jsonString = JSON.stringify(parsedData, null, 2);
  var blob = new Blob([jsonString], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'EditedBackup';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

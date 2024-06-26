# Mihon Backup Viewer

This is a tool to explore your Mihon/Tachiyomi backup and convert it between JSON <-> .tachibk

## Usage - Mihon Backup Viewer

1. Clone this repo
2. Launch index.html with your favourite browser
3. If it does not load its probably because of CORS Policy so you can open launch.bat to create a quick python web server.
4. Upload your own JSON, .tachibk or .proto.gz, or use the demo data provided

or

1. Navigate to [https://tachibk.netlify.app/](https://tachibk.netlify.app/)
2. Upload your own JSON, .tachibk or .proto.gz, or use the demo data provided

<details>
  <summary>Convert TACHIBK to JSON</summary>

### Usage - TACHIBK to JSON Converter

1. Install Python 3.7+
2. Clone the [Repo](https://github.com/BrutuZ/tachibk-converter)
3. Download [ProtoC](https://github.com/protocolbuffers/protobuf/releases/tag/v27.1)
4. Install Depencencies

```
pip install -r requirements.txt
```

5. On Windows: Copy the "protoc.exe" to the same folder as "tachibk-converter.py"
6. Open the folder in CMD
7. Execute the command, replacing the input filename with the name of your backup

```
python tachibk-converter.py --input backup.tachibk --output data.json
```

</details>

## Contributing

Check [CONTRIBUTING.md](https://github.com/Animeboynz/Mihon-Backup-Viewer/blob/main/CONTRIBUTING.md)

<div align="center">

## Credits

Thank you to all the people who have contributed!

<a href="https://github.com/Animeboynz/Mihon-Backup-Viewer/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Animeboynz/Mihon-Backup-Viewer" alt="Contributors" title="Contributors" width="200"/>
</a>

</a>

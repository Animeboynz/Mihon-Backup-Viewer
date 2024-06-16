# Mihon Backup Viewer

This is a tool to explore your Tachiyomi Backup once its been decoded using the [TACHIBK to JSON Converter](https://github.com/BrutuZ/tachibk-converter) created by BrutuZ

## Usage - TACHIBK to JSON Converter

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


## Usage - Mihon Backup Viewer

1. Clone this repo
2. Launch index.html with your favourite browser
3. If it does not load its probably because of CORS Policy so you can open launch.bat to create a quick python web server.
4. Upload your own JSON or use the demo data provided

or 

1. Navigate to [https://tachibk.netlify.app/](https://tachibk.netlify.app/)
2. Upload your own JSON or use the demo data provided


## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

<div align="center">

## Credits

Thank you to all the people who have contributed!

<a href="https://github.com/Animeboynz/Mihon-Backup-Viewer/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Animeboynz/Mihon-Backup-Viewer" alt="Contributors" title="Contributors" width="200"/>
</a>

</a>

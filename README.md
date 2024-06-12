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
2. Replace the sample data.json with the one you created in the First Step
3. Launch index.html with your favourite browser
4. If it does not load its probably because of CORS Policy so you can open launch.bat to create a quick python web server.

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Thanks To
[BrutuZ](https://github.com/BrutuZ)

rintohsaka9999

[Clément Dubreuil](https://github.com/clementd64)

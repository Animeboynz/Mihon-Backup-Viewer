import requests
import re
import os

FORKS = {
    'mihon': 'mihonapp/mihon',
    'sy': 'jobobby04/TachiyomiSY',
    'j2k': 'Jays2Kings/tachiyomiJ2K',
}

PROTONUMBER_RE = r'(?:^\s*(?!\/\/\s*)@ProtoNumber\((?P<number>\d+)\)\s*|data class \w+\(|^)va[rl]\s+(?P<name>\w+):\s+(?:(?:(?:List|Set)<(?P<list>\w+)>)|(?P<type>\w+))(?P<optional>\?|(:?\s+=))?'
CLASS_RE = r'^(?:data )?class (?P<name>\w+)\((?P<defs>(?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)'
DATA_TYPES = {
    'String': 'string',
    'Int': 'int32',
    'Long': 'int64',
    'Boolean': 'bool',
    'Float': 'float',
    'PreferenceValue': 'bytes',
}

def fetch_schema(fork: str) -> list[tuple[str, str]]:
    files: list[tuple[str, str]] = []
    git = requests.get(
        f'https://api.github.com/repos/{fork}/contents/app/src/main/java/eu/kanade/tachiyomi/data/backup/models'
    ).json()
    for entry in git:
        if entry.get('type') == 'file':
            files.append((entry.get('name'), entry.get('download_url')))
        elif entry.get('type') == 'dir':
            for sub_entry in requests.get(entry.get('url')).json():
                if sub_entry.get('type') == 'file':
                    files.append(
                        (sub_entry.get('name'), sub_entry.get('download_url'))
                    )
    return files

def parse_model(model: str) -> list[str]:
    data = requests.get(model).text
    message: list[str] = []
    for name in re.finditer(CLASS_RE, data, re.MULTILINE):
        message.append('message {name} {{'.format(name=name.group('name')))
        for field in re.finditer(
            PROTONUMBER_RE, name.group('defs'), re.MULTILINE
        ):
            message.append(
                '  {repeated} {type} {name} = {number};'.format(
                    repeated='repeated'
                    if field.group('list')
                    else 'optional'
                    if field.group('optional')
                    else 'required',
                    type=DATA_TYPES.get(
                        field.group('type'),
                        DATA_TYPES.get(
                            field.group('list'),
                            field.group('list') or field.group('type'),
                        ),
                    ),
                    name=field.group('name'),
                    number=field.group('number') or 1
                    if not name.group('name').startswith('Broken')
                    else int(field.group('number')) + 1,
                )
            )
        message.append('}\n')
    return message

def proto_gen(file: str, fork: str):
    # Hard-coded exceptions to make parsing easier
    schema = '''

enum UpdateStrategy {
  ALWAYS_UPDATE = 0;
  ONLY_FETCH_ONCE = 1;
}

message PreferenceValue {
  required string type = 1;
  required bytes value = 2;
}

'''.splitlines()
    print(f'... Fetching from {fork.upper()}')
    for i in fetch_schema(FORKS[fork]):
        print(f'... Parsing {i[0]}')
        schema.append(f'// {i[0]}')
        schema.extend(parse_model(i[1]))
    if not os.path.exists('schemas'):
        os.makedirs('schemas')
    filename = file or f'schemas/schema-{fork}.proto'
    print(f'Writing {filename}')
    with open(filename, 'wt') as file:
        file.write('\n'.join(schema))

def main():
    print('Generating Protobuf schemas')
    for fork in FORKS:
        proto_gen(file=None, fork=fork)
    print('END')

if __name__ == '__main__':
    main()

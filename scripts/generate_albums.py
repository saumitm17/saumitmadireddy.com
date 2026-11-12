"""Refresh the static album manifest after adding or renaming photographs."""
import json
import re
import struct
from pathlib import Path

root = Path(__file__).resolve().parent.parent
def image_size(path):
    # Read JPEG frame dimensions without decoding or altering the image.
    with path.open('rb') as f:
        if f.read(2) != b'\xff\xd8':
            raise ValueError('Expected JPEG: {}'.format(path))
        while True:
            byte = f.read(1)
            if not byte:
                raise ValueError('Missing JPEG frame: {}'.format(path))
            if byte != b'\xff':
                continue
            marker = f.read(1)
            while marker == b'\xff':
                marker = f.read(1)
            if marker == b'\x00' or marker[0] in [0xD8, 0xD9, *range(0xD0, 0xD8)]:
                continue
            length = struct.unpack('>H', f.read(2))[0]
            if marker[0] in [0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF]:
                _, height, width = struct.unpack('>BHH', f.read(5))
                return [width, height]
            f.seek(length - 2, 1)

albums = []
for folder in sorted((root / 'website-photos').iterdir(), key=lambda p: p.name.lower()):
    if not folder.is_dir() or folder.name == 'About':
        continue
    photos = sorted((p for p in folder.iterdir() if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}), key=lambda p: int(re.match(r'\d+', p.name).group()))
    albums.append({'id': folder.name.lower(), 'name': {'New-York': 'New York', 'UpstateNY': 'Upstate NY'}.get(folder.name, folder.name), 'photos': [p.relative_to(root).as_posix() for p in photos], 'sizes': [image_size(p) for p in photos]})
(root / 'albums.js').write_text('const albums = ' + json.dumps(albums, indent=2) + ';\n')
print('Generated {} albums with {} photographs.'.format(len(albums), sum(len(a['photos']) for a in albums)))

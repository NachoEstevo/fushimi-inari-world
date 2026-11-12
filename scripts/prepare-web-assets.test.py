import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from PIL import Image

SCRIPT = Path(__file__).with_name('prepare-web-assets.py')


class TextureRebuildTest(unittest.TestCase):
    def test_rebuilds_webp_and_png_and_detects_output_collisions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            scripts = root / 'scripts'
            scripts.mkdir()
            shutil.copy(SCRIPT, scripts / SCRIPT.name)
            (scripts / 'share-precinct-images.mjs').write_text('')
            textures = root / 'fushimi_inari/assets/textures'
            def image(path, color):
                target = textures / path
                target.parent.mkdir(parents=True, exist_ok=True)
                Image.new('RGB', (1024, 1024), color).save(target)
            image('architectural-r1/cedar.webp', 'red')
            image('legacy/wall.png', 'blue')
            image('balanced/skip.webp', 'green')
            image('precinct-shared/skip.webp', 'green')
            command = ['python', str(scripts / SCRIPT.name)]
            result = subprocess.run(command, cwd=root, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            items = json.loads((textures / 'balanced/manifest.json').read_text())
            self.assertEqual({item['original'] for item in items}, {'architectural-r1/cedar.webp', 'legacy/wall.png'})
            for name, size in [('architectural-r1/cedar.webp', (256, 256)), ('legacy/wall.webp', (512, 512))]:
                with Image.open(textures / 'balanced' / name) as output:
                    self.assertEqual(output.size, size)
            existing = (textures / 'balanced/legacy/wall.webp').read_bytes()
            image('legacy/wall.webp', 'yellow')
            result = subprocess.run(command, cwd=root, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('collision', result.stderr.lower())
            self.assertEqual((textures / 'balanced/legacy/wall.webp').read_bytes(), existing)


if __name__ == '__main__':
    unittest.main()

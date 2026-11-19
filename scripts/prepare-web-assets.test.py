import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

SCRIPT = Path(__file__).with_name('prepare-web-assets.py')


class TextureRebuildTest(unittest.TestCase):
    def test_copper_mips_preserve_level_zero_and_compensate_only_unresolved_normals(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'fushimi_inari/assets/textures/nanobanana'
            source.mkdir(parents=True)
            normals = Image.new('RGB', (4, 4), (128, 128, 255))
            for y in range(4):
                for x in (2, 3):
                    normals.putpixel((x, y), (128 + (-90 if x == 2 else 90), 128, 219))
            path = source / 'roof_copper_patina_normal.png'
            normals.save(path)
            Image.new('L', normals.size, 100).save(source / 'roof_copper_patina_roughness.png')
            original = path.read_bytes()
            out = root / 'review'
            run = subprocess.run([sys.executable, str(SCRIPT.resolve()), 'copper-mips', str(out)],
                                 cwd=root, check=True, capture_output=True, text=True)
            report = json.loads(run.stdout)
            self.assertEqual([(level['width'], level['height']) for level in report], [(2, 2), (1, 1)])
            self.assertEqual(path.read_bytes(), original)
            self.assertFalse((source.parent / 'balanced').exists())
            with Image.open(out / 'roughness-2x2.webp') as image:
                roughness = image.convert('L')
                self.assertLessEqual(abs(roughness.getpixel((0, 0)) - 100), 1)
                self.assertGreater(roughness.getpixel((1, 0)), 115)
            with Image.open(out / 'normal-2x2.webp') as image:
                r, g, b = image.getpixel((1, 0))
                self.assertLessEqual(abs(r-128), 1)
                self.assertLessEqual(abs(g-128), 1)
                self.assertGreaterEqual(b, 254)

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

import subprocess as sp
import shutil
import os

outDir = '../LivLy'
exclude = ['.git', 'uncompressed', 'ext', '.vscode', '.gitignore', 'compressor.py', 'README.md', 'package.py']
if os.path.exists(outDir) is True:
			shutil.rmtree(outDir)
shutil.copytree('.' , outDir ,ignore=shutil.ignore_patterns(*exclude))

# make crx
#sp.call(['google-chrome', '--pack-extension="../Livly"', '--pack-extension-key="../LivLy.pem"'])

shutil.copy('../LivLy.pem', os.path.join(outDir, 'key.pem'))
sp.call(['zip', '-r', '../livly.zip', outDir])
import subprocess as sp
import shutil

exclude = ['.git', 'uncompressed', 'ext', '.vscode', '.gitignore', 'compressor.py', 'README.md', 'package.py']
shutil.copytree('.' , '../LivLy' ,ignore=shutil.ignore_patterns(*exclude))

# make crx
#sp.call(['google-chrome', '--pack-extension="../Livly"', '--pack-extension-key="../LivLy.pem"'])

shutil.copy('../LivLy.pem', '../LivLy')
sp.call(['zip', '-r', '../livly.zip', '../LivLy'])
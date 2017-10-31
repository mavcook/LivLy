import subprocess as sp
import shutil
import os
import glob
import css_html_js_minify as miny


outDir = '../LivLy'
exclude = [
	'.git', 
	'uncompressed', 
	'ext', 
	'.vscode', 
	'.gitignore', 
	'compressor.py', 
	'README.md', 
	'package.py', 
	'pipreqs.txt'
]

if os.path.exists(outDir) is True:
			shutil.rmtree(outDir)
shutil.copytree('.' , outDir ,ignore=shutil.ignore_patterns(*exclude))

# Minifiy
htmlFiles = glob.glob(outDir + '/**/*.html', recursive=True)
cssFiles = glob.glob(outDir + '/**/*.css', recursive=True)
jsFiles = glob.glob(outDir + '/**/*.js', recursive=True)

for f in htmlFiles:
	miny.process_single_html_file(f, overwrite=True)
for f in cssFiles:
	miny.process_single_css_file(f, overwrite=True)
for f in jsFiles:
	miny.process_single_js_file(f, overwrite=True)

# make crx
#sp.call(['google-chrome', '--pack-extension="../Livly"', '--pack-extension-key="../LivLy.pem"'])

shutil.copy('../LivLy.pem', os.path.join(outDir, 'key.pem'))
shutil.make_archive('../livly', 'zip', outDir)
os.remove('../LivLy/key.pem')
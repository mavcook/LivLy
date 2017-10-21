# Compress, scale, and create thumbnails for images
# Note: made very quickly, not supposed to be well writen and comprehensive
import subprocess as sp
import sys
import os
import shutil
from PIL import Image
import argparse



EXCLUDE_EXTS = ['.mp4', '.mov']
EXCLUDE_PATTERN = '_compressed'
MAX_WIDTH = 2500
MAX_HEIGHT = 2500
MAX_THUMB = (600,600)
THUMB_ASPECT_RATIO = 16/9
THUMB_QUALITY = 75



def getFiles(dirr):
	files = [f for f in os.listdir(dirr) if os.path.isfile(os.path.join(dirr, f))]
	files.sort()
	files = [f for f in files if EXCLUDE_PATTERN not in f]
	files = [f for f in files if os.path.splitext(f)[1].lower() not in EXCLUDE_EXTS]
	print('\nCompressing Input Files: ', files)
	files = [os.path.join(dirr, f) for f in files]

	return files



def compressImg(img, filename, quality, outDir, maxwidth, infile):

	outfile = os.path.join(outDir, filename + '_q' + str(quality) + '.jpg')
	if os.path.exists(outfile) == True:
		print('Skipping: already exits ', outfile)
		return

	w,h = img.size
	sf = w / h
	resize = False
	if w > maxwidth:
		w = maxwidth
		h = w * (1/sf)
		resize = True
	elif w < maxwidth:
		print('Img: ', filename, ' too small at: ', img.size, ' needed size: ', maxwidth)
		return
	w = int(w)
	h = int(h)

	
	if jpegCmp is True:
		img = img.resize((w,h), Image.ANTIALIAS)
		img.save(outfile,"JPEG",optimize=True, quality=quality) 
	else:
		
		cmd = ['/home/mav/Documents/projects/chromeExtensions/cwebp', '-m', '6', '-q', str(quality)]
		if resize is True:
			cmd += ['-resize', str(w), str(h)]
		cmd += [infile, '-o', outfile]
		sp.check_output(cmd)


def main(inDir, outDirAbs, quality):
	imgSizes = [3840, 2560, 1920, 1600, 1366]
	files = getFiles(inDir)
	if outDirAbs is None:
		outDirAbs = os.path.join(inDir, 'compressed')
	
	for i in imgSizes:
		outDir = os.path.join(outDirAbs, str(i))
	

		if os.path.exists(outDir) == False:
			os.makedirs(outDir)
			print("Created directory: ", outDir)
		

		for f in files:
			img = Image.open(f)
			fname = os.path.basename(f)
			fname = os.path.splitext(fname)[0]

			compressImg(img, fname, quality, outDir, i, f)



if __name__ == "__main__":
	argv=sys.argv[1:]

	# Quick command line arguments
	parser = argparse.ArgumentParser(description='Quick img compressor and thumbnailer')
	parser.add_argument('-d', type=str, required=True, help='Input directory. All files in directory will be compressed. Takes priority over -f')
	parser.add_argument('-o', '--output', type=str,
						help='Output directory. A directory will be created called compressed, along with the subfolder thumbs. If not specified, does this in the input directory.')
	parser.add_argument('-q', '--quality', default=85, type=int, help='Quality of compression, 1-100')
	parser.add_argument('-j', '--jpeg', action='store_true', help='Do jpeg compression')
	args = parser.parse_args(argv)

	q = args.quality
	inDir = args.d
	outDir = None
	jpegCmp = args.jpeg

	if args.output:
		outDir = args.output

	main(inDir, outDir, q)
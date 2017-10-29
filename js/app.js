var BG_PICS = [];
var ICONS = [];
var COMPLIMENTS;
var BG_DIV = document.getElementById('bg');
var _iconsDir = 'icons';
var _bgDir = 'bg';
var _complimentDiv, _nameInputDiv, _contentDiv, _nameSpan, _nameSpan;
var _bookmarks = {};

// oversized images cause slow load when creating a new tab
var BG_RES = [1366, 1600, 1920, 2560];//, 3840, 5120];
var KEYS = {
	space: 32,
	enter: 13
};

//TODO: download files
// for compliments, pictures, settings
// setting for dock to show up immediatley


// Helpers
function getRandomInt(min, max) 
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fix for JS not doing mod properly on negatives
Number.prototype.mod = function(n){ return ((this%n)+n)%n; }

// excludes WWW.
function getDomainName(url)
{
	if(url.search(/^https?\:\/\//) != -1)
		url = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i, '');
	else
		url = url.match(/^(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i, '');
	return url[1];
}






// ######## LOAD DATA #########################################################################################

function loadJSON(filename, callback)
{
	chrome.runtime.getPackageDirectoryEntry(function(root) {
		root.getFile(filename, {}, function(fileEntry) {
			fileEntry.file(function(file) {
				var reader = new FileReader();
				reader.onloadend = function(e) {
					var myFile = JSON.parse(this.result);
					callback(myFile);
				};
				reader.readAsText(file);
			});
		});
	});
}

// loads previous settings if exist
function loadData()
{
	// figure out which folder (res) pics to use
	if (!localStorage.BG_PICS)
	{
		var screenWidth = window.screen.width;
		for (var i = 0; i < BG_RES.length; ++i)
		{
			if (BG_RES[i] >= screenWidth)
			{
				_bgDir += '/' + BG_RES[i];
				getFiles(_bgDir, function(data){
					// create full path
					for (var j = 0; j < data.length; ++j)
						data[j] = _bgDir + '/' + data[j];
					BG_PICS = data.sort(function(a,b){
						a = a.substr(a.length - 10, a.length - 5);
						b = a.substr(b.length - 10, b.length - 5);
						return a > (b);
					});
					console.log('Load from dir', data);
					autoCycle();
					localStorage.BG_PICS = JSON.stringify(BG_PICS);					
				});
				break;
			}
		}
	}
	else
	{
		BG_PICS = JSON.parse(localStorage.BG_PICS);
		autoCycle();
	}


	getFiles(_iconsDir, function(data){
		ICONS = data;
	});


	if (!localStorage.compliments)
	{
		loadJSON('compliments.json', function(json){ 
			localStorage.compliments = JSON.stringify(json.compliments);
			COMPLIMENTS = json.compliments;
			changeCompliment();
		});
		console.log('loading compliments from file');
	}
	else
		COMPLIMENTS = JSON.parse(localStorage.compliments);
	

	if (!localStorage.date)
		localStorage.lastDay = new Date().getDate();


	if (!localStorage.bookmarks)
		loadJSON('bookmarks.json', function(json){
			console.log('loading bookmarks from file')
			_bookmarks = json.bookmarks;
			localStorage.bookmarks = JSON.stringify(_bookmarks);
			createBookmarks(_bookmarks);
		});
	else
		_bookmarks = JSON.parse(localStorage.bookmarks);

	// TODO: sync storage
}

function getFiles(directory, callback) 
{
	chrome.runtime.getPackageDirectoryEntry(function(root) {
		root.getDirectory(directory, {create: false}, function(localesdir) {
			var reader = localesdir.createReader();
			// Assumes that there are fewer than 100 locales; otherwise see DirectoryReader docs
			reader.readEntries(function(results) {
				callback(results.map(function(de){return de.name;}).sort());
			});
		});
	});
}






// ######## INIT INTERFACE ####################################################################################

function initInterface()
{
	// Init globals
	_complimentDiv = $('#compliment');
	_nameInputDiv = $('#wrap-input-name');
	_contentDiv = $('#wrap-content');
	_nameSpan = $('#name');
	_nameInput =$('#input-name');



	// not in loadData because need wait for dom elements
	if (localStorage.name)
		_nameSpan.html(localStorage.name);
	else
		setName();

	if (COMPLIMENTS)
		changeCompliment();

	if (_bookmarks)
		createBookmarks(_bookmarks);
	

	_contentDiv.fadeIn(1200, function(){$('.shade').fadeIn(1000)});
	
}

function addListeners()
{
	$('#nextPic').click(function(){ changePic(1) });
	$('#prevPic').click(function(){ changePic(-1) });
	

	_nameSpan.dblclick(function(){
		setName();
	});
	
	_nameInput.keypress(function(e){
		if (e.which === KEYS.enter)
		{
			var input = _nameInput.val();
			if (!input.replace(/\s/g, '').length) //just whitespace
				return;
			localStorage.setItem('name', input);
			_nameSpan.html(input);
			_nameInput.val('');
			_contentDiv.css({'-webkit-animation': 'top10_to_45 1.2s ease forwards'});
			
			_nameInputDiv.fadeOut();
		}
	});

	_nameInputDiv.focusout(function(){
		_nameInput.val('');
		_contentDiv.css({'-webkit-animation': 'top10_to_45 1.2s ease forwards'});
		_nameInputDiv.fadeOut();
	});

	_complimentDiv.dblclick(function(){
		changeCompliment();
	});

	$('#bookmark_launcher').click(function(){
		toggleBookmarkDock();
	});

	// Only toggle dock when name isn't being changed
	document.onkeypress = function (e) {
		e = e || window.event;
		if (e.keyCode === KEYS.space && _nameInputDiv.is(':visible') === false)
			toggleBookmarkDock();
		// TODO: switch and shortcuts 1->goto first bookmark
	};
}






// ######## MAIN ##########################################################################################
loadData();
$('document').ready(function()
{
	initInterface();
	addListeners();
});






// ######## GREETING ##########################################################################################

function setName()
{
	// TODO: performance
	_nameInputDiv.fadeIn();
	_contentDiv.css({'-webkit-animation': 'top10 1.2s ease forwards'});
	_nameInput.focus();
}

function changeCompliment()
{
	var idx = getRandomInt(0, COMPLIMENTS.length - 1);
	_complimentDiv.html(COMPLIMENTS[idx].text);
}






// ######## BACKGROUND #########################################################################################
// loads a random picture on a new day
function autoCycle()
{
	var lastDay = parseInt(localStorage.lastDay);
	var currentDay = new Date().getDate();

	if (currentDay != lastDay || !localStorage.BG_PICS) // will be incorrect if loaded on same day of past month, 
	// but that is only 1 failure/mo which is acceptable
	{
		console.log('New day, new pic. Enjoy');
		var i = getRandomInt(0, BG_PICS.length);
		changePic(i);
		localStorage.lastDay = currentDay;
	}
	else changePic(0);
}

// TODO: convert to using pic keys so pictures can be moved/deleted
function changePic(increment)
{
	var i = 0;
	if (localStorage.picIdx)
		i = parseInt(localStorage.picIdx);
	i = (i + increment).mod(BG_PICS.length);

	localStorage.picIdx =  i;
	

	BG_DIV.style.backgroundImage = 'url(' + BG_PICS[i] + ')';
	
	var img = new Image();
	// dont fade in until load is done
	img.onload = function(){ BG_DIV.className = 'fadein'; };
	img.src = BG_PICS[i];
	if (img.complete) 
		img.onload();
}






// ######## BOOKMARKS ##########################################################################################

var _sbm; //current selected bookmark for editing
var _curI;

// searches local icons folder for an icon that matches a given url
function getIconSrc(url)
{
	var domain = getDomainName(url);

	// TODO: look into getting JSON listing of a directory
	for (var i = 0; i < ICONS.length; i++)
	{
		if (ICONS[i].indexOf(domain) !== -1)
			return ICONS[i];
	}
	return null;
}

function bookmarkEdit_enter(selectedBookmark)
{

	if (_sbm && selectedBookmark !== _sbm)
		bookmarkEdit_exit()
	
	selectedBookmark.bind('click', false);
	_sbm = selectedBookmark;
	var url = selectedBookmark.attr('href');

	//BG_DIV.css('filter', 'blur(5px)');
	var i = selectedBookmark.attr('data-key');
	_curI = i;
	$('#bm-name').val(_bookmarks[i].name);
	$('#bm-url').val(_bookmarks[i].url);

	selectedBookmark.append($('#info'))
	selectedBookmark.removeClass('bookmark-scale-down').addClass('bookmark-scale-up')	
	selectedBookmark.children('.wrap-icon').removeClass('icon-shift-down').addClass('icon-shift-up')	
	$('#info').slideDown();
	$('#wrap-content').animate({opacity:0}, 'slow');
	
}

function bookmarkEdit_exit()
{
	_sbm.removeClass('bookmark-scale-up').addClass('bookmark-scale-down')
	_sbm.children('.wrap-icon').removeClass('icon-shift-up').addClass('icon-shift-down')
	$('#info').slideUp();
	$('#wrap-content').animate({opacity:1}, 'slow');
	// TODO: bug takes to url of _sbm
	_sbm.unbind('click');
}


$('#bm-cancel').click(function()
{
	updateIconSrc(_sbm, _bookmarks[_curI].url)

	bookmarkEdit_exit();

	$('#bm-name').val(_bookmarks[_curI].name);
	$('#bm-url').val(_bookmarks[_curI].url);
});



$('#bm-save').click(function()
{
	bookmarkEdit_exit();

	_sbm.attr('href', $('#bm-url').val());
	_bookmarks[_curI].name = $('#bm-name').val();
	_bookmarks[_curI].url = $('#bm-url').val();
	_bookmarks[_curI].icon = _sbm.find('.icon').attr('src');
	localStorage.bookmarks = JSON.stringify({'bookmarks': _bookmarks})
});

// updates the icon for a given $('.bookmark') el
function updateIconSrc(bookmark, newurl)
{
	var key = bookmark.attr('data-key');
	var b = JSON.parse(JSON.stringify(_bookmarks[key])); //copy instead of ref
	b.url = newurl;
	b.icon = '';
	var newIcon = getBookmarkIcon(b)

	bookmark.find('.icon').replaceWith(newIcon);
}

$('#bm-url').blur(function()
{
	updateIconSrc(_sbm, $(this).val())
});
$('#bm-url').keypress(function(e)
{
	if (e.which === KEYS.enter)
	{
		updateIconSrc(_sbm, $(this).val());
		$('#bm-name').focus();
	}
});


// shows or hides the bookmark dock
var wrap_bookmarks = $('#wrap-bookmarks');
function toggleBookmarkDock()
{
	// TODO: laggy on first time opening
	if (wrap_bookmarks.is(':visible'))
		wrap_bookmarks.fadeOut();
	else
	{
		$('.wrap-icon').removeClass('icon-shift-down')
		$('.bookmark').removeClass('bookmark-scale-down')
		wrap_bookmarks.css('display', 'flex').hide(); //hack for flexy
		wrap_bookmarks.css({'-webkit-animation': 'top90_to_68 .7s ease forwards'});
		/* TODO: allow overflow so multiple rows of bookmarks can scroll */
		wrap_bookmarks.fadeIn();
	}
}

// creates icon html for a given bookmark
// requires: b = json obj of single bookmark
// Returns icon source img or html to replace img
function getBookmarkIcon(b)
{
	var icon = $('<img>', {src: b.icon});
	icon.attr('class', 'icon');
	
	if (!b.icon)
	{
		var standardIcon = getIconSrc(b.url);
		if (!standardIcon)
			icon = $('<h1>').html(getDomainName(b.url).slice(0,2).toUpperCase());
		else
			icon.attr({src: _iconsDir + '/' + standardIcon})
	}
	return icon;
}

// requires json object of bookmarks in format of file://bookmarks.json
function createBookmarks(bm)
{
	console.log('Bookmarks JSON', bm);

	for (var key in bm)
	{
		var link = $('<a>', {href: bm[key].url, class: 'bookmark'});
		link.attr('data-key', key);
		
		var icon = getBookmarkIcon(bm[key])

		// save icon srcs for those that aren't defined
		bm[key].icon = icon.attr('src')

		var iconWrap = $('<div class="wrap-icon">');

		iconWrap.append(icon);
		link.append(iconWrap);
		wrap_bookmarks.append(link);
	}
	
	$('#bookmark_launcher').fadeIn(1000);

	localStorage.bookmarks = JSON.stringify(bm);
	_bookmarks = bm;
	
	$('.bookmark').each(function(){
		$(this).on('contextmenu', function(e){
			bookmarkEdit_enter($(this));
			return false;
		});
	});
}






// ######## SETTINGS ##########################################################################################
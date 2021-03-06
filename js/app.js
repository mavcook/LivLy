var BG_PICS = [];
var ICONS = [];
var COMPLIMENTS;
var CREDITS;
var BG_DIV = document.getElementById('bg');
var _iconsDir = 'icons';
var _bgDir = 'bg';
var _complimentDiv, _nameInputDiv, _contentDiv, _nameSpan, _nameSpan;
var _bgUrlDiv, _authorDiv;
var _bookmarks = {};
var _bm_nameDiv, _bm_urlDiv, _bm_infoDiv;

// oversized images cause slow load when creating a new tab
//, 3840, 5120]
var BG_RES = [1366, 1600, 1920, 2560]; 
var KEYS = {
	space: 32,
	enter: 13,
	i: 105
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
Number.prototype.mod = function(n){ return ((this%n)+n)%n; };

// return the last num(level) domains
function getDomainName(url, level)
{
	var domains = url.split('.');
	var d;
	if (domains.length === 2)
	{
		// ['https://domain', 'com']
		d = [domains[0].split('://')[1]];
		if (level !== -1)
			d.push(domains[1]);
	}
	else if (domains.length >= 3)
	{
		// ['http://sub', ...., 'domain', 'com']
		if (level >= domains.length)
			level = domains.length - 1;
		if (level === -1)
			d = [domains[domains.length - 2]];
		else
			d = domains.slice(domains.length-level - 1, domains.length - 1);
	}
	return d.join('.');
}

function getVersion()
{
	var currentVersion = chrome.app.getDetails().version;
	return parseInt(currentVersion.split('.').join(''));
}
// returns true if new version, false otherwise
function checkIfUpdated()
{

	var currentVersion = getVersion();

	if (!localStorage.version)
	{
		localStorage.version = currentVersion;
		return false;
	}


	if (parseInt(localStorage.version) < currentVersion)
		return true;
	return false;
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
				var selectedDir = _bgDir + '/' + BG_RES[i];
				getFiles(selectedDir, function(data){
					// create full path
					for (var j = 0; j < data.length; ++j)
						data[j] = selectedDir + '/' + data[j];

					BG_PICS = data.sort(function(a,b){
						a = a.substr(a.length - 10, a.length - 5);
						b = a.substr(b.length - 10, b.length - 5);
						return a > (b);
					});

					console.log('Loading pics from dir');
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


	if (!localStorage.credits){
		loadJSON('credits.json', function(json){ 
			localStorage.credits = JSON.stringify(json.credits);
			CREDITS = json.credits;
		});
		console.log('loading credits from file');
	}
	else
		CREDITS = JSON.parse(localStorage.credits);


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


	if (!localStorage.bookmarks || localStorage.bookmarks === 'undefined')
		loadJSON('bookmarks.json', function(json){
			console.log('loading bookmarks from file');
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
	_bgUrlDiv = $('#bgUrl');
	_authorDiv = $('#author');
	_bm_nameDiv = $('#bm-name');
	_bm_urlDiv = $('#bm-url');
	_bm_infoDiv = $('#info');


	// not in loadData because need wait for dom elements
	if (localStorage.name)
		_nameSpan.html(localStorage.name);
	else
		setName();

	if (COMPLIMENTS)
		changeCompliment();

	if (_bookmarks)
		createBookmarks(_bookmarks);
	

	_contentDiv.fadeIn(1200, function(){$('.shade').fadeIn(1000);});
	updateCredits();
}

function addListeners()
{
	$('#nextPic').click(function(){ changePic(1); updateCredits(); });
	$('#prevPic').click(function(){ changePic(-1); updateCredits(); });
	

	_nameSpan.dblclick(function(){
		setName();
	});
	
	_nameInput.keypress(function(e){
		if (e.which === KEYS.enter)
		{
			var input = _nameInput.val();
			if (!input.replace(/\s/g, '').length)
				// just whitespace
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

	$('#toolbar_launcher').click(function(){
		$('#wrap-toolbar').fadeToggle();
	});

	// Only toggle dock when name isn't being changed
	document.onkeypress = function(e){
		e = e || window.event;

		if ($(':focus').prop('nodeName') !== 'INPUT')
		{
			if (e.keyCode === KEYS.space)
				toggleBookmarkDock();
			else if (e.keyCode === KEYS.i)
				$('#wrap-toolbar').fadeToggle();
		}
		
		// TODO: switch and shortcuts 1->goto first bookmark
	};

}






// ######## MAIN ##########################################################################################
loadData();
$('document').ready(function()
{
	if (checkIfUpdated() === true)
	{
		window.open('livly-release-notes.html', '_blank');
		localStorage.removeItem('BG_PICS');
		localStorage.removeItem('credits');
		localStorage.removeItem('compliments');
		localStorage.version = getVersion();
		loadData();
	}

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

	if (currentDay != lastDay || !localStorage.BG_PICS) 
	// will be incorrect if loaded on same day of past month, 
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

//current selected bookmark for editing
var _sbm; 
var _curI;

// searches local icons folder for an icon that matches a given url
function getIconSrc(url)
{
	var domain = getDomainName(url, 1);

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
		bookmarkEdit_exit();
	selectedBookmark.on('click', false);
	_sbm = selectedBookmark;
	var url = selectedBookmark.attr('href');

	//BG_DIV.css('filter', 'blur(5px)');
	var i = selectedBookmark.attr('data-key');
	_curI = i;
	_bm_nameDiv.val(_bookmarks[i].name);
	_bm_urlDiv.val(_bookmarks[i].url);

	selectedBookmark.append(_bm_infoDiv);
	selectedBookmark.removeClass('bookmark-scale-down').addClass('bookmark-scale-up');
	selectedBookmark.children('.wrap-icon').removeClass('icon-shift-down').addClass('icon-shift-up');
	_bm_infoDiv.slideDown();
	_contentDiv.animate({opacity:0}, 'slow');
	
}

function bookmarkEdit_exit()
{
	_sbm.removeClass('bookmark-scale-up').addClass('bookmark-scale-down');
	_sbm.children('.wrap-icon').removeClass('icon-shift-up').addClass('icon-shift-down');
	_bm_infoDiv.slideUp();
	_contentDiv.animate({opacity:1}, 'slow');
	_sbm.off('click', false);
}


$('#bm-cancel').click(function(e)
{
	e.preventDefault();
	e.stopPropagation();

	updateIconSrc(_sbm, _bookmarks[_curI].url);

	bookmarkEdit_exit();

	_bm_nameDiv.val(_bookmarks[_curI].name);
	_bm_urlDiv.val(_bookmarks[_curI].url);
});



$('#bm-save').click(function(e)
{
	e.preventDefault();
	e.stopPropagation();

	bookmarkEdit_exit();

	_sbm.attr('href', _bm_urlDiv.val());
	_bookmarks[_curI].name = _bm_nameDiv.val();
	_bookmarks[_curI].url = _bm_urlDiv.val();
	_bookmarks[_curI].icon = _sbm.find('.icon').attr('src');
	localStorage.bookmarks = JSON.stringify(_bookmarks);
});

// updates the icon for a given $('.bookmark') el
function updateIconSrc(bookmark, newurl)
{
	var key = bookmark.attr('data-key');
	//copy instead of ref
	var b = JSON.parse(JSON.stringify(_bookmarks[key])); 
	b.url = newurl;
	b.icon = '';
	var newIcon = getBookmarkIcon(b);

	bookmark.find('.icon').replaceWith(newIcon);
}

$('#bm-url').blur(function()
{
	enteredUrl = $(this).val();
	if (enteredUrl.split('://').length < 2)
		enteredUrl = 'http://' + enteredUrl;
	$(this).val(enteredUrl);
	updateIconSrc(_sbm, enteredUrl);
});
$('#bm-url').keypress(function(e)
{
	if (e.which === KEYS.enter)
	{
		updateIconSrc(_sbm, $(this).val());
		_bm_nameDiv.focus();
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
		$('.wrap-icon').removeClass('icon-shift-down');
		$('.bookmark').removeClass('bookmark-scale-down');
		//hack for flexy
		wrap_bookmarks.css('display', 'flex').hide(); 
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
	var icon = $('<img>', {src: b.icon, class: 'icon'});

	if (!b.icon)
	{
		var standardIcon = getIconSrc(b.url);
		if (!standardIcon)
			icon = $('<h1 class="icon">').html(getDomainName(b.url, -1).slice(0,2).toUpperCase());
		else
			icon.attr({src: _iconsDir + '/' + standardIcon});
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
		
		var icon = getBookmarkIcon(bm[key]);

		// save icon srcs for those that aren't defined
		bm[key].icon = icon.attr('src');

		var iconWrap = $('<div class="wrap-icon">');

		iconWrap.append(icon);
		link.append(iconWrap);
		wrap_bookmarks.append(link);
	}
	
	$('.launcher').fadeIn(1000);

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

$('#settings-btn').click(function(){ $('#wrap-settings').slideToggle(); });

function updateCredits()
{
	if (BG_PICS.length === 0)
		return;

	var i = 0;
	if (localStorage.picIdx)
		i = localStorage.picIdx;

	var bgName = BG_PICS[i].split('/');
	bgName = bgName[bgName.length-1];
	var info = CREDITS[bgName];

	_bgUrlDiv.attr('href', info.imgUrl);
	_authorDiv.attr('href', info.authorUrl);
	_authorDiv.html(info.author);
}
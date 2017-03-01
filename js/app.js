var BG_PICS = [];
var ICONS = [];
var COMPLIMENTS;
var iconsDir = "icons";
var bgDir = "bg";
var BG_RES = [1366, 1920, 2560, 3840];
var KEYS = {
	space: 32,
	enter: 13
};

function getFiles(directory, callback) {
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


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fix for JS not doing mod properly on negatives
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}

// TODO: convert to using pic keys so pictures can be moved/deleted
function changePic(increment)
{
	var i = 0;
	if (localStorage.picIdx)
		i = parseInt(localStorage.picIdx);

	i = (i + increment).mod(BG_PICS.length);

	localStorage.picIdx =  i;
	var bg = $('#bg');
	bg.css('background-image', 'url(' + BG_PICS[i] + ')');
	if (bg.is(':visible') === false)
		bg.fadeIn(600);
}

// figure out which folder (res) pics to use
if (localStorage.BG_PICS && !localStorage.refreshPics)
{	BG_PICS = JSON.parse(localStorage.BG_PICS);
	console.log("Load from local storage", BG_PICS);
	autoCycle();
}
else
{
	var screenWidth = window.screen.width;
	for (var i = 0; i < BG_RES.length; ++i)
	{
		if (BG_RES[i] >= screenWidth)
		{
			bgDir += '/' + BG_RES[i];
			getFiles(bgDir, function(data){
				// create full path
				for (var j = 0; j < data.length; ++j)
					data[j] = bgDir + '/' + data[j];
				BG_PICS = data;
				localStorage.BG_PICS = JSON.stringify(BG_PICS);
				console.log("Load from dir", data);
				localStorage.removeItem('refreshPics');
				autoCycle();
			});
			break;
		}
	}
}




getFiles(iconsDir, function(data){
	ICONS = data;
});

// loads a random picture on a new day
function autoCycle()
{
	var d = new Date(localStorage.date);
	var now = new Date();

	if (now > d && ( now.getDate() > d.getDate() && now.getMonth() >= d.getMonth()))
	{
		console.log("New day, new pic. Enjoy");
		var i = getRandomInt(0, BG_PICS.length);
		changePic(i);
		localStorage.date = now;
	}
	else changePic(0);
}


// loads previous settings if exist
function loadLocalStorage()
{
	if (!localStorage.date)
		localStorage.date = new Date();

	// compliments
	if (!localStorage.compliments)
	{
		loadJSON('compliments.json', loadComps);
		console.log("loading compliments from file");
	}
	else
	{
		COMPLIMENTS = JSON.parse(localStorage.compliments);
		changeCompliment();
	}

	if (localStorage.name)
		$('#name').html(localStorage.name);
}


$('document').ready(function(){

	loadLocalStorage();


	$('#nextPic').click(function(){ changePic(1) });
	$('#prevPic').click(function(){ changePic(-1) });
	
	var content = $('#wrap-content');
	var name = $('#name');
	var nameInputDiv = $('#wrap-input-name');
	var nameInput =$('#input-name');

	content.fadeIn(1700, function(){$('.shade').fadeIn(1000)});

	name.dblclick(function(){

		nameInputDiv.fadeIn();
		content.css({'-webkit-animation': 'top10 1.2s ease forwards'});
		nameInput.focus();
	});
	
	nameInput.keypress(function(e){
		if (e.which === KEYS.enter)
		{
			var input = nameInput.val();
			if (!input.replace(/\s/g, '').length) //just whitespace
				return;
			localStorage.setItem('name', input);
			$('#name').html(input);
			nameInput.val('');
			content.css({'-webkit-animation': 'top10_to_45 1.2s ease forwards'});
			
			nameInputDiv.fadeOut();
		}
	});

	$('#wrap-input-name').focusout(function(){

		nameInput.val('');
		content.css({'-webkit-animation': 'top10_to_45 1.2s ease forwards'});
		nameInputDiv.fadeOut();
		
	});

	$('#compliment').dblclick(function(){
		changeCompliment();
	});


	$('#bookmark_launcher').click(function(){
		toggleBookmarkDock();
	});


	loadJSON('bookmarks.json', createBookmarks);
});

document.onkeypress = function (e) {
	e = e || window.event;
	if (e.keyCode === KEYS.space && $('#wrap-input-name').is(":visible") === false)
		toggleBookmarkDock();
	// TODO: switch and shortcuts 1->goto first bookmark
};

// shows or hides the bookmark dock
function toggleBookmarkDock()
{
	var bookmarks = $('#wrap-bookmarks');
	if (bookmarks.is(":visible"))
	{
		bookmarks.fadeOut();
	}
	else
	{
		bookmarks.css({'-webkit-animation': 'top90_to_68 .7s ease forwards'});
		/* TODO: allow overflow so multiple rows of bookmarks can scroll */
		bookmarks.fadeIn();
	}
}

var BOOKMARK_WIDTH = 172; //TODO: make this dynamic
function createBookmarks(json)
{
	console.log("Bookmarks JSON", json);
	var bm = json.bookmarks;
	var wrap_bookmarks = $('#wrap-bookmarks');
	
	var numBookmarks = 0;
	for (var key in bm)
	{
		var b = bm[key];
		var link = $('<a>', {href: b.src});
		var bDiv = $('<div>', {class: "bookmark"});
		var icon = $('<img>', {src: b.icon});

		// look for or create icon if non specified
		if (b.icon === "")
		{
			var standardIcon = getIcon(b.src);
			if (!standardIcon)
				icon = $('<h1>').html(getDomainName(b.src)[0].toUpperCase());
			else icon.attr({src: iconsDir + '/' + standardIcon})
		}

		bDiv.append(icon);
		link.append(bDiv);
		wrap_bookmarks.append(link);
		numBookmarks++;
	}
	wrap_bookmarks.css({width: numBookmarks * BOOKMARK_WIDTH + 'px'}); 
	$('#bookmark_launcher').fadeIn(1000);
}

// searches local icons folder for an icon that matches a given url
function getIcon(url)
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

// excludes WWW.
function getDomainName(url)
{
	if(url.search(/^https?\:\/\//) != -1)
		url = url.match(/^https?\:\/\/(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i, "");
	else
		url = url.match(/^(?:www\.)?([^\/?#]+)(?:[\/?#]|$)/i, "");
	return url[1];
}



function loadComps(json)
{
	COMPLIMENTS = json.compliments;
	localStorage.compliments = JSON.stringify(COMPLIMENTS);
	changeCompliment();
}




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


function changeCompliment()
{
	var idx = getRandomInt(0, COMPLIMENTS.length - 1);
	$('#compliment').html(COMPLIMENTS[idx].text);
}
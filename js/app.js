var BG_PICS = [];
var ICONS = [];
var COMPLIMENTS;
var iconsDir = "icons";
var bgDir = "bg";
// oversized images cause slow load when creating a new tab
var BG_RES = [1366, 1600, 1920, 2560];//, 3840, 5120];
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

//TODO: download files
// for compliments, pictures, settings
// setting for dock to show up immediatley
// click and hold anywhere for settings to appear

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fix for JS not doing mod properly on negatives
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}

var bg = document.getElementById('bg')
// TODO: convert to using pic keys so pictures can be moved/deleted
function changePic(increment)
{
	var i = 0;
	if (localStorage.picIdx)
		i = parseInt(localStorage.picIdx);

	i = (i + increment).mod(BG_PICS.length);

	localStorage.picIdx =  i;
	

	bg.style.backgroundImage = 'url(' + BG_PICS[i] + ')';
	
	var img = new Image();
	// dont fade in until load is done
	img.onload = function() {
		bg.className = 'fadein';
	}
	img.src = BG_PICS[i];
	if (img.complete) 
		img.onload();
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
				BG_PICS = data.sort(function(a,b){
					a = a.substr(a.length - 10, a.length - 5);
					b = a.substr(b.length - 10, b.length - 5);
					return a > (b);
				});
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
	var lastDay = parseInt(localStorage.lastDay);
	var currentDay = new Date().getDate();

	if (currentDay != lastDay) // will be incorrect if loaded on same day of month, 
	// but that is only 1 failure/mo which is acceptable
	{
		console.log("New day, new pic. Enjoy");
		var i = getRandomInt(0, BG_PICS.length);
		changePic(i);
		localStorage.lastDay = currentDay;
	}
	else changePic(0);
}



// loads previous settings if exist
function loadLocalStorage()
{
	if (!localStorage.date)
		localStorage.lastDay = new Date().getDate();

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
	// TODO: sync storage
}


$('document').ready(function(){

	loadLocalStorage();


	$('#nextPic').click(function(){ changePic(1) });
	$('#prevPic').click(function(){ changePic(-1) });
	
	var content = $('#wrap-content');
	var name = $('#name');
	var nameInputDiv = $('#wrap-input-name');
	var nameInput =$('#input-name');

	content.fadeIn(1200, function(){$('.shade').fadeIn(1000)});

	name.dblclick(function(){
		// TODO: performance
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

	// TODO: click and hold to edit
	var timeoutId = 0;
	$('.bookmarks').on('mousedown', function() {
		console.log("Sdad");
		timeoutId = setTimeout(function(){
			console.log("hey");}, 100);
	}).on('mouseup mouseleave', function() {
		clearTimeout(timeoutId);
	});


	loadJSON('bookmarks.json', createBookmarks);
});

var wrapName = $('#wrap-input-name');
document.onkeypress = function (e) {
	e = e || window.event;
	if (e.keyCode === KEYS.space && wrapName.is(":visible") === false)
		toggleBookmarkDock();
	// TODO: switch and shortcuts 1->goto first bookmark
};

// shows or hides the bookmark dock
var wrap_bookmarks = $('#wrap-bookmarks');
function toggleBookmarkDock()
{
	// TODO: laggy on first time opening
	if (wrap_bookmarks.is(":visible"))
	{
		wrap_bookmarks.fadeOut();
	}
	else
	{
		wrap_bookmarks.css({'-webkit-animation': 'top90_to_68 .7s ease forwards'});
		/* TODO: allow overflow so multiple rows of bookmarks can scroll */
		wrap_bookmarks.fadeIn();
	}
}

var BOOKMARK_WIDTH = 172; //TODO: make this dynamic
function createBookmarks(json)
{
	console.log("Bookmarks JSON", json);
	var bm = json.bookmarks;
	
	var numBookmarks = 0;
	for (var key in bm)
	{
		var b = bm[key];
		var link = $('<a>', {href: b.src, class: "bookmark"});
		var icon = $('<img>', {src: b.icon});

		// look for or create icon if none is specified
		if (b.icon === "")
		{
			var standardIcon = getIcon(b.src);
			if (!standardIcon)
				icon = $('<h1>').html(getDomainName(b.src).slice(0,2).toUpperCase());
			else icon.attr({src: iconsDir + '/' + standardIcon})
		}

		link.append(icon);
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
// $.getJSON('/test.json', function(e) {
// });

var compliment = $('#compliment');
function changeCompliment()
{
	var idx = getRandomInt(0, COMPLIMENTS.length - 1);
	compliment.html(COMPLIMENTS[idx].text);
}
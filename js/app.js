var BG_PICS = [];
var ICONS = [];
var COMPLIMENTS;
var iconsDir = "icons";
var bgDir = "bg";

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


// TODO: wrap instead of goto 0
function changePic(increment)
{
	var i = 0;
	if (localStorage.picIdx)// convert to keys so pictures can be moved/deleted
		i = parseInt(localStorage.picIdx);

	if (i + increment < BG_PICS.length && i + increment > 0)
		i += increment;
	else if (i + increment < 0)
		i = BG_PICS.length - 1;
	else i = 0;

	localStorage.picIdx =  i;
	$('html').css('background-image', 'url(bg/' + BG_PICS[i] + ')');
}

getFiles(bgDir, function(data){
	BG_PICS = data; 
	console.log(data);
	autoCycle();
});

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

$('document').ready(function(){
	
	// load previous settings if exist
	if (localStorage.name)
		$('#name').html(localStorage.name);
	$('#nextPic').click(function(){ changePic(1) });
	$('#prevPic').click(function(){ changePic(-1) });
	if (!localStorage.date)
		localStorage.date = new Date();


	var name = $('#name');
	var nameInputDiv = $('#wrap-input-name');
	var nameInput =$('#input-name');
	var bookmarks = $('#wrap-bookmarks');


	name.dblclick(function(){

		$('#wrap-input-name').fadeIn();
		$('#wrap-content').css({'-webkit-animation': 'top10 1.2s ease forwards'});
		nameInput.focus();
	});
	
	nameInput.keypress(function(e){
		if (e.which === 13)
		{
			localStorage.setItem('name', nameInput.val());
			$('#name').html(nameInput.val());
			nameInput.val('');
			$('#wrap-content').css({'-webkit-animation': 'top10_to_45 1.2s ease forwards'});
			

			$('#wrap-input-name').fadeOut();
		}
	});

	$('#wrap-input-name').focusout(function(){

		nameInput.val('');
		$('#wrap-content').css({'-webkit-animation': 'top10_to_45 1.2s ease forwards'});
		$('#wrap-input-name').fadeOut();
		
	});

	$('#compliment').dblclick(function(){
		changeCompliment();
	});


	$('#bookmark_launcher').click(function(){
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
	});

	loadJSON('compliments.json', loadComps);
	loadJSON('bookmarks.json', createBookmarks);
});



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
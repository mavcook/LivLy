var BG_PICS = [];

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

getFiles('bg', function(data){
	BG_PICS = data; 
	console.log(data);
	changePic(0);
});

$('document').ready(function(){
	
	// load previous settings if exist
	if (localStorage.name)
		$('#name').html(localStorage.name);
	$('#nextPic').click(function(){ changePic(1) });
	$('#prevPic').click(function(){ changePic(-1) });


	console.log(BG_PICS);

	var name = $('#name');
	var nameInputDiv = $('#wrap-input-name');
	var nameInput =$('#input-name');
	var bookmarks = $('#wrap-bookmarks');

	name.dblclick(function(){

		$('#wrap-input-name').fadeIn();
		$('#wrap-content').css({'-webkit-animation': 'top10 1.2s ease forwards'});
		nameInput.focus();
		console.log("EFSDFA");
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
			bookmarks.css({'-webkit-animation': 'top90_to_65 1.2s ease forwards'});
			/* TODO: allow overflow so multiple rows of bookmarks can scroll */
			bookmarks.fadeIn();
		}
	});

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

		bDiv.append(icon);
		link.append(bDiv);
		wrap_bookmarks.append(link);
		numBookmarks++;
	}
	wrap_bookmarks.css({width: numBookmarks * BOOKMARK_WIDTH + 'px'}); 
}

function loadComps(json)
{
	compliments = json.compliments;
}

loadJSON('compliments.json', loadComps);


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
var compliments;

function changeCompliment()
{
	var idx = getRandomInt(0, compliments.length - 1);
	$('#compliment').html(compliments[idx].text);
}
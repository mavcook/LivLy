# LivLy
A Google Chrome extension created and designed for the one and only Olivia.
LivLy is a non-distracting and useful New Tab page for Google Chrome, providing shortcuts to your favorite webpages, with a new, beautiful background every day.

If you don't like the picture of the day, just cycle through the images until you find one you like.

Min resolution: 800x680

[Download from Chrome Web Store](https://chrome.google.com/webstore/detail/livly/jodlifhapikdhppocniogknenmjlaiog)

[Video Demo](https://youtu.be/zWNZDP41F9g)
![Screenshot 1](/ext/0.png?raw=true)
![Screenshot 2](/ext/2.png?raw=true)
![Edit name](/ext/2.3.png?raw=true)

# User Guide

## Bookmarks
To access the bookmarks, click on the up arrow at the bottom of the page, or press the space-bar to open and close it.

### Edit Bookmarks
#### Via User Interface
Right click on one of the bookmarks. You can then enter in a url and name. Then click Save.

## Name
To change your name, double-click on your name, and enter in the new value.

## Picture Credits
To see the picture credits for the current image, press the 'i' key.

#### Via Chrome Console
```javascript
var bm = JSON.parse(localStorage.bookmarks);
// Edit as you like, example:
bm.bookmarks[1] = {url: 'http://mavcook.com', icon: '', name: 'Maverick Cook', short_name: 'Mavcook'}
// Save
localStorage.bookmarks = JSON.stringify(bm)
```
Then reload the newtab page.
To get back to defaults
```javascript
localStorage.removeItem('bookmarks')
```
hint: you can add/remove bookmarks this way too.

# Image rights
I use public domain images for the backgrounds, however I would still like to have the photographers credited. Some of the links I saved to the images are now broken, so if you find a photographer of a photo, or any information marked 'unknown' in [credits.json](credits.json), please make a pull request with the updates.

# Support
If you like LivLy and wish to support futher development, or support feeding my stomach, you can make a donation using the links below:

[Venmo @maverick-cook](https://venmo.com/Maverick-Cook?txn=pay&note=Supporting%20LivLy)
[PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=9G7XP36AHAQ7Q&lc=US&item_name=Maverick%20Cook%20Developer%20Fund&item_number=mcdf2017&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
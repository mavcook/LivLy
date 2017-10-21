# LivLy
A Google Chrome extension created and designed for the one and only Olivia.
LivLy is a non-distracting and useful newtab page for Google Chrome. 
Besides being pretty, LivLy is also useful. You can access shortcuts to your favorite webpages
by pressing the spacebar, or the arrow indicator at the bottom of the screen.

If you don't like the picture of the day, just cycle through the images until you find one you like.
Min resolution: 800x680

[Download]()

![Screenshot 1](/ext/1.png?raw=true)
![Screenshot 2](/ext/2.png?raw=true)
![Screenshot 3](/ext/3.png?raw=true)

# User Guide

## Edit Bookmarks
### Via User Interface
Coming soon
### Via Chrome Console
```javascript
var bm = JSON.parse(localStorage.bookmarks);
// Edit as you like, example:
bm.bookmarks[1] = {src: 'http://mavcook.com', icon: '', name: 'Maverick Cook', short_name: 'Mavcook'}
// Save
localStorage.bookmarks = JSON.stringify(bm)
```
Then reload the newtab page.
To get back to defaults
```javascript
localStorage.removeItem('bookmarks')
```

# Image rights
I use only public domain images for the backgrounds, however I would still like
to have the photographers credited. Some of the links I saved to the images are now broken,
so if you find a photographer of a photo, please make a pull request with the credits.
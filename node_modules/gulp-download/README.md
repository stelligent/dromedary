#gulp-download

[Request](https://github.com/mikeal/request) wrapper for gulp, allowing you to download files via http/https.

##Installation

	npm install gulp-download
	
##Usage

	var download = require("gulp-download");
	
	download(url)
		.pipe(gulp.dest("downloads/"));
		
Url: Either a url string or an array of url strings.



var through = require("through");
var gutil = require("gulp-util");
var request = require("request");
var progress = require("request-progress");
var col = gutil.colors;

module.exports = function(urls){
	var stream = through(function(file,enc,cb){
		this.push(file);
		cb();
	});


	var files = typeof urls === 'string' ? [urls] : urls;
	var downloadCount = 0;


	function download(url){
		var firstLog = true;
		
		progress(
			request({url:url,encoding:null},downloadHandler),
			{throttle:1000,delay:1000}
		)
		.on('progress',function(state){
			process.stdout.write(' '+state.percent+'%')
		})
		.on('data',function(){
			if(firstLog){
				process.stdout.write('['+col.green('gulp')+']'+' Downloading '+col.cyan(url)+'...');
				firstLog = false;
			}
		})

		function downloadHandler(err, res, body){
			var fileName = url.split('/').pop();
			var file = new gutil.File( {path:fileName, contents: new Buffer(body)} );
			stream.queue(file);

			process.stdout.write(' '+col.green('Done\n'));
			downloadCount++;
			if(downloadCount != files.length){
				download(files[downloadCount])
			}else{
				stream.emit('end')
			}
		}
	}
	download(files[0])

	return stream;
}


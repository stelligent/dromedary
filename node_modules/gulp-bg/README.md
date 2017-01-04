# gulp-bg

Execute command to run in the background.
Calling the returned function restarts the process if it's already running.

## Usage
Run a process in the background, and restart on changes.

```javascript
var bg = require("gulp-bg");

gulp.task("server", bg("node", "--harmony", "server.js"));

gulp.task("default", ["server"], function() {
  gulp.watch(["server.js"], ["server"]);
});
```

## License
MIT

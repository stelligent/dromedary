mkdir -p /dromedary/log
/usr/bin/forever /dromedary/app.js > /dromedary/log/server.log 2>&1 &

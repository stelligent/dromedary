#!/bin/bash -e

### BEGIN INIT INFO
# Provides:             zap
# Required-Start:       $remote_fs $syslog
# Required-Stop:        $remote_fs $syslog
# Default-Start:        2 3 4 5
# Default-Stop:         
# Short-Description:    OWASP ZAP Daemon Server
### END INIT INFO

ZAP=/opt/zap/zap.sh
ZAP_LOG=/var/log/zap.log
ZAP_HOST=0.0.0.0
ZAP_PORT=8080

if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

test -x ${ZAP} || exit 0

fetch_state() {
    if [ ! -f /var/run/zap.run ]; then
        state=1
        return
    fi

    PID=$(cat /var/run/zap.run)
    [ -n "$(ps aux | grep -i ${PID}.*java.*zap-[0-9].*\.jar)" ] && \
    {
        state=0
        return
    }

    state=1
    return 
}

start_zap() {
    echo -en "Starting Zap:\t"

    if [ ${state} -eq 0 ]; then 
        echo "Zap already running; skipping" 1>&2
        exit 1
    fi
    pushd /opt/zap 1 >> /dev/null
    timeout=0
    ${ZAP} \
        -daemon \
        -host ${ZAP_HOST} \
        -port ${ZAP_PORT} \
        -config api.disablekey=true >> $ZAP_LOG 2>&1 &
    sleep 2
    while [ -z "$(tail -n 2 $ZAP_LOG | grep 'ZAP is now listening')" ]; do
        timeout=$(( timeout + 1 ))
        sleep 1
        if [ $timeout -ge 60 ]; then
            echo "FAILED"
            exit 1
        fi
    done
    echo $! > /var/run/zap.run
    echo "Started"
}

stop_zap() {
    echo -en "Stopping Zap\t"
    if [ ${state} -eq 1 ]; then
        echo "Zap not running; skipping" 1>&2
        return
    fi

    PID=$(cat /var/run/zap.run)
    timeout=0
    kill ${PID}
    while [ -n "$(ps -p ${PID} -o comm=)" ]; do
        timeout=$(( timeout + 1 ))
        sleep 1
        if [ $timeout -ge 60 ]; then
            echo "FAILED"
            exit 1
        fi
    done
    rm -f /var/run/zap.run

    echo "Stopped"
}

zap_status() {
    [ ${state} -eq 0 ] && status="Running" || status="Stopped"
    echo -en "Status of zap: ${status}\n"
}

fetch_state 

case "$1" in
  start)
    start_zap
    ;;
  stop)
    stop_zap
    ;;
  restart)
    stop_zap
    fetch_state 
    start_zap
    ;;
  status)
    zap_status
    ;;
  *)
    echo "Usage: /etc/init.d/zap {start|stop|reload|status}" 2>&1
    exit 1
esac

exit 0


#!/usr/bin/env python

import sys
import time
import json
import argparse
import re

from zapv2 import ZAPv2


def openZapProxy(args):
    args.zap_host = re.sub(r'^((?!http://).*)',
                           r'http://\1', args.zap_host)
    args.zap_host_ssh = re.sub(r'^((?!http?s://).*)',
                               r'https://\1', args.zap_host_ssh)

    return ZAPv2(proxies={'http': args.zap_host,
                          'https': args.zap_host_ssh})


def fetchArguments():
    parse = argparse.ArgumentParser()
    parse.add_argument('-t', '--target', help='Specify target to scan',
                       default='http://localhost:80', dest='target')
    parse.add_argument('-z', '--zap-host', help='address and port of ZAP host',
                       default='127.0.0.1:8080', dest='zap_host')
    parse.add_argument('-Z', '--zap-host-ssh',
                       help='address and port of SSH ZAP host',
                       default='localhost:8080', dest='zap_host_ssh')
    return parse.parse_args()


def main():
    args = fetchArguments()

    zap = openZapProxy(args)

    sys.stdout.write('Accessing %s\n' % args.target)
    zap.urlopen(args.target)
    # Give the sites tree a chance to get updated
    time.sleep(2)

    sys.stdout.write('Spidering %s\n' % args.target)
    zap.spider.scan(args.target)

    time.sleep(2)
    while (int(zap.spider.status()) < 100):
        sys.stdout.write('Spider progress %: \n' + zap.spider.status())
        time.sleep(2)

    sys.stdout.write('Spider completed\n')
    # Give the passive scanner a chance to finish
    time.sleep(5)

    sys.stdout.write('Scanning %s\n' % args.target)
    zap.ascan.scan(args.target)
    while (int(zap.ascan.status()) < 100):
        time.sleep(5)

    sys.stdout.write('Info: Scan completed; writing results.\n')
    with open('results.json', 'w') as f:
        json.dump(zap.core.alerts(), f)


if __name__ == '__main__':
    main()

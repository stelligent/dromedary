#!/usr/bin/python

import argparse
import boto3
import json
import os
import re
import sys

RESULTS_FILES = dict({'zap_results': 'results.json',
                      'behave_results': 'behave_results.json',
                      'all_results': 'data/automated_pen_test_results.json'})


def fetchArguments():
    parse = argparse.ArgumentParser()
    parse.add_argument('-b', '--bucket', help='Bucket to upload results',
                       dest='bucket', default='dromedary-test-results')
    parse.add_argument('-f', '--filename', help='Filename to store resutls',
                       dest='filename', default=RESULTS_FILES['all_results'])

    return parse.parse_args()


def fetchJenkinsVars():
    jvars = dict()
    env_vars = list(['JOB_NAME', 'BUILD_NUMBER', 'BUILD_ID', 'BUILD_URL'])

    for ev in env_vars:
        jvars[ev] = os.environ.get(ev)

    return jvars


def fetchResults(filename):
    try:
        with open(filename, 'r') as json_data:
            return json.load(json_data)
    except:
        sys.stderr.write("Error: Unable to read %s.\n" % filename)
        sys.exit(1)


def parseErrorMessage(message_list):
    message = list()
    captured = 0
    for line in message_list:
        if captured:
            message.append(line)
        if re.match(r'^Captured', line):
            captured = 1

    return '\n'.join(message)


def sendToS3(contents, key, bucket):
    s3 = boto3.resource('s3')
    s3.Bucket(bucket).put_object(Key=key, Body=contents)


def main():
    args = fetchArguments()
    results = fetchJenkinsVars()
    behave_results = fetchResults(RESULTS_FILES['behave_results'])
    zap_results = fetchResults(RESULTS_FILES['zap_results'])

    # Fetch the overall result of the tests
    results['result'] = behave_results[0]['status']

    # Check each test
    results['results'] = list()
    for element in behave_results[0]['elements']:
        test = {'rule': element['name'], 'result': 'PASS', 'status': 'Passed'}

        # If any step failed, report failure for the test
        for step in element['steps']:
            if step['result']['status'] == 'failed':
                test['result'] = 'FAIL'
                error_message = step['result']['error_message']
                test['status'] = parseErrorMessage(error_message)

        results['results'].append(test)

    results['behave'] = behave_results
    results['zap'] = zap_results

    pretty_results = json.dumps(results, sort_keys=True,
                                indent=4, separators=(',', ': '))

    sendToS3(pretty_results, args.filename, args.bucket)


if __name__ == '__main__':
    main()

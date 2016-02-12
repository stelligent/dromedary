'use strict';

var git         = require('git-rev');
var moment      = require('moment');

var sha;

module.exports = function(callback) {
    if(!sha) {
        git.long(function (rtn) {
            if (!rtn) {
                sha = moment().format('YYYYMMDD-HHmmss');
            } else {
                sha = rtn;
            }

            callback(sha);
        });
    } else {
        callback(sha);
    }

};

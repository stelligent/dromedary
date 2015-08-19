var expect    = require("chai").expect;
var request   = require('urllib-sync').request;
var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

var shaResp = JSON.parse(request(targetUrl + '/sha').data.toString('utf-8'));

describe("Sha Endpoint", function() {
  it("Response object contains sha key", function() {
    expect(shaResp).to.include.keys('sha');
  });
  it("Sha values matches regex", function() {
    expect(shaResp.sha).to.match(/^[0-9a-f]{40}$/);
  });
});


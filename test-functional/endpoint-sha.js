var expect    = require("chai").expect;
var request   = require('urllib-sync').request;
var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';
var shaRegex  = /^([0-9a-f]{40}|[0-9]{8}-[0-9]{6})$/;

describe("/sha", function() {
  beforeEach(function() {
    this.shaResp = JSON.parse(request(targetUrl + '/sha').data.toString('utf-8'));
    console.log(this.shaResp)
  });

  it("response contains sha key", function() {
    expect(this.shaResp).to.include.keys('sha');
  });
  it("sha value matches regex: " + shaRegex.toString(), function() {
    expect(this.shaResp.sha).to.match(shaRegex);
  });
});

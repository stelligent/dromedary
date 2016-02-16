var expect    = require("chai").expect;
var request   = require('urllib-sync').request;
var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';
var shaRegex  = /^([0-9a-f]{40}|[0-9]{8}-[0-9]{6})$/;

describe("/config.json", function() {
  beforeEach(function() {
    this.resp = JSON.parse(request(targetUrl + '/config.json').data.toString('utf-8'));
    console.log(this.resp)
  });

  it("response contains version key", function() {
    expect(this.resp).to.include.keys('version');
  });
  it("response contains apiBaseurl key", function() {
    expect(this.resp).to.include.keys('apiBaseurl');
  });
  it("version value matches regex: " + shaRegex.toString(), function() {
    expect(this.resp.version).to.match(shaRegex);
  });
  it("apiBaseurl value matches: ''", function() {
    expect(this.resp.apiBaseurl).to.match(/^$/);
  });
});

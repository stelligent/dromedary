var expect  = require("chai").expect;
var fs      = require('fs');
var request = require('urllib-sync').request;

var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

describe("/", function() {
  beforeEach(function() {
    this.expectedIndex = fs.readFileSync('./public/index.html').toString('utf-8');
    this.servedIndex   = request(targetUrl + '/').data.toString('utf-8');
  });

  it("serves ./public/index.html", function() {
    expect(this.servedIndex).to.equal(this.expectedIndex);
  });
});

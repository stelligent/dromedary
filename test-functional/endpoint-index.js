var expect  = require("chai").expect;
var fs      = require('fs');
var request = require('urllib-sync').request;

var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

describe("Index File", function() {
  var expectedIndex;
  var servedIndex;
  before(function() {
    expectedIndex = fs.readFileSync('./public/index.html').toString('utf-8');
    servedIndex   = request(targetUrl + '/').data.toString('utf-8');
  });

  it("Is Served", function() {
    expect(servedIndex).to.equal(expectedIndex);
  });
});

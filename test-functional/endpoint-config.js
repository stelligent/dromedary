var expect    = require("chai").expect;
var rp        = require('request-promise');
var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';
var shaRegex  = /^([0-9a-f]{40}|[0-9]{8}-[0-9]{6})$/;

describe("/config.json", function() {
  var resp;
  beforeEach(function(done) {
    rp({ uri: targetUrl+'/config.json', json:true})
        .then(function (data) {
          resp = data;
          done();
        })
        .catch(function (err) {
          throw err;
        });

    console.log(resp)
  });

  it("response contains version key", function() {
    expect(resp).to.include.keys('version');
  });
  it("response contains apiBaseurl key", function() {
    expect(resp).to.include.keys('apiBaseurl');
  });
  it("version value matches regex: " + shaRegex.toString(), function() {
    expect(resp.version).to.match(shaRegex);
  });
});

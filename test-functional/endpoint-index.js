var expect  = require("chai").expect;
var fs      = require('fs');
var rp        = require('request-promise');
var targetUrl = process.env.hasOwnProperty('TARGET_URL') ? process.env.TARGET_URL : 'http://localhost:8080';

describe("/", function() {
  var expectedIndex;
  before(function() {
      expectedIndex = fs.readFileSync(__dirname+'/../public/index.html').toString('utf-8');
  });

  var servedIndex;
  beforeEach(function(done) {
    rp({ uri: targetUrl+'/'})
        .then(function(data) {
            servedIndex = data;
            done();
        }).catch(function(err) {
            throw err;
        })
  });

  it("serves ./public/index.html", function() {
    expect(servedIndex).to.equal(expectedIndex);
  });
});

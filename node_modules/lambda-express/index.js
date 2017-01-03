var http = require('http')



/*
 * Split one of API Gateway's param strings into a real javascript object
 * @param {string} paramString Looks like {key1=val1, key2=val2}
 */
function parseParamString(paramString) {
    var obj = {};

    if ( typeof paramString !== "undefined" ){
        paramString
            .substring(1, paramString.length - 1) //strip off { and }
            .split(", ")
            .forEach(function(keyVal) {
                var pieces = keyVal.split("=");
                var key = pieces[0],
                    val = pieces[1];

                //Force "true" and "false" into Boolean
                if (val === "true") val = true;
                if (val === "false") val = false;

                obj[key] = val;
            });
    }

    return obj;
};


/*
 * Generate a somewhat normal path
 */
function reconstructUrl(path,request) {

    //Append query string
    if (Object.keys(request.queryParams).length > 0) {
        var str = [];
        for (var p in request.queryParams) {
            if (request.queryParams.hasOwnProperty(p) && p != '') {
                str.push(p + "=" + request.queryParams[p]);
            }
        }
        if ( str.length > 0 ){
            path += "?" + str.join("&");
        }
    }

    //Fix path parameters
    if (Object.keys(request.pathParams).length > 0) {
        for (var param in request.pathParams) {
            if (request.pathParams.hasOwnProperty(param)) {
                var toReplace = "{" + param + "}";
                path = path.replace(toReplace, request.pathParams[param]);
            }
        }
    }

    return path;
}
function mapEvent( event){
    var request = {};

    request.queryParams = {};

    if (typeof event.queryString !== "undefined"){
        request.queryParams = parseParamString(event.queryString);
    }

    if (typeof event.headers !== "undefined"){
        request.headers = parseParamString(event.headers);
        request.headers["user-agent"] = event["user-agent"];

        request.headers["x-real-ip"] = event["source-ip"];
        request.headers["host"] = event["api-id"]
    }
    request.pathParams = parseParamString(event.pathParams);

    request.method = event["http-method"];
    request.url = reconstructUrl(event['resource-path'],request);
    delete request.allParams;
    delete request.queryString;

    var fake_sock = {
        remoteAddress: event.remoteAddress
    };

    request.socket =  fake_sock;
    request.connection =  fake_sock;

    return request;
}

exports.appHandler = function(appHandle) {
    return function(event, context) {
        var app;
        // if we were passed a function, call it to get the app
        if(Object.prototype.toString.call(appHandle) == '[object Function]') {
            app = appHandle(event,context);
        } else {
            app = appHandle;
        }
        var responseHeaders = []
        if (event.responseHeaders) {
          responseHeaders = (event.responseHeaders || '').split(':');
        }
        var req = mapEvent(event);
        var res = new http.ServerResponse(req);
        res.original_end = res.end;
        res.end = function (chunk, encoding, callback) {
            res.original_end(chunk, encoding, callback);
            var statusCode = res.statusCode;

            if (statusCode > 399) {
                var err = new Error(statusCode);
                context.fail(err);
            } else {
                var contentType = res.getHeader('content-type');
                var payload = res.output[1].toString('base64');

                var lambdaResponse = {payload: payload, contentType: contentType};
                for (var i=0, l=responseHeaders.length; i<l; i++) {
                  var h = responseHeaders[i];
                  lambdaResponse[h] = res.getHeader(h.toLowerCase());
                }
                context.succeed(lambdaResponse);
            }
        };

        // setup and call express
        app.handle(req, res);
    };
};


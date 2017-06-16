/**
 * Created by anuranjit on 9/10/16.
 */
"use strict";

var HttpConnector = require("elasticsearch/src/lib/connectors/http.js");
var Host = require("elasticsearch/src/lib/host");
var AWS = require("aws-sdk");
let _ = require('elasticsearch/src/lib/utils');
var zlib = require("zlib");
var underscore = require("underscore");

class AWSHttpConnector extends HttpConnector {
    constructor(host, config) {
        host = new Host(host);
        super(host, config);
        this.legacyES = config["legacy"];
        var awsESConfig = config["awsESConfig"];
        let useSSL = awsESConfig["useSSL"];
        if (!useSSL) {
            host = "http://" + host
        }
        this.endpoint = new AWS.Endpoint(host.host);
        var accessKey = awsESConfig["accessKey"];
        var secretKey = awsESConfig["secretKey"];
        this.region = awsESConfig["region"];
        this.serviceName = awsESConfig["serviceName"];
        this.credentials = new AWS.Credentials(accessKey, secretKey)
    }

    getAwsHttpRequest(params, reqParams) {
        var awsRequest = new AWS.HttpRequest(this.endpoint);
        underscore.extend(awsRequest, reqParams);
        awsRequest.region = this.region;
        awsRequest.body = params.body || {};
        awsRequest.headers['presigned-expires'] = false;
        awsRequest.headers['Host'] = this.endpoint.host;
        var awsSigner = new AWS.Signers.V4(awsRequest, this.serviceName);
        awsSigner.addAuthorization(this.credentials, new Date());
        return awsRequest;
    }

    request(params, cb) {
        var incoming;
        var timeoutId;
        var request;
        var status = 0;
        var headers = {};
        var log = this.log;
        var response;

        var reqParams = this.makeReqParams(params);

        // general clean-up procedure to run after the request
        // completes, has an error, or is aborted.
        var cleanUp = _.bind(function (err) {
            clearTimeout(timeoutId);

            request && request.removeAllListeners();
            incoming && incoming.removeAllListeners();

            if ((err instanceof Error) === false) {
                err = void 0;
            }

            log.trace(params.method, reqParams, params.body, response, status);
            if (err) {
                cb(err);
            } else {
                cb(err, response, status, headers);
            }
        }, this);
        var callBack = function (_incoming) {
            incoming = _incoming;
            status = incoming.statusCode;
            headers = incoming.headers;
            response = '';

            var encoding = (headers['content-encoding'] || '').toLowerCase();
            if (encoding === 'gzip' || encoding === 'deflate') {
                incoming = incoming.pipe(zlib.createUnzip());
            }

            incoming.setEncoding('utf8');
            incoming.on('data', function (d) {
                response += d;
            });

            incoming.on('error', cleanUp);
            incoming.on('end', cleanUp);
        };
        if (this.legacyES) {
            request = AWSHttpConnector.getLegacyHandler(this.hand, reqParams, callBack)
        } else {
            var httpClient = new AWS.NodeHttpClient();
            var httpRequest = this.getAwsHttpRequest(params, reqParams);
            request = AWSHttpConnector.getAwsHandler(httpClient, httpRequest, callBack);
        }
        request.on('error', cleanUp);
        request.setNoDelay(true);
        request.setSocketKeepAlive(true);
        if (this.legacyES) {
            if (params.body) {
                request.setHeader('Content-Length', Buffer.byteLength(params.body, 'utf8'));
                request.end(params.body);
            } else {
                request.setHeader('Content-Length', 0);
                request.end();
            }

        }
        return function () {
            request.abort();
        };
    }

    static getLegacyHandler(httpClient, reqParams, cb) {
        return httpClient.request(reqParams, cb);
    }

    static getAwsHandler(httpClient, httpRequest, cb) {
        return httpClient.handleRequest(httpRequest, null, cb, cb);
    }
}

module.exports = AWSHttpConnector;

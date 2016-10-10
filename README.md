# aws-es-connector
A small HttpConnector to be used with aws elasticsearch service

[![NPM](https://nodei.co/npm/awsesconnector.png)](https://npmjs.org/package/awsesconnector)

Usage
```
var AwsHttpConnector = require("awsesconnector");
var elasticsearch = require("elasticsearch")

module.exports.elasticsearchPlaces = new elasticsearch.Client({
    "host": <host:port>,
    "connectionClass": AwsHttpConnector,
    "awsESConfig": {
        "accessKey": <aws access key> ,
        "secretKey":<aws secret key>,
        "region": <aws region>,
        "serviceName":< service name ('es' in case of ElasticSearch Service)
    },
    "legacy": config["TURN_ON_AWS"]
});


```

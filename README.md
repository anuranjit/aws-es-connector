# aws-es-connector
A small HttpConnector to be used with aws elasticsearch service

[![NPM](https://nodei.co/npm/aws-es-connector.png)](https://npmjs.org/package/aws-es-connector)

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
    "legacy": <boolean:use aws or not>
});

```

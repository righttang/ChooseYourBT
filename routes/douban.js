var express = require('express');
var q = require('q');
var router = express.Router();
var settings = require('../settings.json');
var doubanClient = require('../douban/doubanClient.js');
var mockdbcollection = require('../models/mockdbcollection.js')


var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/ChooseYourBT');
var collectionName = 'movie';

router.get('/', function (req, res, next) {

    if (req.query.code) {
        doubanClient.getDoubanClient(req.query.code);
    }

    queryDataFromDouban('采访.The.Interview.2014').then(function (data) {
        res.json(JSON.parse(data));
    }, function (authorize_url) {
        console.log("Rejectted from second Level");
        res.writeHead(301,
            {Location: authorize_url}
        );
        res.end();
    });

});


//Do A search Query to Douban
function queryDataFromDouban(movieName) {
    var deferred = q.defer();
    if (settings.useMock) {
        deferred.resolve(mockdbcollection.getDoubanMock());
    } else {
        doubanClient.getDoubanClient()
            .then(function (client) {
                //Success
                var event = client.movie.search(movieName);
                event.on('data', function (err, data) {
                    if (!err) {
                        deferred.resolve(JSON.parse(data));
                    } else {
                        console.log(err);
                        deferred.reject(err);
                    }
                });
            }, function (client) {
                console.log("Rejectted from first Level");
                deferred.reject(client.authorize_url());
            });
    }
    return deferred.promise;

}

module.exports = router;

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
    queryDataFromDouban('采访.The.Interview.2014').then(function (data) {
        res.json(data);
    });

});




//Do A search Query to Douban
function queryDataFromDouban(movieName) {
    var deferred = q.defer();
    if (settings.useMock) {
        deferred.resolve(mockdbcollection.getDoubanMock());
    } else {
        var client = doubanClient.getDoubanClient();
        var event = client.movie.search(movieName);
        event.on('data', function (err, data) {
            if (!err) {
                deferred.resolve(data);
            } else {
                console.log(err);
                deferred.reject(err);
            }
        });
    }
    return deferred.promise;

}

module.exports = router;

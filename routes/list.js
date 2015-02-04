var express = require('express');
var router = express.Router();
var settings = require('../settings.json');
var doubanClient = require('../douban/doubanClient.js');
var mockdbcollection = require('../models/mockdbcollection.js')

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/ChooseYourBT');
var collectionName = 'movie';


router.get('/', function (req, res, next) {
    var collection = db.get(collectionName);
    collection.find({}, {},
        function (e, doc) {
            res.json(doc);
        });
});

router.get('/update', function (req, res, next) {
    var collection = db.get(collectionName);
    collection.find({}, {},
        function (e, doc) {
            for (var i = 0; i < doc.length; i++) {
                (function(index){
                    doubanClient.getDoubanClient().then(function (client) {
                        var searchKeyword = convertNameToSearchTerm(doc[index].name);
                        console.log(searchKeyword);
                        if (settings.useMock) {
                            //console.log(JSON.stringify(mockdbcollection.getDoubanMock()));
                        }else
                        {
                            var searchEvent = client.movie.search(searchKeyword);
                            searchEvent.on('data', function (err, data) {
                                if (!err) {
                                    console.log(JSON.stringify(data));
                                }
                            });
                        }

                    });
                }(i))
            }
        });

    res.send("OK");


});

function convertNameToSearchTerm(name) {
    console.log(name.replace(/[^\u4e00-\u9fa5]/gmi, '').replace(/\s+/g, " "));

    return name.replace(/[^a-z0-9]/gmi, " ").replace(/\s+/g, " ")
        .replace("2014", '').replace("1080p", '').replace("BluRay", '')
        .replace("WEBRip", '').replace("2013", '').replace("WEB DL", '').replace("DL", '');
}


module.exports = router;

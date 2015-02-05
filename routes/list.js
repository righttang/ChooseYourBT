var express = require('express');
require('fuzzyset.js');
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
            for (var i = 0; i < 5; i++) {
                (function (index) {
                    doubanClient.getDoubanClient().then(function (client) {
                        var searchKeyword = convertNameToSearchTerm(doc[index].name);

                        if (settings.useMock) {
                            console.log(processSearchResults(mockdbcollection.getDoubanMock().subjects, searchKeyword));
                        } else {
                            var searchEvent = client.movie.search(searchKeyword.englishName);
                            searchEvent.on('data', function (err, data) {
                                data = JSON.parse(data);
                                if (!err) {
                                    if (data.subjects) {
                                        console.log(processSearchResults(data.subjects, searchKeyword));
                                    }
                                }
                            });
                        }
                    });
                }(i));
            }
        });

    res.send("OK");


});

function convertNameToSearchTerm(name) {
    var chineseName = name.replace(/[^\u4e00-\u9fa5]/gmi, '').replace(/\s+/g, " ");
    var englishName = name.replace(/[^a-z0-9]/gmi, " ")
        .replace("2014", '').replace("1080p", '').replace("BluRay", '')
        .replace("WEBRip", '').replace("2013", '')
        .replace("WEB DL", '').replace("DL", '').replace(/\s+/g, " ");
    return {"chineseName": chineseName,
        "englishName": englishName}
}

function processSearchResults(subjects, searchKeyword) {
    //TODO If there is only one, then return
    //TODO DO a year Match
    var nameFuzzySet = FuzzySet();
    for (var i = 0; i < subjects.length; i++) {
        nameFuzzySet.add(subjects[i].original_title);
    }
    console.log(searchKeyword.englishName);
    var mostMatchName = null;
    if ((nameFuzzySet.get(searchKeyword.englishName))) {
        mostMatchName = (nameFuzzySet.get(searchKeyword.englishName))[0][1];
    } else {
        return subjects[0].rating.average;//Return First one
    }


    var mostMatchSubject = subjects.find(function (subject) {
        return subject.original_title == mostMatchName;
    });
    console.log(mostMatchName);
    if (mostMatchSubject.rating.average) {
        return mostMatchSubject.rating.average;
    } else {//No Rating
        return null;
    }
}


module.exports = router;

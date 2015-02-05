var express = require('express');
require('fuzzyset.js');
var router = express.Router();
var settings = require('../settings.json');
var schedule = require('node-schedule');
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

//Cron Job to update every one min
var j = schedule.scheduleJob('*/1 * * * *', function(){
    console.log('The answer to life, the universe, and everything!');
    updateMovies();
});

function updateMovies() {
    var collection = db.get(collectionName);
    collection.findOne({rating: {$exists: false}}, {},
        function (e, doc) {
            doubanClient.getDoubanClient().then(function (client) {
                var searchKeyword = convertNameToSearchTerm(doc.name);
                if (settings.useMock) {
                    var rating = processSearchResults(mockdbcollection.getDoubanMock().subjects, searchKeyword);
                    doc.rating = rating;
                    collection.update({_id: doc._id},
                        { $set: doc },
                        { upsert: false }).then(function () {
                            console.log('Set ' + doc.name + ' to ' + doc.rating);
                        });

                } else {
                    var searchEvent = client.movie.search(searchKeyword.englishName);
                    searchEvent.on('data', function (err, data) {
                        data = JSON.parse(data);
                        if (!err) {
                            if (data.subjects) {
                                var rating = processSearchResults(data.subjects, searchKeyword);
                                doc.rating = rating;
                                collection.update({_id: doc._id},
                                    { $set: doc },
                                    { upsert: false }).then(function () {
                                        console.log('Set ' + doc.name + ' to ' + doc.rating);
                                    });
                            }
                        }
                    });
                }
            });
        });
};


function convertNameToSearchTerm(name) {
    var chineseName = name.replace(/[^\u4e00-\u9fa5]/gmi, '').replace(/\s+/g, " ");
    var englishName = name.replace(/[^a-z0-9]/gmi, " ")
        .replace("2014", '').replace("1080p", '').replace("BluRay", '')
        .replace("WEBRip", '').replace("2013", '').replace("720p", '').replace("WEB", '')
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

    var mostMatchName = null;
    if ((nameFuzzySet.get(searchKeyword.englishName))) {
        mostMatchName = (nameFuzzySet.get(searchKeyword.englishName))[0][1];
    } else {
        if (subjects[0].rating){
            return subjects[0].rating.average;//Return First one
        } else {
            return '0';
        }

    }

    var mostMatchSubject = subjects.find(function (subject) {
        return subject.original_title == mostMatchName;
    });

    if (mostMatchSubject.rating.average) {
        return mostMatchSubject.rating.average;
    } else {//No Rating
        return '0';
    }
}


module.exports = router;

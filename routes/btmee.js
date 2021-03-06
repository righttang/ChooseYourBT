var mockdbcollection = require("../models/mockdbcollection.js");
var doubanClient = require("../douban/doubanClient.js")

var express = require('express');
var YQL = require('yqlp');
var mongo = require('mongodb');
var monk = require('monk');
var settings = require('../settings.json');
var db = monk('localhost:27017/ChooseYourBT');
var collectionName = 'movie';

var router = express.Router();


router.get('/', function (req, res, next) {
    fetchBTmeeData();
    res.json({Message: "Hello World btmee"});
});

router.get('/help', function (req, res, next) {
    res.send('help');
});

//https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20data.html.cssselect%20WHERE%20url%3D'http%3A%2F%2Fbtmee.net%2F'%20AND%20css%3D'tr'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys


function fetchBTmeeData() {
    //Retrive results from mock;
    var collection = db.get(collectionName);
    if (settings.useMock) {
        var catResults = filterMagTitle(mockdbcollection.getBTmeeMock().results);
        updateDB(catResults, collection);
    } else {
        YQL.execp("select * from html where url='http://btmee.net/movie' AND compat='html5' AND xpath='//tr'")
            .then(function (response) {
                var results = response.query.results;
                console.log(JSON.stringify(results));
                var catResults = filterMagTitle(results);
                updateDB(catResults, collection);
            }, function (error) {
                console.log('Ut oh! Example #3 has messed up:', error);
            });
    }

}

//Filter raw YQL response to each mag Title exists result.
function filterMagTitle(loadedResults) {
    if (loadedResults.tr && loadedResults.tr.constructor === Array) {
        return loadedResults.tr.filter(function (el) {
            for (var i = 0; i < el.td.length; i++) {
                if (el.td[i] && el.td[i].class && el.td[i].class == 'name magTitle') {
                    return true;
                }
            }
            return false;
        });
    } else {
        return null;
    }
};

//Insert all data into DB
function updateDB(catResults, collection) {
    for (var tdIndex = 0; tdIndex < catResults.length; tdIndex++) {
        var doc = {
            cat: "",
            name: "",
            magDown: "",
            ed2kNone: ""
        };
        var catElement = catResults[tdIndex].td.find(function (el) {
            return el.class == 'cat';
        });
        doc.cat = catElement.a.content;

        var nameElement = catResults[tdIndex].td.find(function (el) {
            return el.class == 'name magTitle';
        });
        doc.name = nameElement.a.content;

        var downElement = catResults[tdIndex].td.find(function (el) {
            return el.class == 'dow';
        });
        doc.magDown = downElement.a[1].href;
        doc.ed2k = downElement.a[2].ed2k;
        console.log(JSON.stringify(doc));
        collection.update(
            {name: doc.name}, //Name equal
            {
                $set: doc
            },
            { upsert: true }
        );

//        collection.remove(
//            {name: doc.name},
//            {
//                justOne: true
//            }
//        )

    }
}


module.exports = router;

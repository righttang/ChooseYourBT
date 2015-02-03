var express = require('express');
var YQL = require('yqlp');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {

    var db = req.db;
    var collection = db.get('usercollection');

    //Retrive results from database;
    collection.find({ results: { $exists: true } }, {},
        function (e, doc) {
            var catResults = filterMagTitle(doc[0].results);
            console.log(catResults.length);
            updateDB(catResults, collection);
            res.json(catResults);

        });

//    var results = {"Title": "BTMEEE"};
//    YQL.execp("SELECT * FROM data.html.cssselect WHERE url='http://btmee.net/' AND css='tr'")
//        .then(function (response) {
//            var results = response.query.results;
//            var catResults = filterMagTitle(results.results);
//            console.log(catResults.length);
//            res.json(filterMagTitle(results.results));
//        }, function (error) {
//            console.log('Ut oh! Example #3 has messed up:', error);
//        });
});

//https://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20data.html.cssselect%20WHERE%20url%3D'http%3A%2F%2Fbtmee.net%2F'%20AND%20css%3D'tr'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys

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
        doc.ed2kNone = downElement.a[2].href;
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

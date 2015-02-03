var express = require('express');
var YQL = require('yqlp');
var router = express.Router();
var DoubanClient = require('douban-client');


API_KEY = '08c8a7a3a2be10791a59f6eae83a316b';
API_SECRET = 'd72371280aaebcff';
SCOPE = 'movie_basic,movie_basic_r,movie_basic_w';
your_redirect_uri = 'http://localhost:3000/';
doubanToken = { access_token: '74a6150775b5eedd5df23f166121cc97',
    douban_user_name: 'TT',
    douban_user_id: '120997005',
    expires_in: 604800,
    refresh_token: '52a48c5adc17ee6cf7eda5109447cb44' };

var client = new DoubanClient(API_KEY, API_SECRET, your_redirect_uri, SCOPE);

process.stdout.write('Go to the following link in your browser:\n');
process.stdout.write(client.authorize_url() + '\n');
process.stdout.write('Enter the verification code:\n');

code = '1a0b45e2ad790aa3';


/*client.auth_with_code(code, function (err, doubanToken) {
 console.log('this is your ' + doubanToken);
 var event = client.movie.get('1297192');
 event.on('data', function(err, data){
 console.log(data);
 if(!err){
 console.log(data);
 }
 });
 });*/

client.loadFromDoubanToken(doubanToken);
var event = client.movie.search('采访.The.Interview.2014');
event.on('data', function (err, data) {
    if (!err) {
        console.log(data);
    }
});


router.get('/', function (req, res, next) {

    var db = req.db;
    var collection = db.get('usercollection');

    //Retrive results from database;
    if (false) {
        collection.find({ results: { $exists: true } }, {},
            function (e, doc) {
                console.log(e);
                var catResults = filterMagTitle(doc[0].results);
                updateDB(catResults, collection);
            });
    }

    YQL.execp("SELECT * FROM data.html.cssselect WHERE url='http://btmee.net/1080p' AND css='tr'")
        .then(function (response) {
            var results = response.query.results;
            var catResults = filterMagTitle(results.results);
            updateDB(catResults, collection);
        }, function (error) {
            console.log('Ut oh! Example #3 has messed up:', error);
        });
    douClient

    res.json({Message: "Hello World"});
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

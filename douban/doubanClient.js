/**
 * Created by tangh2 on 04/02/2015.
 */
var DoubanClient = require('douban-client');

//Database Connection
var mongo = require('mongodb');
var monk = require('monk');
var q = require('q');
var db = monk('localhost:27017/ChooseYourBT');
var configCollection = 'config';
var settings = require('../settings.json');

API_KEY = '08c8a7a3a2be10791a59f6eae83a316b';
API_SECRET = 'd72371280aaebcff';
SCOPE = 'movie_basic,movie_basic_r,movie_basic_w';
your_redirect_uri = 'http://localhost:3000/douban';

/*doubanToken = { access_token: '74a6150775b5eedd5df23f166121cc97',
 douban_user_name: 'TT',
 douban_user_id: '120997005',
 expires_in: 604800,
 refresh_token: '52a48c5adc17ee6cf7eda5109447cb44' };
 storeDoubanToken();*/

//Get the Douban Client
exports.getDoubanClient = function (code) {
    var deferred = q.defer();
    var client = new DoubanClient(API_KEY, API_SECRET, your_redirect_uri, SCOPE);
    if (code) {
        client.auth_with_code(code, function (err, doubanToken) {
            if (doubanToken.access_token) {
                storeDoubanToken(doubanToken);
                deferred.resolve(client);
            } else {
                deferred.reject(client);
            }

        });
    }
    getDoubanTokenFromDB().then(function (doubanToken) {
        client.loadFromDoubanToken(doubanToken);
        deferred.resolve(client);
    }, function () {
        process.stdout.write(client.authorize_url() + '\n');
        deferred.reject(client);
    });

    return deferred.promise;
};

function getDoubanTokenFromDB() {
    var deferred = q.defer();
    var collection = db.get(configCollection);
    collection.find({ douban_user_name: { $exists: true } }, {},
        function (e, doc) {
            if (doc[0]) {
                deferred.resolve(doc[0]);
            } else {
                deferred.reject(null);
            }
        });
    return deferred.promise;
}

function storeDoubanToken(doubanToken) {
    var collection = db.get(configCollection);
    var promise = collection.update(
        {douban_user_name: {$exists: true}},
        {$set: doubanToken},
        {upsert: true}
    );
}














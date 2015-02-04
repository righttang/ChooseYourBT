/**
 * Created by tangh2 on 04/02/2015.
 */
var DoubanClient = require('douban-client');

//Database Connection
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/ChooseYourBT');
var collectionName = 'config';

API_KEY = '08c8a7a3a2be10791a59f6eae83a316b';
API_SECRET = 'd72371280aaebcff';
SCOPE = 'movie_basic,movie_basic_r,movie_basic_w';
your_redirect_uri = 'http://localhost:3000/';

/*doubanToken = { access_token: '74a6150775b5eedd5df23f166121cc97',
    douban_user_name: 'TT',
    douban_user_id: '120997005',
    expires_in: 604800,
    refresh_token: '52a48c5adc17ee6cf7eda5109447cb44' };*/

//Get the Douban Client
exports.getDoubanClient = function () {
    var client = new DoubanClient(API_KEY, API_SECRET, your_redirect_uri, SCOPE);
    if (getDoubanTokenFromDB()) {
        client.loadFromDoubanToken(doubanToken);
        var event = client.movie.search('采访.The.Interview.2014');
        event.on('data', function (err, data) {
            if (!err) {
                console.log(data);
            } else {
                console.log(err);
            }
        });
        return client;
    } else {
        process.stdout.write(client.authorize_url() + '\n');
        code = '1a0b45e2ad790aa3';
        client.auth_with_code(code, function (err, doubanToken) {
            console.log('this is your ' + doubanToken);
            var event = client.movie.get('1297192');
            event.on('data', function (err, data) {
                console.log(data);
                if (!err) {
                    console.log(data);
                }
            });
        });
    }
};

function getDoubanTokenFromDB() {
    var collection = db.get(collectionName);
    collection.find({ douban_user_name: { $exists: true } }, {},
        function (e, doc) {
            if (doc[0]) {
                return doc[0];
            } else {
                return null;
            }
        });
    /*    var promise = collection.update(
     {douban_user_name: {$exists: true}},
     {$set: doubanToken},
     {upsert: true}
     );*/
}














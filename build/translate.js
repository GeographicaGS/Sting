var fs = require('fs'),
    pg = require('pg'),  
    config = require("./config.js").config,
    langs = config.langs,  
    conString = "mongodb://" + config.database.user + ":" + config.database.password + "@localhost:" + config.database.port + "/" +config.database.db,
    utils = require("./utils.js");
    mongoose = require('mongoose');
    translation = null;

function getLangTags(s){
    var matches =  s.match( /<lang>(.*?)<\/lang>/g);
    if (matches) {
        return matches.map(function(val){
            return val.replace(/<\/?lang>/g,'');
        });
    }
    else{
        return [];    
    }
    
}

function replaceLangString(str,origin,target){
    origin = origin.replace("(","\\(");
    origin = origin.replace(")","\\)");
    var regex = new RegExp("<lang>"+ origin + "<\\/lang>","g");
    return str.replace(regex,target);
}

// function executeQuery(sql,callback) {
//     var mongoose = require('mongoose');
//     mongoose.connect(conString);
//     var db = mongoose.connection;
//     db.on('error', console.error.bind(console, 'connection error:'));
//     db.once('open', function callback () {

//         var auxLangs = {
//             key: String
//         };
//         for(var i=0; i<langs.length;i++){
//             auxLangs[langs[i]] = String;
//         }
//         var translationSchema = mongoose.Schema(auxLangs,{ collection: 'translation' });

//         var translation = mongoose.model('translation', translationSchema);
//         var trans = new translation({ key: 'prueba', es:'pruebaEs', en:'pruebaEn' });
//         translation.findOne({'key': 'prueba'}, function (err, element) {
//               if(!element){
//                 trans.save(function(err, thor) {
//                     mongoose.connection.close();
//                     return;
//                 });
//               }else{
//                 mongoose.connection.close();
//               }

//         });
//     });
// }

exports.translate = function(deps,callback,debug){
    var tmp = utils.getTmpFolder(),
        templates = fs.readFileSync(tmp+"/main-template-src.html", 'utf8'),
        templatesKeys = getLangTags(templates),
        
        js = fs.readFileSync(tmp+"/main.js", 'utf8'),
        jsKeys = getLangTags(js),

        index = fs.readFileSync(deps.templateFolder + "/index.html", 'utf8'),
        indexKeys = getLangTags(index),
        
        allKeys = templatesKeys.concat(jsKeys).concat(indexKeys);

        
    function getDBKeys(callback){       
        mongoose.connect(conString);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {

            var auxLangs = {
                key: String
            };
            for(var i=0; i<langs.length;i++){
                auxLangs[langs[i]] = String;
            }
            var translationSchema = mongoose.Schema(auxLangs,{ collection: 'translation' });

            translation = mongoose.model('translation', translationSchema);
            translation.find({}, function (err, trans) {
                var dbKeys = {};
                for(var i=0; i<trans.length; i++){
                    dbKeys[trans[i].key] = {}
                    for (l in langs){
                        dbKeys[trans[i].key][langs[l]] = trans[i][langs[l]];
                    }
                }
                mongoose.connection.close();
                callback(dbKeys);
            });
        });

    }
    
    function insertMissingKeys(dbKeys,callback){
        // // check if the current keys are in the database. If not, we insert it        
        var keysToInsert = [];
        for (i in allKeys)
        {
            var k = allKeys[i];
            // Does the key exist? Is the key already in the array?
            if( (!k || !dbKeys.hasOwnProperty(k))
                && (keysToInsert.indexOf(k) ==-1)) {
                keysToInsert.push(k);
            }
        }
        
        if (keysToInsert.length>0) {
            mongoose.connect(conString);
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function() {
                var auxLangs = {
                    key: String
                };
                for(var i=0; i<langs.length;i++){
                    auxLangs[langs[i]] = null;
                }
                var cont = keysToInsert.length;
                for (i in keysToInsert){
                    auxLangs["key"] = keysToInsert[i];
                    trans = new translation(auxLangs);
                    trans.save(function(err, thor) {
                        cont -- ;
                        if(cont == 0){
                            mongoose.connection.close();
                            callback();
                        }
                        return;
                    });
                }
                
            });
        }else{
            callback();
        }
    }
    
    
    function applyTranslations(dbKeys){
        // Create translations dictionary
        dict = {};
        for (i in allKeys)
        {
            var k = allKeys[i];
            dict[k] = {};
            // Does the key exist?
            if (!k || !dbKeys.hasOwnProperty(k) ) {
                // key missing
                for (l in langs){
                    dict[k][langs[l]] = k;
                }
            }
            else{
                // key exist                
                for (l in langs){
                    if (dbKeys[k][langs[l]]) {
                        dict[k][langs[l]] = dbKeys[k][langs[l]];
                    }
                    else{
                        dict[k][langs[l]] = k;
                    }
                }
            }
        }
        
        // Here we've the dictonary created. Let's replace strings
        // Translations for template in all languages
        var template_translations = {};
        // Translations for template in all languages
        var js_translations = {};
        // Translations for index.html in all languages
        var index_translations = {};
        
        for (l in langs){
            lng = langs[l];
            template_translations[lng] = templates;
            js_translations[lng] = js;
            index_translations[lng] = index;
        }
            
        for (k in dict){
            for (l in langs){
                lng = langs[l];
                template_translations[lng] = replaceLangString(template_translations[lng],k,dict[k][lng]);
                js_translations[lng] = replaceLangString(js_translations[lng],k,dict[k][lng]);
                index_translations[lng] = replaceLangString(index_translations[lng],k,dict[k][lng]);
            }
        }
        
        for (l in langs){
            lng = langs[l];
            var name = tmp + "/template-"+lng + ".html";
            fs.writeFileSync(name, template_translations[lng]);
            console.log("\tSaved "+ name);
            
            name = tmp + "/main-"+lng + ".min.js";
            fs.writeFileSync(name, js_translations[lng]);
            console.log("\tSaved "+ name);
            
            var name = tmp + "/index-"+lng + ".html";
            fs.writeFileSync(name, index_translations[lng]);
            console.log("\tSaved "+ name);
        }
        
        
        // Now we've the template file and the js file translated. Let's write it to temp folder.
        callback();
        
    }
    
    // get db keys
    getDBKeys(function(dbKeys){
        // Insert missing keys in database
        insertMissingKeys(dbKeys,function(){
            applyTranslations(dbKeys);
        });
    });    
    
}
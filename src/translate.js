
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

function removeDuplicates(haystack){
    return haystack.filter(function(elem, pos) {
        return haystack.indexOf(elem) == pos;
    });
}

module.exports = function(i18n){
    
    var module = {};

    module.translate = function(s,lang){
        
        i18n.setLocale(lang);

        matches = removeDuplicates(getLangTags(s));
        for (var i=0;i<matches.length;i++){
            s = replaceLangString(s,matches[i],i18n.__(matches[i]));
        }
        return s;
    }

    return module;
}
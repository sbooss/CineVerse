(function() {
    var dead = function() { return null; };
    try {
        window.open = dead;
        Object.defineProperty(window, 'open', { value: dead, writable: false, configurable: false });
    } catch (e) {}

    var AD = ['onclickperformance', 'acscdn', 'aclib', 'popads', 'clickadu', 'propellerads',
        'adsterra', 'exoclick', 'hilltopads', 'monetag', 'evadav', 'richpush', 'popcash',
        'poptm', 'al5sm', 'llvpn', 'cdnfacebook', 'sdkstream', 'waust', 'ad-maven',
        'pushprofit', 'notifpush', 'pushame', 'doubleclick', 'googlesyndication',
        'casino', 'one-vv', 'asiafilm', 'dtscout', 'crwdcntrl', 'vidoomy', 'smashy-ads',
        'tadsdk', 'highperformance', 'popunder', 'trafficjunky', 'juicyads'];
    function isAd(u) {
        if (!u) return false;
        u = ('' + u).toLowerCase();
        for (var i = 0; i < AD.length; i++) { if (u.indexOf(AD[i]) !== -1) return true; }
        return false;
    }

    var origAssign, origReplace;
    try {
        origAssign = window.location.assign;
        origReplace = window.location.replace;
        window.location.assign = function(u) { if (!isAd(u)) return origAssign.call(window.location, u); };
        window.location.replace = function(u) { if (!isAd(u)) return origReplace.call(window.location, u); };
    } catch (e) {}

    document.addEventListener('click', function(e) {
        var t = e.target;
        var a = t && (t.tagName === 'A' ? t : (t.closest ? t.closest('a') : null));
        if (a && isAd(a.href)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    document.addEventListener('auxclick', function(e) {
        if (e.button === 1) { e.preventDefault(); return false; }
    }, true);

    window.addEventListener('message', function(e) {
        var d = e.data;
        if (typeof d === 'string') {
            var l = d.toLowerCase();
            if (l.indexOf('popunder') !== -1 || l.indexOf('acscdn') !== -1 || l.indexOf('aclib') !== -1 || l.indexOf('onclickperformance') !== -1) {
                e.stopImmediatePropagation();
                return false;
            }
        }
    }, true);
})();

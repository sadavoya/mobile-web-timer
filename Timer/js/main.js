/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />
/// <reference path="beo_category.js" />

$(document).ready(function () {
    var ns = window.myApp,
        db = ns.timer.createDatabase();

    //$('#settings form').submit(saveSettings);
    $('#create_category form').submit(ns.beo_category.create_category);
    $('#create_timerset form').submit(ns.beo_timerset.create_timerset);
    $('#categories').bind('pageAnimationStart',
        window.myApp.util.doIf(function (e, o) {
            return o.direction === 'in';
        },
        ns.beo_category.refresh_category_list));
    $('#timersets').bind('pageAnimationStart',
        window.myApp.util.doIf(function (e, o) {
            return o.direction === 'in';
        },
        ns.beo_timerset.refresh_timerset_list));
    //$('#settings').bind('pageAnimationStart', loadSettings);
    //$('#dates li a').bind('click touchend', setDate);
    //loadSettings();

});
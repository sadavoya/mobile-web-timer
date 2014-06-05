/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />
/// <reference path="beo_category.js" />
/// <reference path="beo_timer.js" />
/// <reference path="beo_timerset.js" />
/// <reference path="ui_active_timer.js" />


$(document).ready(function () {
    var ns = window.myApp,
        db = ns.timer.createDatabase(),
        main_timer = ns.timer.main_timer();

    main_timer.start();
    
    //$('#settings form').submit(saveSettings);
    $('#create_category form').submit(ns.beo_category.create_category);
    $('#create_timerset form').submit(ns.beo_timerset.create_timerset);
    //$('#create_timerset').bind('pageAnimationStart',
    //window.myApp.util.doIf(function (e, o) {
    //    return o.direction === 'in';
    //},
    //ns.beo_timerset.update_form_lists));
    $('#create_timer form').submit(ns.beo_timer.create_timer);

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

    $('#timers').bind('pageAnimationStart',
        window.myApp.util.doIf(function (e, o) {
            return o.direction === 'in';
        },
        ns.beo_timer.refresh_timer_list));


    //$('#home').bind('pageAnimationStart',
    //    window.myApp.util.doIf(function (e, o) {
    //        return o.direction === 'in';
    //    },
    //    ns.ui_active_timer.refresh_active_timer_list));

    //$('#settings').bind('pageAnimationStart', loadSettings);
    //$('#dates li a').bind('click touchend', setDate);
    //loadSettings();

    // run these once initially to set up selection lists
    ns.beo_timer.update_category_list();
    ns.beo_timer.update_timerset_list();
    ns.beo_timerset.update_timer_list();
});
/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />

(function () {
    var my_ns = 'ui_active_timer';
    // Only run once
    if (window.myApp[my_ns]) {
        return;
    }
    var ns = window.myApp,
        jQT,
        db = ns.timer.createDatabase();
    if (!window.myApp.jQT) {
        window.myApp.jQT = $.jQTouch({
            icon: 'kilo.png',
            useAnimations: true
        });
    }
    jQT = window.myApp.jQT;


    var table = 'timer',
        id_field = ('oid_' + table),
        fields = {
            timerset: {
                name: 'timerset.name',
                id: 'oid_timerset'
            },
            category: {
                name: 'category.name',
                id: 'oid_category'
            },
            timer: {
                name: 'name',
                description: 'description',
                enabled: 'enabled',
                duration_name: 'duration',
                duration: {
                    hours: 'duration_hours',
                    minutes: 'duration_minutes',
                    seconds: 'duration_seconds'
                },
                snooze_name: 'snooze',
                snooze: {
                    hours: 'snooze_hours',
                    minutes: 'snooze_minutes',
                    seconds: 'snooze_seconds'
                },
                category: 'category',
                foid_category: 'foid_category'
            }
        },
        template = {
            count: 2, // The number of li template elements
            id: '#ui_active_timer_timerset_template', // The selector of the entire template
            timerset: {
                ul: 'ul.timerset', // The selector of the timerset UL
                header: 'li.timerset_header', // The selector of the timerset header
                detail: 'li.timerset_detail', // The selector of the timerset detail
                category: {
                    ul: 'ul.category', // The selector of the category UL
                    header: 'li.category_header', // The selector of the category header
                    detail: 'li.category_detail', // The selector of the category detail
                    timer: {
                        ul: 'ul.timer', // The selector of the timer UL
                        detail: 'li.timer_detail', // The selector of the timer detail
                        parts: {
                            name: 'span.name', // The selector of the timer row's 'name' part
                            countdown: 'span.countdown', // The selector of the timer row's 'countdown' part
                            willGoOffAt: 'span.willGoOffAt', // The selector of the timer row's 'willGoOffAt' part
                        },
                    },
                },
            },
        },
        get_row_template = (function () {
            function get_row_template(selector, parent) {
                if (parent) {
                    return parent.find(selector);
                }
                return $(selector);
            }
            return get_row_template;
        })(),
        listName = 'home',
        timersetcoll;

    // Local code
    
    

    // Refresh the UI list of timersets
    var refresh_active_timer_list = (function () {
        function refresh_active_timer_list() {
            // Retrieves the data for enabled timersets
            var refreshFromDB = (function () {
                function refreshFromDB(listName, processRecords) {
                    var handler = ns.timer.errorHandler.curry('refreshList (ui_active_timer)'),
                        sql = "SELECT timer.*, " +
                            " category.oid_category, category.name, timerset.oid_timerset, timerset.name " +
                            " FROM category INNER JOIN timer ON timer.foid_category = category.oid_category " +
                            " INNER JOIN timer_timerset ON timer.oid_timer = timer_timerset.foid_timer " +
                            " INNER JOIN timerset ON timerset.oid_timerset = timer_timerset.foid_timerset " +
                            " WHERE timerset.enabled = 'true' " +
                            " AND timer.enabled = 'true' " +
                            " ORDER BY timerset.name, category.name, timer.name";
                    
                    db.transaction(function (transaction) {
                        transaction.executeSql(sql, null, processRecords, handler);
                    });
                }
                return refreshFromDB;
            })();
            // Builds the in-memory data structure from the database data
            var build_timersets = (function () {
                function build_timersets() {
                    var timersets;
                    refreshFromDB(listName, function (transaction, records) {
                        var datarow,
                            timerset,
                            category,
                            id_timerset,
                            id_category;

                        timersets = {
                            keys: [],
                            values: {}
                        };
                        for (i = 0; i < records.rows.length; i += 1) {
                            (function () {
                                datarow = records.rows.item(i);

                                id_timerset = datarow[fields.timerset.id];
                                if (!timersets[id_timerset]) {
                                    timerset = {
                                        id: id_timerset,
                                        name: datarow[fields.timerset.name],
                                        name: datarow[fields.timerset.name],
                                        categories: {
                                            keys: [],
                                            values: {}
                                        }
                                    };
                                    timersets.values[id_timerset] = timerset;
                                    timersets.keys.push(id_timerset);
                                }
                                timerset = timersets[id_timerset];

                                id_category = datarow[fields.category.id];
                                if (!timerset.categories[id_category]) {
                                    category = {
                                        id: id_category,
                                        name: datarow[fields.category.name],
                                        timers: {
                                            keys: [],
                                            values: {}
                                        }
                                    };
                                    timerset.categories.values[id_category] = category;
                                    timerset.categories.keys.push(id_category);
                                }
                                category = timerset.categories[id_category];

                                timer = {
                                    id: datarow[fields.timer.id],
                                    name: datarow[fields.timer.name],
                                    enabled: datarow[fields.timer.enabled],
                                    duration: {
                                        hours: datarow[fields.timer.duration.hours],
                                        minutes: datarow[fields.timer.duration.minutes],
                                        seconds: datarow[fields.timer.duration.seconds],
                                    },
                                    snooze: {
                                        hours: datarow[fields.timer.snooze.hours],
                                        minutes: datarow[fields.timer.snooze.minutes],
                                        seconds: datarow[fields.timer.snooze.seconds],
                                    },
                                    d8_start: (new Date()).valueOf(),
                                    started: false,
                                };
                                category.timers.keys.push(timer.id);
                                category.timers.values[timer.id] = timer;
                            })();
                        }
                    });
                    return timersets;
                }
                return build_timersets;
            })();
            // Function to construct each row from its template
            var build_list_row = (function () {
                function build_list_row(element_to_clone, parent_list,
                    header_selector, header_text, detail_selector, customize) {
                    var row, row_detail;
                    row = element_to_clone.clone();
                    row.removeAttr('id');
                    row.removeClass('template');
                    row.appendTo(parent_list);
                    row.find(header_selector).text(header_text);
                    if (detail_selector) {
                        row_detail = row.find(detail_selector);
                        row.click(row_detail.slideToggle);
                    }
                    if (customize) {
                        customize(row);
                    }
                    return row_detail;
                }
                return build_list_row;
            })();
            

            var make_timer_row = (function () {
                function make_timer_row(timer, row) {
                    var countdown = row.find('.countdown'),
                        willGoOffAt = row.find('.willGoOffAt'),
                        reset = row.find('.reset'),
                        toggle = row.find('.toggle');

                    reset.click(function () {
                        timer.d8_start = new Date().valueOf();
                    });
                    toggle.click(function () {
                        timer.start = !timer.start;
                    });
                    
                    var time_string = (function () {
                        function time_string(d8) {
                            return ('' + d8);
                        }
                        return time_string;
                    })();

                    var add_to_date = (function () {
                        function add_to_date(d8, o) {
                            return new Date(d8.getYear() + o.years,
                                d8.getMonth() + o.months,
                                d8.getDay() + o.days,
                                d8.getHours() + o.hours,
                                d8.getMinutes() + o.minutes,
                                d8.getSeconds() + o.seconds,
                                d8.getMilliseconds() + o.milliseconds);
                        }
                        return add_to_date;
                    })();

                    timer.update_function = function () {
                        if (timer.start && row.is(':visible')) {
                            var d8 = new Date().valueOf(),
                                diff = new Date(d8 - d8_start),
                                hourDiff = diff.getHours(),
                                minDiff = diff.getMinutes(),
                                secDiff = diff.getSeconds();
                            countdown.text('' + diff.getHours() + ':' + diff.getMinutes() + ':' + diff.getSeconds());
                            willGoOffAt.text(add_to_date);
                        }
                    };
                }
                return make_timer_row;
            })();

            (function build_list_rows() {
                var i, j, k,
                    timerset_element_to_clone = $('#ui_active_timer_timerset_template'),
                    timerset_parent_list = $('home ul.activeTimer'),
                    timerset_detail,
                    category_detail;

                // Build the data struture
                timersetcoll = build_timersets();
                
                // Remove any existing non-template rows
                $('#' + listName + ' ul li:gt(' + (template.count - 1) + ')').remove();
                
                // Loop through the timersets...
                for (i = 0; i < timersetcoll.keys.length; i++) {
                    // ...and create a new row for each one
                    timerset = timersetcoll.values[timersetcoll.keys[i]];
                    timerset_detail = build_list_row(timerset_element_to_clone, timerset_parent_list,
                        '.timerset_header', timerset.name, 'ul.timerset_detail', null);
                    
                    // Loop through the categories in the timerset...
                    for (j = 0; j < timerset.categories.keys.length; j++) {
                        // ...and create a new row for each one
                        category = timerset.categories.values[timerset.categories.keys[j]];
                        category_detail = build_list_row(timerset_detail.find('.category'), timerset_detail,
                            '.category_header', category.name, 'ul.category_detail', null);
                        
                        // Loop through the timers in the category...
                        for (k = 0; k < category.timers.keys.length; k++) {
                            // ...and create a new row for each one
                            timer = category.timers.values[category.timers.keys[i]];
                            build_list_row(timerset_detail.find('.timer'), timerset_detail,
                                '.name', timer.name, null, make_timer_row.curry(timer));
                        }
                    }
                }
            })();
        }
        return refresh_active_timer_list;
    })();



    // Update the namespace with public methods
    (function () {
        //ns.add('edit_timer', edit_timer, my_ns);
        ns.add('refresh_active_timer_list', refresh_active_timer_list, my_ns);
    })();

})();
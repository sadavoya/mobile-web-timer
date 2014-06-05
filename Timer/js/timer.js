/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />

(function () {
    //TODO: Alarms go off every time period, without intervention
    //TODO: Each alarm needs to include one or more time periods that it is enabled
    //TODO: Include an elapsed count - the number of times the timer has elapsed since it was started i.e. (current time - start time) / timer duration
    //TODO: Reminders to change position
    //TODO: Snooze
    //TODO: Timers need to be colored for at-a-glance identification
    //TODO: Timers should continue to count passed 0, with some indication that the time has elapsed
    //TODO: Vacation option to disable the whole thing
    // Use cases: Only a "User". No other roles
    //      User starts app. App displays list of active timers for the current time. 
    //      User starts app, adds a new timer that will go off every 30 minutes
    //      User opens a timer, specifies that the timer should only apply from 9AM to 5PM, Monday to Friday
    //      User starts app, goes to enable page. Selects "Buff", "Dmg Shield" and "Respawn", then clicks Ok.
    //              Screen flips to active timers, with Buff, Dmg Shield and Respawn each counting down.
    //              User taps Respawn and is taken to the Respawn timer editor
    //              User taps "copy" to make a new timer based on the Respawn timer; screen flips to the new timer
    //              User renames the new timer from "New Timer" to "Respawn - second room", and updates the duration to 7 minutes
    //              User saves
    // Datamodel
    // Timer table contains:
    //      OIdTimer
    //      Name
    //      Description
    //      SnoozeDuration
    //      FOIdColour
    //      Repetitions (0 = unlimited)
    //      FOIdReminderType - flash or modal popup (more complex? allow different time frames for different types? maybe v2)
    //
    //  Repetition table:
    //      OIdRepetition
    //      
    //  Colour table: need to store as RGBA because hex values don't include "A".
    //      OIdColour
    //      Name - optional
    //      R
    //      G
    //      B
    //      A
    //          TODO: Need a function to convert to/from hex
    var my_ns = 'timer';
    // Only run once
    if (window.myApp[my_ns]) {
        return;
    }

    var ns = window.myApp,
        jQT,
        db;
    if (!window.myApp.jQT) {
        window.myApp.jQT = $.jQTouch({
            icon: 'kilo.png',
            useAnimations: true
        });
    }
    jQT = window.myApp.jQT;
    

    var errorHandler = (function () {
        function errorHandler(errorSource, transaction, error) {
            var name_element = $('');

            alert('Error in ' + errorSource + '. Error was ' + error.message + ' (Code: ' + error.code + ')');
            return true;
        }
        return errorHandler;
    })();

    function save(target, name, valToSave) {
        var val = valToSave;
        if (!valToSave) {
            val = $('#' + name).val();
        }
        if (!val || val === '') {
            target.removeItem(name);
        } else {
            target[name] = val;
        }
    }
    function load(target, name) {
        if (!target[name]) {
            target[name] = "";
        }
        if ($('#' + name)) {
            $('#' + name).val(target[name]);
        }
        return target[name];
    }


    function saveSession(name, value) {
        save(sessionStorage, name, value);
    }
    function loadSession(name) {
        return load(sessionStorage, name);
    }

    function loadSetting(setting) {
        load(localStorage, setting);
    }
    function saveSetting(setting) {
        save(localStorage, setting);
    }

    function loadSettings() {
        //loadSetting('age');
        //loadSetting('weight');
        //loadSetting('budget');
    }
    function saveSettings(e) {
        //saveSetting('age');
        //saveSetting('weight');
        //saveSetting('budget');

        jQT.goBack();
        e.preventDefault();
    }

    var deleteById = (function () {
        function deleteById(table, canDeleteId, id) {
            if (!canDeleteId || canDeleteId(id)) {
                db.transaction(
                    function (transaction) {
                        transaction.executeSql('DELETE FROM ' + table + ' WHERE oid_' + table + '=' + id + ';',
                            null,
                            null,
                            errorHandler.curry('DELETE ' + table + '(' + id + ')'));
                    });
            }
        }
        return deleteById;
    })();

    var editRecord = (function () {
        function editRecord(table, id_field, id_value, populate) {
            return function () {
                db.transaction(function (transaction) {                
                    transaction.executeSql('SELECT * FROM ' + table + ' WHERE ' + id_field + '=' + id_value, null,
                        function (transaction, records) {
                            var datarow;
                            if (records && records.rows && records.rows.item(0)) {
                                datarow = records.rows.item(0);
                                populate(datarow);                            
                            }
                        },
                        errorHandler.curry('refreshList (' + table + ')'));
                });
                jQT.goTo('#create_' + table, 'slideup');
            }
        }
        return editRecord;
    })();
    var refreshList = (function () {
        function refreshList(table, orderByField, listName, beforeRetrieve, processRecords, afterRetrieve) {
            var i,
                row;

            if (beforeRetrieve) {
                beforeRetrieve();
            }

            $('#' + listName + ' ul li:gt(0)').remove();

            db.transaction(function (transaction) {
                transaction.executeSql('SELECT * FROM ' + table + ' ORDER BY ' + orderByField, null,
                    processRecords,
                    errorHandler.curry('refreshList (' + table + ')'));
            });

            if (afterRetrieve) {
                afterRetrieve();
            }
        }
        return refreshList;
    })();

    var createDatabase = (function () {
        var shortName = 'Timers',
            version = '1.0',
            displayName = 'Timers',
            maxSize = 65536,
            db;
        function createDatabase() {
            if (db) {
                return db;
            }

            db = openDatabase(shortName, version, displayName, maxSize);

            db.transaction(
                function (transaction) {
                    transaction.executeSql(
                        'CREATE TABLE IF NOT EXISTS category ' +
                        ' (oid_category INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                        ' name TEXT NOT NULL, ' +
                        ' description TEXT NOT NULL );'
                        );
                    transaction.executeSql(
                        'CREATE TABLE IF NOT EXISTS timerset ' +
                        ' (oid_timerset INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                        ' name TEXT NOT NULL, ' +
                        ' description TEXT NOT NULL, ' +
                        ' enabled TEXT NOT NULL);'
                        );
                    transaction.executeSql(
                        'CREATE TABLE IF NOT EXISTS timer_timerset ' +
                        ' (oid_timer_timerset INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                        ' foid_timer INTEGER NOT NULL, ' +
                        ' foid_timerset INTEGER NOT NULL);'
                        );
                    transaction.executeSql(
                        'CREATE TABLE IF NOT EXISTS timer ' +
                        ' (oid_timer INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                        ' name TEXT NOT NULL, ' +
                        ' description TEXT NOT NULL, ' +
                        ' enabled BIT NOT NULL DEFAULT 1, ' +
                        ' duration_hours INTEGER NOT NULL DEFAULT 0, ' +
                        ' duration_minutes INTEGER NOT NULL DEFAULT 1, ' +
                        ' duration_seconds INTEGER NOT NULL DEFAULT 0, ' +
                        ' snooze_hours INTEGER NOT NULL DEFAULT 0, ' +
                        ' snooze_minutes INTEGER NOT NULL DEFAULT 1, ' +
                        ' snooze_seconds INTEGER NOT NULL DEFAULT 0, ' +
                        ' foid_category INTEGER NOT NULL );'
                        );
                });
            return db;
        }
        return createDatabase;
    })();
    var createRecord = (function () {
        function createRecord(table, getKey, getFieldNames, getFieldValues, refresh, e) {
            var key = getKey(),
                fieldNames = getFieldNames(e),
                fieldValues = getFieldValues(e),
                sql;

            if (key) {
                sql = (function getUpdate() {
                    var sql = '',
                        i;
                    for (i = 0; i < fieldNames.length; i++) {
                        if (sql.length > 0) {
                            sql += ', ';
                        }
                        sql += (fieldNames[i] + '=' + fieldValues[i]);
                    }
                    return ('UPDATE ' + table + ' SET ' + sql + ' WHERE ' + key.name + '=' + key.value);
                })();
            } else {
                sql = (function getInsert() {
                    return ('INSERT INTO ' + table + ' (' + fieldNames.join(', ') + ') VALUES (' + fieldValues.join(', ') + ');');
                })();
            }

            db.transaction(function (transaction) {
                transaction.executeSql(sql,
                    null,
                    function () {
                        var entity = $('#create_' + table);
                        refresh(jQT.goBack);
                    },
                    errorHandler.curry('create_' + table + '("' + [table].concat(fieldNames).concat(fieldValues) + '")'));
            });
            //e.preventDefault();
        }
        return createRecord;
    })();

    var update_select_list = (function () {
        function update_select_list(oid, name, table, order_by, select, error_source) {
            db.transaction(function (transaction) {
                transaction.executeSql('SELECT ' + oid + ', ' + name + ' FROM ' + table + ' ORDER BY ' + order_by, null,
                    function (transaction, records) {
                        var datarow, template, option_row;

                        select.find('option:gt(0)').remove();
                        template = select.find('option')

                        for (i = 0; i < records.rows.length; i += 1) {
                            datarow = records.rows.item(i);
                            option_row = template.clone();
                            option_row.removeAttr('id');
                            option_row.removeClass('template');
                            option_row.appendTo(select);

                            option_row.val(datarow[oid]);
                            option_row.text(datarow[name]);
                        }
                    },
                    ns.timer.errorHandler.curry(error_source));
            });
        }
        return update_select_list;
    })();


    // Returns an object that lets us control timed activities, including the clock
    var main_timer = (function () {
        var clock_click = function () {
            if (intervalId) {
                stop();
            } else {
                start();
            }
        };
        // Update the clock if possible
        var update_clock = (function () {
            var get_clock = function () { return $('#clock'); },
                clock,
                previous_time = '';
            function pad(time_part) {
                return ('' + time_part).pad('0', 2);
            }
            function fn() {
                var d8 = new Date(),
                    time = pad(d8.getHours()) + ':' + pad(d8.getMinutes()) + ':' + pad(d8.getSeconds());

                if (time === previous_time) {
                    return; // Don't bother updating
                }

                previous_time = time;

                // See if we have the clock object yet...
                if (!clock || clock.length === 0) {
                    // ...we don't have a clock object yet (probably wasn't loaded during previouc call), 
                    // so try and get it now.
                    clock = get_clock();
                    if (clock.length > 0) {
                        clock.click(clock_click);
                    }
                }

                // See if we have a *visible* clock object...
                if (clock &&
                    clock.is(':visible')) {
                    // We have the clock object, so update it.
                    clock.text(time);
                }
            }
            return fn;
        })();

        // In the main timer loop
        // 2. Check if we need to update the active timer list (i.e. is it visible?) - should only update it if it is visible
        var intervalId,
            timer_handler, // Empty by default, other code will update this;
            timer_event = function () {
                update_clock();
                if (timer_handler) {
                    timer_handler();
                }
            };
        function start () {
            intervalId = window.setInterval(timer_event, 500);
        };
        function stop() {
            window.clearInterval(intervalId);
            intervalId = null;
        }
        function set_handler(handler) {
            timer_handler = handler;
        }

        return {
            start: start,
            stop: stop,
            set_handler: set_handler,
        }
    });

    // Update the namespace with public methods
    (function () {
        db = createDatabase();
        ns.add('errorHandler', errorHandler, my_ns);
        ns.add('createRecord', createRecord, my_ns);
        ns.add('createDatabase', createDatabase, my_ns);
        ns.add('refreshList', refreshList, my_ns);
        ns.add('editRecord', editRecord, my_ns);
        ns.add('deleteById', deleteById, my_ns);
        ns.add('main_timer', main_timer, my_ns);
        ns.add('update_select_list', update_select_list, my_ns);
    })();
}());
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
    

    var jQT = $.jQTouch({
        icon: 'kilo.png',
        useAnimations: true
    }),
        db;

    function errorHandler(errorSource, transaction, error) {
        alert('Error in ' + errorSource + '. Error was ' + error.message + ' (Code: ' + error.code + ')');
        return true;
    }

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

    function deleteById(table, canDeleteId, id) {
        if (!canDeleteId || canDeleteId(id)) {
            db.transaction(
                function (transaction) {
                    transaction.executeSql('DELETE FROM ' + table + ' WHERE oid_' + table + '=' + id + ';', null,
                        null, errorHandler.curry('DELETE ' + table + '(' + id + ')'));
                });
        }
    }
    function editCategory(id_value) {
        var table = 'category',
            id_field = 'oid_' + table;
        function populate(datarow) {
            var name_element = $('#' + table + '_name');
            name_element.val(datarow.name);
            name_element.data(id_field, id_value);
            $('#' + table + '_description').val(datarow.description);
        }
        return editRecord(table, id_field, id_value, populate);
    }
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
    function refresh_category_list() {
        var table = 'category',
            orderByField = 'name',
            listName = 'categories';

        refreshList(table, orderByField, listName,
            null,
            function (transaction, records) {
                var datarow,
                    listrow,
                    id_field = 'oid_' + table;

                for (i = 0; i < records.rows.length; i += 1) {
                    datarow = records.rows.item(i);
                    listrow = $('#' + table + '_template').clone();
                    listrow.removeAttr('id');
                    listrow.removeClass('template');
                    listrow.data(id_field, datarow[id_field]);
                    listrow.appendTo('#' + listName + ' ul');

                    listrow.find('.edit').click(editCategory(datarow[id_field]));

                    listrow.find('.name').text(datarow.name);
                    listrow.find('.description').text(datarow.description);
                    listrow.find('.delete').click(function () {
                        var clicked = $(this).parent().parent(),
                            clicked_Id = clicked.data(id_field);
                        deleteById(table,
                            function (id) {
                                return true;
                            },
                            clicked_Id);
                        clicked.slideUp();
                    });
                }
            },
            null);
    }
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
    function refreshEntries(o) {
        var i,
            row,
            newEntryRow;

        // Set the date header
        $('#date h1').text(sessionStorage.currentDate);

        // Clear any existing rows (we are about to reload them)
        $('#date ul li:gt(0)').remove();
        function processEntries(transaction, result) {
            for (i = 0; i < result.rows.length; i += 1) {
                row = result.rows.item(i);
                newEntryRow = $('#entryTemplate').clone();
                newEntryRow.removeAttr('id');
                newEntryRow.removeAttr('style');
                newEntryRow.data('entryId', row.id);
                newEntryRow.appendTo('#date ul');
                newEntryRow.find('.label').text(row.food);
                newEntryRow.find('.calories').text(row.calories);
                newEntryRow.find('.delete').click(function () {
                    var clickedEntry = $(this).parent(),
                        clickedEntryId = clickedEntry.data('entryId');
                    deleteEntryById(clickedEntryId);
                    clickedEntry.slideUp();
                });
            }
        }

        db.transaction(function (transaction) {
            transaction.executeSql('SELECT * FROM entries WHERE date = ? ORDER BY food', [sessionStorage.currentDate],
                processEntries,
                errorHandler);
        });
    }

    function setDate() {
        // Get the id of the bound control
        var dayOffset = this.id,
            date = new Date(),
            month,
            currentDate;

        // Build the new date
        date.setDate(date.getDate() - dayOffset);
        month = date.getMonth() + 1;
        currentDate = month + '/' + date.getDate() + '/' + date.getFullYear();

        // Save the date in the session
        save(sessionStorage, 'currentDate', currentDate);

        refreshEntries();
        // Debug: show the date
        // $('#date').append('<div>' + load(sessionStorage, 'currentDate') + '</div>')
    }
    function createDatabase() {
        var shortName = 'Timers',
            version = '1.0',
            displayName = 'Timers',
            maxSize = 65536,
            db;
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
                    ' enabled INTEGER NOT NULL DEFAULT 1);'
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

    function create_category(e, o) {
        
        var table = 'category',
            id_field = 'oid_' + table,
            name_element = $('#' + table + '_name'),
            description_element = $('#' + table + '_description');
        try {
            createRecord(table,
                function () {
                    var id_value = name_element.data(id_field);
                    if (id_value) {
                        return {
                            name: id_field,
                            value: id_value
                        };
                    }
                    return null;
                },
                function () {
                    return ['name', 'description'];
                },
                function () {
                    return [
                        name_element.val().wrap("'"),
                        description_element.val().wrap("'")
                    ];
                },
                function (goBack) {
                    name_element.val('');
                    description_element.val('');
                    goBack();
                });
        }
        finally {
            name_element.data(id_field, null);
        }
    }
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

    // Returns a function that checks if predicate returns true, and if so calls action
    function doIf(predicate, action) {
        return function (e, o) {
            if (!predicate || predicate(e, o)) {
                action();
            }
            e.preventDefault();
        };
    }

    $(document).ready(function () {
        //$('#settings form').submit(saveSettings);
        $('#create_category form').submit(create_category);
        $('#categories').bind('pageAnimationStart',
            doIf(function (e, o) {
                return o.direction === 'in';
            },
            refresh_category_list));
        //$('#settings').bind('pageAnimationStart', loadSettings);
        //$('#dates li a').bind('click touchend', setDate);
        //loadSettings();
        db = createDatabase();
    });
}());
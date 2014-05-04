/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="" />
(function () {
    var jQT = $.jQTouch({
        icon: 'kilo.png',
        useAnimations: true
    }),
        db;

    function errorHandler(transaction, error) {
        alert('Oops. Error was ' + error.message + ' (Code: ' + error.code + ')');
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
        loadSetting('age');
        loadSetting('weight');
        loadSetting('budget');
    }
    function saveSettings(e) {
        saveSetting('age');
        saveSetting('weight');
        saveSetting('budget');

        jQT.goBack();
        e.preventDefault();
    }

    function deleteEntryById(id) {
        db.transaction(
            function (transaction) {
                transaction.executeSql('DELETE FROM entries WHERE id=?;', [id],
                    null, errorHandler);
            });
    }
    function refreshEntries() {
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
        var shortName = 'Kilo',
            version = '1.0',
            displayName = 'Kilo',
            maxSize = 65536,
            db;
        db = openDatabase(shortName, version, displayName, maxSize);
        db.transaction(
            function (transaction) {
                transaction.executeSql(
                    'CREATE TABLE IF NOT EXISTS entries ' +
                    ' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                    ' date DATE NOT NULL, food TEXT NOT NULL, ' +
                    ' calories INTEGER NOT NULL );'
                    );
            });
        return db;
    }
    function createEntry(e) {
        var date = sessionStorage.currentDate,
            calories = $('#calories').val(),
            food = $('#food').val();
        
        db.transaction(function (transaction) {
            transaction.executeSql(
                'INSERT INTO entries (date, calories, food) VALUES (?, ?, ?);',
                [date, calories, food],
                function() {
                    refreshEntries();
                    jQT.goBack();
                    $('#calories').val('');
                    $('#food').val('');
                },
                errorHandler);
        });
        e.preventDefault();
    }

    $(document).ready(function () {
        $('#settings form').submit(saveSettings);
        $('#createEntry form').submit(createEntry);
        $('#settings').bind('pageAnimationStart', loadSettings);
        $('#dates li a').bind('click touchend', setDate);
        loadSettings();
        db = createDatabase();
    });
}());
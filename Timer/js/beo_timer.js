/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />
/// <reference path="beo_category.js" />
/// <reference path="beo_timerset.js" />

(function () {
    var my_ns = 'beo_timer';
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
            foid_category: 'foid_category',
            timerset: 'timerset',
            foid_timerset: 'foid_timerset'
        },
        // Function to return an object containing all the editor controls
        get_editor = function () {
            return ({
                name: $('#' + table + '_' + fields.name),
                description: $('#' + table + '_' + fields.description),
                enabled: $('#' + table + '_' + fields.enabled),
                duration: {
                    hours: $('#' + table + '_' + fields.duration.hours), 
                    minutes: $('#' + table + '_' + fields.duration.minutes), 
                    seconds: $('#' + table + '_' + fields.duration.seconds), 
                },
                snooze: {
                    hours: $('#' + table + '_' + fields.snooze.hours), 
                    minutes: $('#' + table + '_' + fields.snooze.minutes), 
                    seconds: $('#' + table + '_' + fields.snooze.seconds), 
                },
                category: $('#' + table + '_' + fields.category),
                timerset: $('#' + table + '_' + fields.timerset),
            });
        },
        get_row_template = function () { return $('#' + table + '_template'); },
        orderByField = fields.name,
        listName = 'timers';

    // Local code

    // Create a new category
    var create_timer = (function () {
        function create_timer(e, o) {
            var editor = get_editor();
            try {
                ns.timer.createRecord(table,
                    function () {
                        var id_value = editor.name.data(id_field);
                        if (id_value) {
                            return {
                                name: id_field,
                                value: id_value
                            };
                        }
                        return null;
                    },
                    function () {
                        return [fields.name, fields.description, fields.enabled,
                            fields.duration.hours, fields.duration.minutes, fields.duration.seconds,
                            fields.snooze.hours, fields.snooze.minutes, fields.snooze.seconds,
                            fields.foid_category];
                    },
                    function () {
                        var category = 0;

                        return [
                            editor.name.val().wrap("'"),
                            editor.description.val().wrap("'"),
                            ('' + editor.enabled.is(':checked')).wrap("'"),
                            editor.duration.hours.val().wrap("'"),
                            editor.duration.minutes.val().wrap("'"),
                            editor.duration.seconds.val().wrap("'"),
                            editor.snooze.hours.val().wrap("'"),
                            editor.snooze.minutes.val().wrap("'"),
                            editor.snooze.seconds.val().wrap("'"),
                            editor.category.val().wrap("'"),
                        ];
                    },
                    function (goBack) {
                        editor.name.val('');
                        editor.description.val('');
                        ns.util.setCheckbox(editor.enabled, true);
                        editor.duration.hours.val('0');
                        editor.duration.minutes.val('0');
                        editor.duration.seconds.val('0');
                        editor.snooze.hours.val('0');
                        editor.snooze.minutes.val('0');
                        editor.snooze.seconds.val('0');
                        editor.category.val('-1');
                        ns.timerset.update_timer_list();
                        goBack();
                    });
            }
            finally {
                editor.name.data(id_field, null);
            }

        }
        return create_timer;
    })();
    // Edit the specified category
    var edit_timer = (function () {
        function edit_timer(id_value) {
            var editor = get_editor();
            function populate(datarow) {
                var duration = '',
                snooze = '';

                editor.name.val(datarow[fields.name]);
                editor.name.data(id_field, id_value);
                editor.description.val(datarow[fields.description]);
                ns.util.setCheckbox(editor.enabled, (datarow[fields.enabled] === 'true'));

                editor.duration.hours.val(datarow[fields.duration.hours]);
                editor.duration.minutes.val(datarow[fields.duration.minutes]);
                editor.duration.seconds.val(datarow[fields.duration.seconds]);
                editor.snooze.hours.val(datarow[fields.snooze.hours]);
                editor.snooze.minutes.val(datarow[fields.snooze.minutes]);
                editor.snooze.seconds.val(datarow[fields.snooze.seconds]);
                editor.category.val(datarow[fields.foid_category]);
            }
            return ns.timer.editRecord(table, id_field, id_value, populate);

        }
        return edit_timer;
    })();

    // Update the list of categories from the database
    var refresh_timer_list = (function () {
        function refresh_timer_list() {
            var row_template = get_row_template();
            ns.timer.refreshList(table, orderByField, listName,
                null,
                function (transaction, records) {
                    var datarow,
                        listrow,
                        duration;


                    for (i = 0; i < records.rows.length; i += 1) {
                        datarow = records.rows.item(i);
                        listrow = row_template.clone();
                        listrow.removeAttr('id');
                        listrow.removeClass('template');
                        listrow.data(id_field, datarow[id_field]);
                        listrow.appendTo('#' + listName + ' ul');

                        duration = (datarow[fields.duration.hours] + ':' 
                            + datarow[fields.duration.minutes]);
                        listrow.find('.' + fields.name).text(datarow[fields.name]);
                        listrow.find('.' + fields.duration_name).text(duration);

                        listrow.find('.edit').click(edit_timer(datarow[id_field]));
                        listrow.find('.delete').click(function () {
                            var clicked = $(this).parent().parent(),
                                clicked_Id = clicked.data(id_field);
                            ns.timer.deleteById(table,
                                function (id) {
                                    return true;
                                },
                                clicked_Id);
                            clicked.slideUp();
                            ns.timerset.update_timer_list();
                        });
                    }
                },
                null);
        }
        return refresh_timer_list;
    })();


    var update_category_list = (function () {
        function update_category_list() {
            ns.timer.update_select_list('oid_category',
                'name',
                'category',
                'name',
                get_editor().category,
                'update_category_list()');
        }
        return update_category_list;
    })();


    var update_timerset_list = (function () {
        function update_timerset_list() {
            ns.timer.update_select_list('oid_timerset',
                'name',
                'timerset',
                'name',
                get_editor().timerset,
                'update_timerset_list()');
        }
        return update_timerset_list;
    })();


    // Update the namespace with public methods
    (function () {
        ns.add('create_timer', create_timer, my_ns);
        ns.add('edit_timer', edit_timer, my_ns);
        ns.add('refresh_timer_list', refresh_timer_list, my_ns);
        ns.add('update_category_list', update_category_list, my_ns);
        ns.add('update_timerset_list', update_timerset_list, my_ns);
    })();

})();
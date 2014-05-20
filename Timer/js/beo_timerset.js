/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />
/// <reference path="beo_category.js" />
/// <reference path="beo_timer.js" />

(function () {
    var my_ns = 'beo_timerset';
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

    
    var table = 'timerset',
        id_field = ('oid_' + table),
        fields = {
            name: 'name',
            description: 'description',
            enabled: 'enabled'
        },
        // Function to return an object containing all the editor controls
        get_editor = function () {
            return ({
                name: $('#' + table + '_' + fields.name),
                description: $('#' + table + '_' + fields.description),
                enabled: $('#' + table + '_' + fields.enabled)
            });
        },
        get_row_template = function () { return $('#' + table + '_template'); },
        orderByField = fields.name,
        listName = 'timersets';

    // Local code

    // Create a new category
    var create_timerset = (function () {
        function create_timerset(e, o) {
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
                        return [fields.name, fields.description, fields.enabled];
                    },
                    function () {
                        return [
                            editor.name.val().wrap("'"),
                            editor.description.val().wrap("'"),
                            ('' + editor.enabled.is(':checked')).wrap("'")
                        ];
                    },
                    function (goBack) {
                        editor.name.val('');
                        editor.description.val('');
                        ns.util.setCheckbox(editor.enabled, true);
                        goBack();
                    });
            }
            finally {
                editor.name.data(id_field, null);
            }
            
        }
        return create_timerset;
    })();
    // Edit the specified category
    var edit_timerset = (function () {
        function edit_timerset(id_value) {
            var editor = get_editor();
            function populate(datarow) {
                editor.name.val(datarow.name);
                editor.name.data(id_field, id_value);
                editor.description.val(datarow.description);
                ns.util.setCheckbox(editor.enabled, (datarow.enabled === 'true'));
            }
            return ns.timer.editRecord(table, id_field, id_value, populate);

        }
        return edit_timerset;
    })();

    // Update the list of categories from the database
    var refresh_timerset_list = (function () {
        function refresh_timerset_list() {
            var row_template = get_row_template();
            ns.timer.refreshList(table, orderByField, listName,
                null,
                function (transaction, records) {
                    var datarow,
                        listrow,
                        enabled;


                    for (i = 0; i < records.rows.length; i += 1) {
                        datarow = records.rows.item(i);
                        listrow = row_template.clone();
                        listrow.removeAttr('id');
                        listrow.removeClass('template');
                        listrow.data(id_field, datarow[id_field]);
                        listrow.appendTo('#' + listName + ' ul');

                        enabled = (datarow[fields.enabled] === 'true') ? '[x]' : '[ ]';
                        listrow.find('.' + fields.name).text(datarow[fields.name]);
                        listrow.find('.' + fields.description).text(datarow[fields.description] + ' ' + enabled);

                        listrow.find('.edit').click(edit_timerset(datarow[id_field]));
                        listrow.find('.delete').click(function () {
                            var clicked = $(this).parent().parent(),
                                clicked_Id = clicked.data(id_field);
                            ns.timer.deleteById(table,
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
        return refresh_timerset_list;
    })();

    // Update the namespace with public methods
    (function () {
        ns.add('create_timerset', create_timerset, my_ns);
        ns.add('edit_timerset', edit_timerset, my_ns);
        ns.add('refresh_timerset_list', refresh_timerset_list, my_ns);
    })();

})();
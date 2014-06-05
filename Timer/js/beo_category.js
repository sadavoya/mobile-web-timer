/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />
/// <reference path="beo_timerset.js" />
/// <reference path="beo_timer.js" />

(function () {
    var my_ns = 'beo_category';
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
    

    var table = 'category',
    id_field = ('oid_' + table),
    fields = {
        name: 'name',
        description: 'description'
    },
    // Function to return an object containing all the editor controls
    get_editor = function () {
        return ({
            name: $('#' + table + '_' + fields.name),
            description: $('#' + table + '_' + fields.description)
        });
    },
    get_row_template = function () { return $('#' + table + '_template'); },
    orderByField = fields.name,
    listName = 'categories';
    
    // Local code
    
    // Create a new category
    var create_category = (function () {
        function create_category(e, o) {
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
                        return ['name', 'description'];
                    },
                    function () {
                        return [
                            editor.name.val().wrap("'"),
                            editor.description.val().wrap("'")
                        ];
                    },
                    function (goBack) {
                        editor.name.val('');
                        editor.description.val('');
                        ns.beo_timer.update_category_list();
                        goBack();
                    });
            }
            finally {
                editor.name.data(id_field, null);
            }
        }
        return create_category;
    })();

    // Edit the specified category
    var edit_category = (function () {
        function edit_category(id_value) {
            var editor = get_editor();

            function populate(datarow) {
                editor.name.val(datarow[fields.name]);
                editor.name.data(id_field, id_value);
                editor.description.val(datarow[fields.description]);
            }
            return ns.timer.editRecord(table, id_field, id_value, populate);
        }
        return edit_category;
    })();
    // Update the list of categories from the database
    var refresh_category_list = (function () {
        function refresh_category_list() {
            var row_template = get_row_template();
            
            ns.timer.refreshList(table, orderByField, listName,
                null,
                function (transaction, records) {
                    var datarow,
                        listrow;

                    for (i = 0; i < records.rows.length; i += 1) {
                        datarow = records.rows.item(i);
                        listrow = row_template.clone();
                        listrow.removeAttr('id');
                        listrow.removeClass('template');
                        listrow.data(id_field, datarow[id_field]);
                        listrow.appendTo('#' + listName + ' ul');
                        
                        listrow.find('.' + fields.name).text(datarow.name);
                        listrow.find('.' + fields.description).text(datarow.description);

                        listrow.find('.edit').click(edit_category(datarow[id_field]));
                        listrow.find('.delete').click(function () {
                            var clicked = $(this).parent().parent(),
                                clicked_Id = clicked.data(id_field);
                            ns.timer.deleteById(table,
                                function (id) {
                                    return true;
                                },
                                clicked_Id);
                            clicked.slideUp();
                            ns.beo_timer.update_category_list();
                        });
                    }
                },
                null);
        }
        return refresh_category_list;
    })();

    // Update the namespace with public methods
    (function () {
        ns.add('create_category', create_category, my_ns);
        ns.add('edit_category', edit_category, my_ns);
        ns.add('refresh_category_list', refresh_category_list, my_ns);
    })();

})();
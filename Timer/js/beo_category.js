/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />
/// <reference path="beo_timerset.js" />
/// <reference path="beo_timer.js" />

(function () {
    var my_ns = 'beo_category',
        ns = window.myApp,
        jQT,
        db;
    if (!window.myApp.jQT) {
        window.myApp.jQT = $.jQTouch({
            icon: 'kilo.png',
            useAnimations: true
        });
    }
    db = ns.timer.createDatabase();
    jQT = window.myApp.jQT;
    
    
    // Only run once
    if (window.myApp[my_ns]) {
        return;
    }
    // Local code
    
    // Create a new category
    var create_category = (function () {
        function create_category(e, o) {

            var table = 'category',
                id_field = ('oid_' + table),
                name_element = $('#' + table + '_name'),
                description_element = $('#' + table + '_description');


            try {
                ns.timer.createRecord(table,
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
        return create_category;
    })();

    // Edit the specified category
    var edit_category = (function () {
        function edit_category(id_value) {
            var table = 'category',
                id_field = 'oid_' + table;

            function populate(datarow) {
                var name_element = $('#' + table + '_name');
                name_element.val(datarow.name);
                name_element.data(id_field, id_value);
                $('#' + table + '_description').val(datarow.description);
            }
            return ns.timer.editRecord(table, id_field, id_value, populate);
        }
        return edit_category;
    })();
    // Update the list of categories from the database
    var refresh_category_list = (function () {
        function refresh_category_list() {
            var table = 'category',
                orderByField = 'name',
                listName = 'categories';
            
            ns.timer.refreshList(table, orderByField, listName,
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

                        listrow.find('.edit').click(edit_category(datarow[id_field]));

                        listrow.find('.name').text(datarow.name);
                        listrow.find('.description').text(datarow.description);
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
        return refresh_category_list;
    })();

    // Update the namespace with public methods
    (function () {
        ns.add('create_category', create_category, my_ns);
        ns.add('edit_category', edit_category, my_ns);
        ns.add('refresh_category_list', refresh_category_list, my_ns);
    })();

})();
/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
/// <reference path="util.js" />
/// <reference path="timer.js" />
/// <reference path="beo_category.js" />
/// <reference path="beo_timerset.js" />
/// <reference path="beo_timer.js" /> 
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



    // Local code

    // Create a new category
    var create_timer = (function () {
        function create_timer(e, o) {
            /*
            var table = 'category',
                id_field = 'oid_' + table,
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
            */
        }
        return create_timer;
    })();

    // Edit the specified category
    var edit_timer = (function () {
        function edit_timer(id_value) {
            /*
            var table = 'category',
                id_field = 'oid_' + table;
            function populate(datarow) {
                var name_element = $('#' + table + '_name');
                name_element.val(datarow.name);
                name_element.data(id_field, id_value);
                $('#' + table + '_description').val(datarow.description);
            }
            return ns.timer.editRecord(table, id_field, id_value, populate);
            */
        }
        return edit_timer;
    })();
    // Update the list of categories from the database
    var refresh_timer_list = (function () {
        function refresh_timer_list() {
            /*
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
            */
        }
        return refresh_timer_list;
    })();



    // Update the namespace with public methods
    (function () {
        ns.add('create_timer', create_timer, my_ns);
        ns.add('edit_timer', edit_timer, my_ns);
        ns.add('refresh_timer_list', refresh_timer_list, my_ns);
    })();

})();
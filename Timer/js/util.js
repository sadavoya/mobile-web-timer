/// <reference path="../jqtouch/jquery-1.4.2.js" />
/// <reference path="../jqtouch/jqtouch.js" />
// Add the namespace structure
(function () {
    if (!window.myApp) {
        (function () {
            window.myApp = {};
            var add = function add(name, value, namespace) {
                var o = window.myApp;
                if (namespace) {
                    if (!o[namespace]) {
                        o[namespace] = {};
                    }
                    o = o[namespace];
                }
                if (!o[name]) {
                    o[name] = value;
                }
            }
            add('add', add);
        })();
    }
})();

(function () {
    if (window.myApp.util) {
        return;
    }
    var my_ns = 'util',
        ns = window.myApp;


    // Add 'method' method to Function prototype, for adding new methods to Function
    var method = (function () {
        function method(o, name, func) {
            o.prototype[name] = func;
            return this;
        }
        return method;
    })();

    // Add curry method to all functions
    method(Function, 'curry',
        // Returns a curried version of the function - one where some but not all parameters have been provided
        function () {
            var slice = Array.prototype.slice,
                args = slice.apply(arguments),
                that = this;
            return function () {
                return that.apply(null, args.concat(slice.apply(arguments)));
            };
        });
    // Add wrap method to all strings
    method(String, 'wrap',
        // Returns the string with wrapper as both prefix and postfix 
        function (wrapper) {
            return (wrapper + this + wrapper);
        });

    // Add a pad method to all strings
    method(String, 'pad',
        // Pad the string, on the left or the right side, 
        // with a filler string until the string length equals or exceeds len. Return the new string.
        function (fill, len, rightside) {
            var result = this;
            if (fill && len) {
                while (result.length < len) {
                    if (rightside) {
                        result = result + fill;
                    } else {
                        result = fill + result;
                    }
                }
            }
            return (result);
        });

    // Returns a function that checks if predicate returns true, and if so calls action
    var doIf = (function () {
        function doIf(predicate, action) {
            return function (e, o) {
                if (!predicate || predicate(e, o)) {
                    action();
                }
                e.preventDefault();
            };
        }
        return doIf;
    })();

    // Set the specified checkbox's "checked" state
    var setCheckbox = (function () {
        function setCheckbox(checkbox, checked) {
            if (checked) {
                checkbox.attr('checked', 'checked');
            } else {
                checkbox.removeAttr('checked');
            }
        }
        return setCheckbox;
    })();
    // Update the namespace with public methods
    (function () {
        ns.add('doIf', doIf, my_ns);
        ns.add('method', method, my_ns);
        ns.add('setCheckbox', setCheckbox, my_ns);
    })();
})();
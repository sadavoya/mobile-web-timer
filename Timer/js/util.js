(function () {
    // Add 'method' method to Function prototype, for adding new methods to Function
    function method(o, name, func) {
        o.prototype[name] = func;
        return this;
    }
    // Add curry method to all functions
    method(Function, 'curry', function () {
        var slice = Array.prototype.slice,
            args = slice.apply(arguments),
            that = this;
        return function () {
            return that.apply(null, args.concat(slice.apply(arguments)));
        };
    });
    method(String, 'wrap', function (wrapper) {
        return wrapper + this + wrapper;
    });

}());
(function () {
    // Add 'method' method to Function prototype, for adding new methods to Function
    Function.prototype.method = function (name, func) {
        this.prototype[name] = func;
        return this;
    }
    // Add curry method to all functions
    Function.method('curry', function () {
        var slice = Array.prototype.slice,
            args = slice.apply(arguments),
            that = this;
        return function () {
            return that.apply(null, args.concat(slice.apply(arguments)));
        };
    });

}());
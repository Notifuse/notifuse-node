'use strict';

module.exports.promisify = function (bind, method, args) {

    return new Promise((resolve, reject) => {

        const callback = (error, result) => {

            if (error) {
                return reject(error);
            }

            return resolve(result);
        };

        method.apply(bind, args ? args.concat(callback) : [callback]);
    });
};

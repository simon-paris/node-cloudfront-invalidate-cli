#!/usr/bin/env node
(function () {
    "use strict";
    
    
    
    var usageString =
        "cf-invalidate [--wait] [--accessKeyId <keyId> --secretAccessKey <key>] -- <distribution> <path>...";
    var exampleString =
        "cf-invalidate -- myDistribution file1 file2 file3";
    
    var AWS = require("aws-sdk");
    var yargs = require("yargs");
    var fs = require("fs");
    var ini = require("ini");

    var log = function () {};
    var error = function () {};
    
    
    
    
    /**
     * Function: randomDigits
     * 
     * Returns a random string of 4 digits.
     */
    function randomDigits() {
        var n = Math.floor(Math.random() * 1000);
        return "" + ({
            "0": "0000",
            "1": "000",
            "2": "00",
            "3": "0",
            "4": "",
        }[("" + n).length]) + n;
    }
    
    /**
     * Function: loadConfigFile
     *
     * Wrapper around invalidate(). Adds AWS sercet and access from .ini config file if its set with --config.

     */
    function loadConfigFile(dist, paths, options, callback) {
        if (options.config) {
            fs.readFile(options.config, {encoding: 'utf8'}, function(err, contents) {
                if (err) {
                    callback(err);
                    return;
                }
                
                var config = ini.parse(contents);

                if (config && config.default) {
                    options.accessKeyId = config.default.access_key;
                    options.secretAccessKey = config.default.secret_key;
                }
                if (!options.secretAccessKey || !options.accessKeyId) {
                    callback("Config file missing access_key or secret_key");
                    return;
                }

                invalidate(dist, paths, options, callback);
            });
        } else {
            invalidate(dist, paths, options, callback);
        }
    }
    
    
    /**
     * Function: invalidate
     * 
     * Invalidates objects on cloudfront.
     * 
     * Parameters:
     *  dist - Cloudfront distribution ID
     *  paths - An array of pathnames to invalidate
     *  options - Options object
     *      wait - If true, wait until the invalidation is complete.
     *      accessKeyId - If set, use this as the AWS key ID
     *      secretAccessKey - The AWS secret key
     *  callback - Callback
     */
    function invalidate(dist, paths, options, callback) {
        var cloudfront = new AWS.CloudFront();

        if (options.accessKeyId) {
            cloudfront.config.update({
                accessKeyId: options.accessKeyId,
                secretAccessKey: options.secretAccessKey,
            });
        }
        
        paths = paths.map(function (v) {
            if (v.charAt(0) === "/") {
                return v;
            } else {
                return "/" + v;
            }
        });
        
        var callerReference = "cf-invalidate-" + Date.now() + "_" + randomDigits();
        
        cloudfront.createInvalidation({
            DistributionId: dist,
            InvalidationBatch: {
                CallerReference: callerReference,
                Paths: {
                    Quantity: paths.length,
                    Items: paths,
                },
            },
        }, function (err, res) {
            if (err) {return callback(err);}
            
            var invalidationId = res.Invalidation.Id;
            if (options.wait) {
                var i = 0;
                var iteration = function () {
                    cloudfront.getInvalidation({
                        DistributionId: dist,
                        Id: invalidationId
                    }, function (err, res) {
                        if (err) {return callback(err);}
                        
                        if (res.Invalidation.Status === "Completed") {
                            return callback();
                        } else {
                            var nextTry = Math.min(60000, 1000 * Math.pow(2, i++));
                            log('Invalidation not done yet, next try in ' + nextTry + 'ms.');
                            setTimeout(function () {
                                iteration();
                            }, nextTry);
                        }
                        
                    });
                };
                iteration();
                
            } else {
                callback();
            }
            
        });
        
    }
    
    
    
    
    
    
    
    
    if (module === require.main) {
        log = console.log.bind(console);
        error = console.error.bind(console);
        var argv = yargs
            .usage(usageString)
            .example(exampleString)
            .demand(2)
            .option("accessKeyId", {
                alias: "i",
                describe: "AWS Key Id override",
            })
            .option("secretAccessKey", {
                alias: "k",
                describe: "AWS Secret Key override",
            })
            .implies("accessKeyId", "secretAccessKey")
            .implies("secretAccessKey", "accessKeyId")
            .option("wait", {
                alias: "w",
                describe: "If set, wait til the invalidation completes",
            })
            .option("config", {
                alias: "c",
                describe: "AWS .ini config file path",
            })
            .argv;
        loadConfigFile(argv._[0], argv._.slice(1), argv, function (err) {
            if (err) {
                error(err);
                process.exit(1);
            }
            if (argv.wait) {
                log("Invalidation Complete");
            } else {
                log("Invalidation Created");
            }
        });
    } else {
        module.exports = invalidate;
    }
    
    
    
    
    
}());
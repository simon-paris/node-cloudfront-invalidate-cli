#! /usr/bin/env node
(function () {
    "use strict";
    
    
    
    var usageString =
        "cf-invalidate [--wait] [--secretKeyId <keyId> --secretAccessKey <key>] -- <distribution> <path>...";
    var exampleString =
        "cf-invalidate -- myDistribution file1 file2 file3";
    
    var AWS = require("aws-sdk");
    var yargs = require("yargs");
    
    var cloudfront = new AWS.CloudFront();
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
     * Function: invalidate
     * 
     * Invalidates objects on cloudfront.
     * 
     * Parameters:
     *  dist - Cloudfront distribution ID
     *  paths - An array of pathnames to invalidate
     *  options - Options object
     *      wait - If true, wait until the invalidation is complete.
     *      secretKeyId - If set, use this as the AWS key ID
     *      secretAccessKey - The AWS secret key
     *  callback - Callback
     */
    function invalidate(dist, paths, options, callback) {
        
        if (options.secretKeyId) {
            cloudfront.config.update({
                secretKeyId: options.secretKeyId,
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
                
                var iteration = function () {
                    cloudfront.getInvalidation({
                        DistributionId: dist,
                        Id: invalidationId
                    }, function (err, res) {
                        if (err) {return callback(err);}
                        
                        if (res.Invalidation.Status === "Completed") {
                            return callback();
                        } else {
                            setTimeout(function () {
                                iteration();
                            }, 1000);
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
            .option("secretKeyId", {
                alias: "i",
                describe: "AWS Key Id override",
            })
            .option("secretAccessKey", {
                alias: "k",
                describe: "AWS Secret Key override",
            })
            .implies("secretKeyId", "secretAccessKey")
            .implies("secretAccessKey", "secretKeyId")
            .option("wait", {
                alias: "w",
                describe: "If set, wait til the invalidation completes",
            })
            .argv;
        invalidate(argv._[0], argv._.slice(1), argv, function (err) {
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
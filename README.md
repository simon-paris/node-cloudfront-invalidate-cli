# node-cloudfront-invalidate-cli
A CLI for invalidating cloudfront objects that's a bit easier to use than the
official AWS CLI.

## Install

    npm install cloudfront-invalidate-cli -g

## Use

    cf-invalidate [--wait] [--secretKeyId <keyId> --secretAccessKey <key>] -- <distribution> <path>...

    # Examples:
    cf-invalidate -- ABCDEFGHIJK index.html
    cf-invalidate --wait -- ABCDEFGHIJK file1 file2 file3

If you omit the AWS credentials, it'll use the default method of finding credentials,
which is documented here:
[docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Using_Profiles_with_the_SDK).

If you use the --wait option, the command will not exit until the invalidation is complete.

This tool needs permission for `cloudfront:CreateInvalidation` and `cloudfront:GetInvalidation`.

If there is an error, it `exit(1)`s, and prints the error message to stderr.

It's not intended to be used programmatically, but if you want:

    require("node-cloudfront-invalidate-cli")("<distribution>", ["<path>"], {wait: false}, function () {
        console.log("Done");
    });

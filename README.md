# node-cloudfront-invalidate-cli
A CLI for creating invalidations on CloudFront, that's a bit easier to use than the
official AWS CLI.

## Install
```shell
npm install cloudfront-invalidate-cli -g
```
## Use
```shell
cf-invalidate [--wait] [--accessKeyId <keyId> --secretAccessKey <key>] -- <distribution> <path>...

# Examples:
cf-invalidate -- ABCDEFGHIJK index.html
cf-invalidate --wait -- ABCDEFGHIJK file1 file2 file3
```


If you omit `--accessKeyId` and `--secretAccessKey`, it'll use the default method of
finding credentials (Environment, INI File, EC2 Metadata Service), which is documented here:
[docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Using_Profiles_with_the_SDK).

If you use the `--wait` option, the command will not exit until the invalidation is complete. It does
this by polling `GetInvalidation` after min(60000, 1000ms * 2^iterationCycle) (e.g. it increases the timeout between polls exponentially).

This tool needs permission for `cloudfront:CreateInvalidation` and `cloudfront:GetInvalidation`.

If there is an error, it `exit(1)`s, and prints the error message to stderr.

It's not intended to be used programmatically, but if you want:
```shell
require("node-cloudfront-invalidate-cli")("ABCDEFGHIJK", ["file1", "file2", "file3"], {wait: true}, function (err) {
    console.log(err || "Success");
});
```

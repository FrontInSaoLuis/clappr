var gulp = require('gulp');
var s3 = require('s3');
var fs = require('fs');
var args = require('yargs').argv;
var exec = require('child_process').exec;

gulp.task('upload', ['release'], function(b) {
  var tag = args.tag || undefined;
  upload('latest/');
  if (tag) {
    exec('git tag ' + tag)
    exec('git push origin master --tags')
    upload(tag + '/');
  }
  return;
});

var upload = function(prefix) {
  var awsOptions = JSON.parse(fs.readFileSync('./aws.json'));
  var client = s3.createClient({s3Options: awsOptions});
  var params = {localDir: "./dist/", deleteRemoved: true, s3Params: {Bucket: "cdn.clappr.io", Prefix: prefix}};
  var uploader = client.uploadDir(params);
  uploader.on('error', function(err) { console.error("unable to sync:", err.stack); });
  uploader.on('end', function() { console.log("done uploading for " + prefix); });
}


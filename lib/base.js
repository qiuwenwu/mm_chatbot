require("mm_matchs");
const Tpl = require("mm_tpl");
const Http = require('mm_https');
const conf = require('mm_config');
const {
	mysql_admin
} = require("mm_mysql");

$.appPath = "./apps/".fullname();

$.Tpl = Tpl;
$.Http = Http;
$.conf = conf;
$.mysql_admin = mysql_admin;

$.http = function() {
	return new Http();
}
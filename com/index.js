const path = require('path');
const Cmd = require("./cmd.js");
const User = require("./user.js");
const Group = require("./group.js");
const Item = require("./item.js");

/**
 * 应用开发
 */
class App {
	constructor() {
		this.init();
	}
}

/**
 * 初始化指令、用户、物品信息
 */
App.prototype.init = function() {
	// 添加指令
	this.cmd = new Cmd();
	this.cmd.init();

	// 添加用户
	this.user = new User();
	this.user.init();

	// 添加群组
	this.group = new Group();
	this.group.init();

	// 添加物品
	this.item = new Item();
	this.item.init();
}

/**
 * 获取指令对应对象
 * @param {String} content 消息内容
 * @returns {Object} 对象
 */
App.prototype.getCmdClass = function(content) {
	if (!content) {
		return;
	}
	var ret = {};
	var dict = this.cmd.dict;
	for (var k in dict) {
		var o = dict[k];
		var list = o.info.cmd;
		if (list) {
			for (var i = 0; i < list.length; i++) {
				var kv = list[i];
				if (content.matchs(kv.rule || "#" + kv.name + "*")) {
					ret.cmd_name = kv.name;
					ret.obj = o;
					break;
				}
			}
		}
	}
	return ret;
}

/**
 * 应用程序处理
 */
App.prototype.run = async function(e) {
	var msg;
	var cs = this.getCmdClass(e.content);
	
	if (cs && cs.cmd_name) {
		var ret = await $.app.cmd.request(e, cs, e.from, e.to, e.type, e.content);
		var content = ret.tip || ret.message;
		if (content) {
			if (typeof(content) == 'string') {
				if (content.indexOf("<") === 0) {
					msg = await $.reply.h5(content);
				} else if (content.indexOf('data:') === 0) {
					msg = await $.reply.img(content);
				} else if (content.length > $.config.toImg_length) {
					msg = await $.reply.md(content);
				} else {
					msg = content;
				}
			} else {
				msg = content;
			}
		}
	}
	return msg;
}

$.app = new App();

module.exports = App;
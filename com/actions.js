const util = require("util");
const segment = require("icqq");

class Actions {
	/**
	 * 构造函数
	 */
	constructor(info, cs) {
		Object.assign(this, info, cs);

		this.message = "";
	}
}

/**
 * 执行指令
 * @param {String} cmd_name 指令名称
 * @param {Object} from 来自角色
 * @param {Object} to 接收角色
 * @param {String} type 类型
 * @param {String} content 玩家内容
 * @returns {String} 执行结果
 */
Actions.prototype.runCmd = async function(cmd_name, from, to, type, content) {
	return await this.main(cmd_name, from, to, type, content);
}

/**
 * 第一次使用时
 * @returns {String} 执行结果
 */
Actions.prototype.init = async function() {
	return await this.init();
}

/**
 * 启动程序时
 * @returns {String} 执行结果
 */
Actions.prototype.start = async function() {
	return await this.start();
}

/**
 * 结束程序时
 * @returns {String} 执行结果
 */
Actions.prototype.end = async function() {
	return await this.end();
}

/**
 * 接收到消息
 * @param {Object} e 消息对象
 */
Actions.prototype.accept = async function(e) {
	return null;
}

/**
 * 接收到消息
 * @param {Object} e 消息对象
 */
Actions.prototype.receive = async function(e) {
	return null;
}

/**
 * 发送群消息
 * @param {Number} group_id 群ID
 * @param {String|Object} message 消息内容
 * @param {Object} source 资源
 */
Actions.prototype.sendGroupMsg = async function(group_id, message, source) {
	if (util.types.isPromise(message)) {
		message = await message;
	}
	Bot.sendGroupMsg(group_id, message, source);
}

/**
 * 发送私聊消息
 * @param {Number} user_id 用户ID
 * @param {String|Object} message 消息内容
 * @param {Object} source 资源
 */
Actions.prototype.sendPrivateMsg = async function(user_id, message, source) {
	this.sendMsg(user_id, message, source);
}

/**
 * 发送私聊消息
 * @param {Number} user_id 用户ID
 * @param {String|Object} message 消息内容
 * @param {Object} source 资源
 */
Actions.prototype.sendMsg = async function(user_id, message, source) {
	if (util.types.isPromise(message)) {
		message = await message;
	}
	Bot.sendPrivateMsg(user_id, message, source);
}

/**
 * 记录消息
 * @param {String} text 消息内容
 */
Actions.prototype.send = function(text) {
	if (this.message) {
		this.message += text;
	} else {
		this.message = text;
	}
}

/**
 * 发送xml格式新消息
 * @param {Number} user_id 用户ID
 * @param {String} xml 消息内容
 */
Actions.prototype.sendXML = async function(user_id, xml) {
	if (util.types.isPromise(xml)) {
		xml = await xml;
	}
	if (user_id) {
		this.sendMsg(segment.xml(xml));
	} else {
		this.e.reply(segment.xml(xml));
	}
}

/**
 * 发送json格式消息
 * @param {Number} user_id 用户ID
 * @param {String} json 消息内容
 */
Actions.prototype.sendJSON = async function(user_id, json) {
	if (util.types.isPromise(json)) {
		json = await json;
	}
	if (user_id) {
		this.sendMsg(segment.json(json));
	} else {
		this.e.reply(segment.json(json));
	}
}

/**
 * 发送视频
 * @param {Number} user_id 用户ID
 * @param {String} video 消息内容
 */
Actions.prototype.sendVideo = async function(user_id, video) {
	if (util.types.isPromise(video)) {
		video = await video;
	}
	if (user_id) {
		this.sendMsg(segment.video(video));
	} else {
		this.e.reply(segment.video(video));
	}
}

/**
 * 发送xml格式消息到群
 * @param {Number} group_id 群ID
 * @param {String} xml 消息内容
 */
Actions.prototype.sendGroupXML = async function(group_id, xml) {
	if (util.types.isPromise(xml)) {
		xml = await xml;
	}
	if (group_id) {
		this.sendGroupMsg(group_id, segment.xml(xml));
	} else {
		this.e.reply(segment.xml(xml));
	}
}

/**
 * 发送json格式消息到群
 * @param {Number} group_id 群ID
 * @param {String} json 消息内容
 */
Actions.prototype.sendGroupJSON = async function(group_id, json) {
	if (util.types.isPromise(json)) {
		json = await json;
	}
	if (group_id) {
		this.sendGroupMsg(segment.json(json));
	} else {
		this.e.reply(segment.json(json));
	}
}

module.exports = Actions;
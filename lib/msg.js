const util = require("util");
const {
	FileBox
} = require('file-box');

class Msg {
	constructor(kv, bot, msg) {
		Object.assign(this, kv);
		this.bot = bot;
		this.msg = msg;
	}
}

/**
 * 查找好友
 * @param {Object} to
 * @param {Object} type
 * @param {Object} content
 */
Msg.prototype.find = async function(query, type = "friend") {
	if (this.app == "qq") {
		
	} else if (this.app == "wechat") {
		if (typeof(query) == "string") {
			if (query.indexOf("@") === 0) {
				query = {
					id: query
				}
			} else {
				query = {
					name: query
				}
			}
		}
		return await this.bot.Contact.find(query);
	}
}

/**
 * 发送消息
 * @param {Object} to
 * @param {String} content
 */
Msg.prototype.send = async function(to, content, type) {
	if (util.types.isPromise(content)) {
		content = await content;
	}
	if (this.app == "qq") {
		if (typeof(to) == "string") {
			to = {
				user_id: to
			}
		}
		if (to.group_id) {
			await this.bot.sendGroupMsg(to.group_id, content);
		} else {
			await this.bot.sendPrivateMsg(to.user_id, content);
		}
	} else if (this.app == "wechat") {
		if (typeof(to) == "string") {
			if (to.indexOf("@") === 0) {
				to = {
					id: to
				}
			} else {
				to = {
					name: to
				}
			}
		}
		var contact = await this.bot.Contact.find(to);
		if (contact) {
			var box = this.toWechatMsg(content, type);
			await contact.say(box);
		} else {
			return "联系人不存在！"
		}
	}
}

/**
 * 转为微信消息
 * @param {Object} content
 */
Msg.prototype.toWechatMsg = function(content, type) {
	var o;
	if (typeof(content) == 'string') {
		if (type == "image" || type == "video" || type == "audio" || type == "music") {
			o = {
				type,
				file: content
			}
		} else {
			o = {
				type: "text",
				text: content
			}
		}
	} else {
		o = content;
	}
	type = o.type;
	var box;
	switch (type) {
		case "text":
			box = o.text;
			break;
		case "video":
		case "audio":
		case "music":
		case "image":
			var name = o.name;
			if (!name) {
				if (type == "image") {
					name = "image.jpeg"
				} else if (type == "video") {
					name = "video.mp4"
				} else if (type == "audio" || type == "music") {
					name = "music.mp3"
				}
			}
			var file = o.file;
			if (typeof(file) === "string") {
				if (file.indexOf("http") !== -1) {
					box = FileBox.fromUrl(file, name);
				} else if (file.indexOf("base64") !== -1) {
					box = FileBox.fromBase64(file, name);
				} else {
					box = FileBox.fromFile(file, file.basename() || name);
				}
			} else {
				box = FileBox.fromBuffer(file, name);
			}
			break;
		case "json":
			box = FileBox.fromJSON(o.data);
			break;
		case "xml":
			box = o.data;
			break;
		default:
			var file = o.file;
			var name;
			if (typeof(file) === "string") {
				if (file.indexOf("http") !== -1) {
					box = FileBox.fromUrl(file, name);
				} else if (file.indexOf("base64") !== -1) {
					box = FileBox.fromBase64(file, name);
				} else {
					box = FileBox.fromFile(file, file.basename() || name);
				}
			} else {
				box = FileBox.fromBuffer(file, name, file.length / 1024);
			}
			break;
	}
	return box;
}

Msg.prototype.reply = async function(content) {
	if (!content) {
		return
	}
	if (util.types.isPromise(content)) {
		content = await content;
	}
	if (this.msg.reply) {
		return await this.msg.reply(content);
	} else if (this.msg.say) {
		var box = this.toWechatMsg(content);
		return await this.msg.say(box);
	}
}

module.exports = Msg;
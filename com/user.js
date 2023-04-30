const path = require('path');
const Com = require("./com.js");

/**
 * 用户
 */
class User extends Com {
	constructor() {
		super();

		// 检索的文件路径
		this.path = "/data/user".fullname();
		// 文件拓展名
		this.extension = "user.json";
	}
}

/**
 * 查询
 * @param {String} uuid 微信UUID
 * @param {Object} model 默认对象
 */
Com.prototype.ofWechat = function(uuid, model) {
	var obj;
	for (var name in this.dict) {
		var o = this.dict[name];
		if (o.wechat_uuid == uuid) {
			obj = o;
		}
	}

	if (!obj) {
		if (model) {
			return this.add(uuid, model);
		} else {
			return null;
		}
	}
	return obj.info;
}

module.exports = User
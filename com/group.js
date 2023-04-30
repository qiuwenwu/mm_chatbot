const path = require('path');
const Com = require("./com.js");

/**
 * 用户群
 */
class Group extends Com {
	constructor() {
		super();

		// 检索的文件路径
		this.path = "/data/group".fullname();
		// 文件拓展名
		this.extension = "group.json";
	}
}

module.exports = Group
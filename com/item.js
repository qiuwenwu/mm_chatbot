const path = require('path');
const Com = require("./com.js");

/**
 * 物品
 */
class Item extends Com {
	constructor() {
		super();

		// 检索的文件路径
		this.path = "/data/item".fullname();
		// 文件拓展名
		this.extension = "item.json";
	}
}

module.exports = Item
require("./base.js");
require("./puppeteer.js");
const Wechat = require("./wechat.js");
const QQ = require("./qq.js");

/**
 * 应用开发
 */
class Lib {
	/**
	 * 构造函数
	 * @param {Object} config 配置参数
	 */
	constructor(config) {
		this.config = {};
		this.init(config);
	}
}

/**
 * 加载模块
 */
Lib.prototype.loadMod = function(config) {
	this.wechat = new Wechat(config.wechat);
	this.qq = new QQ(config.qq);
}

/**
 * 初始化
 * @param {Object} config 配置参数
 */
Lib.prototype.init = function(config) {
	this.config = Object.assign(this.config, config);
	this.loadMod(this.config);
}

module.exports = Lib;
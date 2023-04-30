/**
 * 公共类
 */
class Common {
	/**
	 * 构造函数
	 * @param {Object} config 配置参数
	 */
	constructor(config) {
		this.config = {
			account: 'defualt',
			password: '',
			platform: 4
		};
		this.init(config);
	}
}

/**
 * 初始化
 * @param {Object} config 配置参数
 */
Common.prototype.init = function(config) {
	this.config = Object.assign(this.config, config);
}

module.exports = Common;
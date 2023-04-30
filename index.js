const Lib = require('./lib');
const Com = require('./com');

/**
 * 聊天机器人类
 */
class ChatBot {
	/**
	 * 构造函数
	 * @param {Object} config 配置参数
	 */
	constructor(config) {
		this.config = {
			"wechat": {
				"master": "",
				"bot": ""
			},
			"qq": {
				"master": "",
				"bot": ""
			},
			"mqtt": {
				"host": "",
				"port": ""
			}
		};
		this.init(config);
	}
}

/**
 * 加载模块
 */
ChatBot.prototype.loadMod = function(config) {
	this.lib = new Lib(config);
	this.com = new Com(config);
}

/**
 * 初始化
 * @param {Object} config 配置参数
 */
ChatBot.prototype.init = function(config) {
	this.config = Object.assign(this.config, config);
	this.loadMod(config);
	$.package = "/package.json".loadJson();
}

/**
 * 运行QQ
 */
ChatBot.prototype.runQQ = async function(account = 'defualt') {
	await this.lib.qq.run(this.config.qq.bot || account);
}

/**
 * 运行微信
 */
ChatBot.prototype.runWechat = async function(account = 'defualt') {
	await this.lib.wechat.run(this.config.wechat.bot || account);
}

/**
 * 运行mqtt通讯机，实现QQ、微信互通
 */
ChatBot.prototype.runMqtt = function() {

}

/**
 * 运行交互
 * @param {String} bot_type 类型
 * @param {Object} from 来自
 * @param {Object} to 发自 一般指机器人
 * @param {String} type 消息类型
 * @param {Object} content 消息内容 可能是文本、图片、音频、视频
 */
ChatBot.prototype.interaction = function(bot_type, from, to, type, content) {

}

/**
 * 可视化运行
 */
ChatBot.prototype.run = function() {

}


/**
 * 控制台运行
 */
ChatBot.prototype.runC = async function() {
	await this.runWechat();
	// await this.runQQ();
}

module.exports = ChatBot;
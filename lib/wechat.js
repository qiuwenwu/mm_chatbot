const {
	WechatyBuilder
} = require('wechaty');
const path = require('path');
const Common = require("./common.js");
const Msg = require("./msg.js");

/**
 * 微信集群
 */
$.wechats = {};

/**
 * 微信处理类
 */
class Wechat extends Common {
	/**
	 * 构造函数
	 * @param {Object} config 配置参数
	 */
	constructor(config) {
		super(config);
	}
}

/**
 * 处理微信消息
 * @param {Object} bot 机器人主体
 * @param {Object} msg 消息载体
 */
Wechat.prototype.handle = function(bot, msg) {
	var type;
	var t = msg.type();
	switch (t) {
		case 1:
			type = "text";
			break;
		case 3:
		case 6:
			type = "image";
			break;
		case 14:
			type = "link";
			break;
		case 34:
			type = "voice";
			break;
		case 37:
			type = "verifymsg";
			break;
		case 42:
			type = "sharecard";
			break;
		case 43:
			type = "video";
			break;
		case 47:
			type = "emoticon";
			break;
		case 48:
			type = "location";
			break;
		case 49:
			type = "app";
			break;
		case 62:
			type = "microvideo";
			break;
		case 13:
		case 10002:
			type = "recalled";
			break;
		default:
			break;
	}
	var from;
	if (msg.payload.talkerId.length > 33) {
		var u = msg.talker();
		from = {
			user_id: 0,
			wechat_uuid: u.id,
			nickname: u.payload.name || '',
			name: u.payload.alias,
			avatar: u.payload.avatar
		};

		if (msg.payload.roomId) {
			from.group_id = msg.payload.roomId;
			var room = msg.room();
			from.group_name = room.payload.topic;
			msg.members = room.payload.memberIdList;
		}
	} else {
		from = {
			user_id: 0,
			nickname: u.payload.name || '',
			name: u.payload.alias,
			wechat_uuid: msg.payload.talkerId
		}
	}

	from = $.app.user.ofWechat(from.wechat_uuid) || from;
	var to = $.app.user.ofWechat(msg.payload.listenerId);

	return new Msg({
		app: "wechat",
		type,
		msg: {
			id: msg.id,
			time: msg.payload.timestamp,
			type: msg.payload.type
		},
		from,
		to,
		content: msg.text()
	}, bot, msg);
}

/**
 * 运行微信
 */
Wechat.prototype.run = async function(account) {
	if (!account) {
		account = this.config.account;
	}
	const wechaty = WechatyBuilder.build(Object.assign({}, this.config, {
		name: account
	}));
	var _this = this;
	wechaty
		.on('scan', (qrcode, status) => console.log(
			`扫描二维码登录: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`))
		.on('login', (msg) => {
			var botInfo = $.app.user.ofWechat(msg.id, msg.payload);
			console.log(`用户 ${msg} 登录`);
		})
		.on('friendship', friendship => console.log('收到好友请求：' + friendship))
		.on('room-invite', invitation => console.log('收到入群邀请：' + invitation))
		.on('message', async function(msg) {
			// 非发送给自己的情况下才执行
			if (!msg.self()) {
				var ret;
				var e = _this.handle(this, msg);
				try {
					ret = await $.app.cmd.eachRun(e);
				} catch (err) {
					$.log.error("遍历指令错误", err);
				}
				if (ret) {
					await e.reply(ret);
				} else if (e.content == "#更新指令") {
					$.app.cmd.init();
					await msg.say("更新完毕！");
				} else if (e.content == "#重置") {
					for (var k in $.app) {
						$.app[k].init();
						await msg.say("系统已重置！");
					}
				} else {
					try {
						ret = await $.app.run(e);
						if (ret) {
							await e.reply(ret);
						}
					} catch (err) {
						$.log.error("遍历方法", err);
					}
				}
			}
		});
	try {
		await wechaty.start();
	} catch (err) {

	}
	$.wechats[account] = account;
}

module.exports = Wechat;
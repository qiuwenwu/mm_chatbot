const {
	Client
} = require("icqq");
const inquirer = require('inquirer');
const path = require('path');
const Common = require("./common.js");
const Msg = require("./msg.js");
const fetch = require('node-fetch');
const lodash = require('lodash');

$.qqs = {};
let inSlider = false

/**
 * QQ处理类
 */
class QQ extends Common {
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
QQ.prototype.handle = function(bot, msg) {
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


QQ.prototype.requestCode = async function(url) {
	let txhelper = {
		url: url.replace('ssl.captcha.qq.com', 'txhelper.glitch.me')
	}
	txhelper.req = await fetch(txhelper.url).catch((err) => console.log(err.toString()))

	if (!txhelper.req.ok) return false

	txhelper.req = await txhelper.req.text()
	if (!txhelper.req.includes('使用请求码')) return false

	txhelper.code = /\d+/g.exec(txhelper.req)
	if (!txhelper.code) return false

	console.log(`\n请打开滑动验证app，输入请求码【${txhelper.code}】，然后完成滑动验证\n`)

	$.sleep(200)
	await inquirer.prompt({
		type: 'Input',
		message: '验证完成后按回车确认，等待在操作中...',
		name: 'enter'
	})

	txhelper.res = await fetch(txhelper.url).catch((err) => console.log(err.toString()))
	if (!txhelper.res) return false
	txhelper.res = await txhelper.res.text()

	if (!txhelper.res) return false
	if (txhelper.res == txhelper.req) {
		console.log('\n未完成滑动验证')
		return false
	}

	console.log(`\n获取ticket成功：\n${txhelper.res}\n`)
	return txhelper.res.trim();
}

QQ.prototype.message = async function(bot, msg) {
	console.log("消息", msg);
	// 非发送给自己的情况下才执行
	if (!msg.self()) {
		var ret;
		var e = _this.handle(bot, msg);
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
	e.reply("hello world", true) //true表示引用对方的消息
}

QQ.prototype.run = async function(account) {
	if (!account) {
		account = "defualt";
	}
	var _this = this;
	var client = new Client(this.config);
	// 选择登录方式
	client.platform = this.config.platform;
	// 防止目录错误
	client.data_dir = "/data".fullname();
	
	client.on("system.online", function() {
		if (!_this.config.master) {
			return;
		}
		var msg =
			`欢迎使用【超级美眉机器人 v${$.package.version || '1.0.0'}】\n【#帮助】查看指令说明\n【#状态】查看运行状态\n【#日志】查看运行日志\n【#更新】拉取github更新\n【#全部更新】更新全部插件\n【#更新日志】查看更新日志\n【#重启】重新启动\n【#配置ck】配置公共查询cookie`

		setTimeout(() => this.replyPrivate(_this.config.master, msg), 1000);
	});
	client.on('system.login.device', async (e) => {
		global.inputTicket = false
		console.log(`\n\n------------------ ↓↓设备锁验证↓↓ ----------------------\n`)
		const ret = await inquirer.prompt([{
			type: 'list',
			name: 'type',
			message: '触发设备锁验证，请选择验证方式:',
			choices: ['1.网页扫码验证', '2.发送短信验证码到密保手机']
		}])

		$.sleep(200)

		if (ret.type == '1.网页扫码验证') {
			console.log('\n' + e.url.green + '\n')
			console.log('请打开上面链接，完成验证后按回车')
			await inquirer.prompt({
				type: 'Input',
				message: '等待操作中...',
				name: 'enter'
			})
			await client.login()
		} else {
			console.log('\n')
			client.sendSmsCode()
			$.sleep(200)
			console.info(`验证码已发送：${e.phone}\n`.blue)
			let res = await inquirer.prompt({
				type: 'Input',
				message: '请输入短信验证码:',
				name: 'sms'
			})
			await client.submitSmsCode(res.sms)
		}
	});
	client.on('system.login.error', async (e) => {
		if (Number(e.code) === 1) {
			$.log.error('QQ密码错误，运行命令重新登录：npm run login')
		} else if (global.inputTicket && e.code == 237) {
			$.log.error(`ticket 输入错误或者已失效，已停止运行，请重新登录验证`)
		} else if (e.message.includes('冻结')) {
			$.log.error('账号已被冻结，已停止运行')
		} else {
			$.log.error('登录错误，已停止运行。\n错误码: ' + e.code + "，错误提示：" + e.message)
		}

		process.exit()
	});
	client.on('system.login.slider', async function(e) {
		inSlider = true
		console.log(`\n\n------------------ ↓↓滑动验证链接↓↓ ----------------------\n`)
		console.log(e.url.green)
		console.log('\n--------------------------------------------------------')
		console.log(`提示：打开上面链接获取ticket，可使用【滑动验证app】获取`.blue)
		console.log(`链接存在有效期，请尽快操作，多次操作失败可能会被冻结`.blue)
		console.log('滑动验证app下载地址：https://wwp.lanzouy.com/i6w3J08um92h 密码:3kuu\n'.blue)

		const ret = await inquirer.prompt([{
			type: 'list',
			name: 'type',
			message: '触发滑动验证，需要获取ticket通过验证，请选择获取方式:',
			choices: ['1.手动获取ticket', '2.滑动验证app请求码获取']
		}])

		$.sleep(200)
		let ticket

		if (ret.type == '2.滑动验证app请求码获取') {
			ticket = await _this.requestCode(e.url)
			if (!ticket) console.log('\n请求错误，返回手动获取ticket方式\n')
		}

		if (!ticket) {
			let res = await inquirer.prompt({
				type: 'Input',
				message: '请输入ticket:',
				name: 'ticket',
				validate(value) {
					if (!value) return 'ticket不能为空'
					if (value.toLowerCase() == 'ticket') return '请输入获取的ticket'
					if (value == e.url) return '请勿输入滑动验证链接'
					return true
				}
			})
			ticket = res.ticket.trim('"')
		}
		global.inputTicket = true;
		this.submitSlider(ticket.trim());
	});

	client.on("system.login.qrcode", function(e) {
		// 扫码后按回车登录
		process.stdin.once("data", () => {
			this.login()
		})

		console.log(`请使用登录当前QQ的手机扫码完成登录，如果显示二维码过期，可以按 '回车键（Enter）' 刷新`)

		/** 获取扫码结果 */
		let time = 0
		let interval = setInterval(async () => {
			time++
			let res = await client.queryQrcodeResult()
			if (res.retcode === 0) {
				console.log('\n')
				console.info('扫码成功，开始登录..'.bule)
				console.log('\n')
				$.sleep(1000)
				client.qrcodeLogin()
				clearInterval(interval)
			}
			if (time >= 150) {
				clearInterval(interval)
				console.error('等待扫码超时，已停止运行'.red)
				process.exit()
			}
		}, 2000)

		/** 刷新二维码 */
		inquirer.prompt({
			type: 'Input',
			message: '回车刷新二维码，等待扫码中...\n',
			name: 'enter'
		}).then(async () => {
			if (inSlider) {
				return
			}
			clearInterval(interval)
			console.log('  重新刷新二维码...\n\n')
			$.sleep(1000)
			client.fetchQrcode()
		})
	});
	client.on("message", async function(msg) {
		_this.message(this, msg);
	}).on("notice", async function(msg) {
		_this.message(this, msg);
	}).on("request", async function(msg) {
		_this.message(this, msg);
	});
	if (this.config.password) {
		await client.login(this.config.account, this.config.password);
	} else {
		await client.login();
	}
	$.qqs[account] = client;
}

// /**
//  * 应用程序处理
//  */
// QQ.prototype.run = async function(e) {
// 	// 接收到的消息
// 	var content = e.msg;
// 	var type = 'text';
// 	if (e.message && e.message.length) {
// 		type = e.message[0].type;
// 	}
// 	var cs = this.getCmdClass(content);

// 	if (cs && cs.cmd_name) {
// 		var from = e.sender;
// 		from.group_id = e.group_id;
// 		from.group_name = e.group_name;

// 		var to = {
// 			nickname: e.bot.nickname,
// 			user_id: e.self_id
// 		}
// 		var ret = await $.app.cmd.run(e, cs, from, to, type, content);
// 		var content = ret.tip || ret.message;
// 		if (content) {
// 			var msg;
// 			if (typeof(content) == 'string') {
// 				if (content.indexOf("<") === 0) {
// 					msg = await $.reply.h5(content);
// 				} else if (content.indexOf('data:') === 0) {

// 				} else if (content.length > $.package.config.to_img_length) {
// 					msg = await $.reply.md(content);
// 				} else {
// 					msg = content;
// 				}
// 			} else {
// 				msg = content;
// 			}
// 			/** 回复 */
// 			await e.reply(msg, false, {
// 				at: $.package.config.at
// 			})
// 		}
// 	}
// }

module.exports = QQ;
const path = require('path');
const Com = require("./com.js");
const Actions = require("./actions.js");

/**
 * 指令
 */
class Cmd extends Com {
	constructor() {
		super();

		// 检索的文件路径
		this.path = "/apps/cmd".fullname();
		// 文件拓展名
		this.extension = "cmd.json";
		this.dir = "/apps";
	}
}

Cmd.prototype.init_after = function() {
	for (var k in this.dict) {
		var o = this.dict[k];
		o.arr = o.info.cmd.map((o) => {
			return o.name;
		});
	}
}

/**
 * 获取指令对应对象
 * @param {String} cmd_name 指令名称
 * @returns {Object} 对象
 */
Cmd.prototype.getClass = function(cmd_name) {
	var obj;

	for (var k in this.dict) {
		var o = this.dict[k];
		if (o.arr.indexOf(cmd_name) !== -1) {
			obj = o;
		}
	}
	return obj;
}


/**
 * 执行指令
 * @param {Object} e 消息处理器
 * @param {String|Object} cmd 指令
 * @param {Object} from 来自角色
 * @param {Object} to 接收角色
 * @param {String} type 类型
 * @param {String} group 群组
 * @param {String} content 用户输入内容
 * @returns {String} 执行结果
 */
Cmd.prototype.request = async function(e, cmd, from, to, type, content) {
	var tip;
	var cs;
	var cmd_name;
	if (typeof(cmd) == 'string') {
		cmd_name = cmd;
		cs = this.getClass(cmd_name);
	} else {
		cs = cmd.obj;
		cmd_name = cmd.cmd_name;
	}
	if (cs) {
		if (!cs.program) {
			var file = cs.func_file;
			if (file) {
				var file = file.fullname();
				if (file.hasFile()) {
					try {
						cs.program = require(file);
					} catch (e) {
						console.error(e);
						tip = `#${cmd_name} 指令执行错误！原因：` + e.message + "\r\n" + file;
					}
				} else {
					tip = "执行错误！原因：脚本文件不存在！\r\n" + file;
				}
			} else {
				tip = `#${cmd_name} 指令不可用！`
			}
		}
		if (cs.program) {
			var script = new Actions(cs.info, cs.program);
			try {
				script.e = e;
				tip = await script.runCmd(cmd_name, from, to, type, content);
			} catch (e) {
				console.error(e);
				tip = "执行错误！原因：" + e.message;
			}

			if (process.env.NODE_ENV == "development" || $.config.mode == "dev" || (process.argv.length > 2 &&
					process.argv[2] == "dev")) {
				cs.program = null;
				// 用完后卸载模块
				var name = require.resolve(cs.func_file.fullname());
				delete require.cache[name];
			}
			script.tip = tip;
			return script;
		}
	} else {
		tip = `#${cmd_name} 指令不存在！`
	}
	return {
		tip
	};
}

module.exports = Cmd;
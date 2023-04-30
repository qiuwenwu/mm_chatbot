const path = require('path');
const Actions = require("./actions.js");

/**
 * 游戏系统公共类
 */
class Com {
	/**
	 * 构造函数
	 */
	constructor() {
		// 字典
		this.dict = {};
		// 数据存储路径
		this.path = "";
		// 文件拓展名
		this.extension = "*.json";
		this.dir = "/data";
	}
}

/**
 * 初始化完成之后
 */
Com.prototype.init_after = function() {

}

/**
 * 初始化地区
 */
Com.prototype.init = function() {
	if (this.path) {
		this.path.addDir();
		var files = $.file.getAll(this.path, this.extension, "");
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			if (file.indexOf($.slash + "tpl") === -1) {
				var m = file.loadJson();
				if (m) {
					var func_file = "";
					if (m.script && m.script.indexOf(this.dir) !== 0 && m.script.indexOf("/root") !== 0) {
						func_file = m.script.fullname(file.dirname()).replace($.runPath, $.slash).replace(/[\\]/g,
							"/");
					}
					this.dict[m.name] = {
						info: $.conf(m, file),
						file,
						func_file
					};
				}
			}
		}
	}
	this.init_after();
}

/**
 * 查询索引
 */
Com.prototype.index = function() {
	var arr = [];
	var rx = /[\u4e00-\u9fa5]/g;
	for (var k in this.dict) {
		if (rx.test(k)) {
			arr.push(k);
		}
	}
	return arr;
}

/**
 * 查询
 * @param {String} name 名称或ID
 * @param {Object} model 默认对象
 */
Com.prototype.get = function(name, model) {
	var obj = this.dict[name];
	if (!obj) {
		if (model) {
			return this.add(name, model);
		} else {
			return null;
		}
	}
	return obj.info;
}

/**
 * 遍历执行
 */
Com.prototype.eachRun = async function(e, end = true, func_name = 'accept') {
	var ret;
	for (var name in this.dict) {
		ret = await this.run(name, e, end, func_name);
		if (ret && end) {
			if (ret.indexOf("不存在") === -1 && ret.indexOf("异常") === -1) {
				break;
			}
			else {
				ret = null;
			}
		}
	}
	return ret;
}

/**
 * 运行脚本
 * @param {String} name 名称
 * @param {Object} obj 对象
 * @param {String|Object} target 目标
 * @param {String} func_name 执行方法
 */
Com.prototype.run = async function(name, obj, target, func_name = 'use') {
	var tip;
	var cs = this.dict[name];
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
						tip = `【${name}】执行错误！原因：` + e.message + "\r\n" + file;
					}
				} else {
					tip = "执行错误！原因：脚本文件不存在！\r\n" + file;
				}
			} else {
				tip = `【${name}】不可使用！`
			}
		}
		if (cs.program) {
			var action = new Actions(cs.info, cs.program);

			try {
				tip = action[func_name](obj, target);
			} catch (e) {
				console.error(e);
				tip = "执行错误！原因：" + e.message;
			}

			// if (tip === undefined) {
			// 	tip = name + ' 代码不规范，执行完成但返回null'
			// }
			if (process.env.NODE_ENV == "development" || $.config.mode == "dev" || (process.argv.length > 2 &&
					process.argv[2] == "dev")) {
				cs.program = null;
				// 用完后卸载模块
				var name = require.resolve(cs.func_file.fullname());
				delete require.cache[name];
			}
		} else {
			tip = `【${name}】脚本异常！`
		}
	} else {
		tip = `【${name}】不存在！`
	}
	return tip;
}

/**
 * 创建
 * @param {String} name 名称
 * @param {Object} model 数据模型
 */
Com.prototype.add = function(name, model) {
	var file = ("./" + name + "/" + this.extension).fullname(this.path);
	file.addDir();
	var f = file.replace($.slash + name + $.slash, $.slash + 'tpl' + $.slash);
	var m = f.loadJson();
	if (model) {
		model = Object.assign(m || {}, model, {
			name
		});
	} else {
		model = Object.assign(m || {}, {
			name
		});
	}
	file.saveJson(model);
	this.dict[name] = {
		info: $.conf(Object.assign({}, model, {
			name
		}), file),
		file
	};
	return this.dict[name].info;
};

/**
 * 删除
 * @param {String} idOrName 唯一标识或名称
 * @returns 返回ID
 */
Com.prototype.del = function(idOrName) {
	var obj = this.dict[idOrName];
	if (!obj) {
		return idOrName + " 不存在！";
	}
	var dir = obj.file.dirname();
	obj.file.delFile();
	delete this.dict[idOrName];
	dir.delDir();
}

module.exports = Com;
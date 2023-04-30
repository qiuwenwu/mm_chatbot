module.exports = {
	async init() {

	},
	async accept(e) {
		if (e.content.indexOf("接收示例") !== -1) {
			return "接收示例成功！";
		}
		if (e.from.nickname.indexOf("说说") !== -1) {
			if (e.type == "image") {
				var pic = await e.bot.toFileBox();
				if (pic) {
					e.reply({
						type: "image",
						file: pic.stream
					});
				}
			}
		}
	},
	/**
	 * 执行指令
	 * @param {String} cmd_name 指令名称
	 * @param {Object} from 来自角色
	 * @param {Object} to 接收角色
	 * @param {String} type 类型
	 * @param {String} content 用户输入的内容
	 * @returns {String} 执行结果
	 */
	async main(cmd_name, from, to, type, content) {
		// this.e.reply("也可以这样回复");
		var msg;
		switch (cmd_name) {
			case "指令示例":
				msg = "hello world！";
				break;
			case "访问网页":
				console.log("访问网页");
				var http = $.http();
				// get请求或者post请求，参数为：网址，查询参对象query，提交参对象body，协议头headers
				// var res = http.post("https://xxx/api/game/role");
				var res = await http.get("https://www.baidu.com");
				console.log("访问结果", res.body);
				msg = "访问网页完成，请到控制台查看效果！";
				break;
			case "操作配置":
				console.log("操作配置");
				// 直接操作配置 第一个参数如果为空，则先加载配置，然后再通过set保存
				var config = $.conf(null, "./demo.json");
				console.log("原来配置", config);
				config.name = "小白";
				config.age = 26;
				console.log("操作配置", config);
				msg = "操作配置修改，请查看配置文件！";
				break;
			case "操作数据库":
				console.log("开始操作数据库");
				// 数据库连接参数
				var config = {
					// 服务器地址
					"host": "127.0.0.1",
					// 端口号
					"port": 3306,
					// 账号
					"user": "root",
					// 密码
					"password": "Asd159357",
					// 数据库名称
					"database": "super_bot"
				};
				// 新建mysql连接池（下次直接调用$.sql即可），无需设置配置和打开连接
				var sql = $.mysql_admin('sys');
				// 设置mysql连接参数
				sql.setConfig(config);
				// 打开mysql连接
				sql.open();

				// 实例化一个数据库管理器
				var db = sql.db();
				// 要操作的数据表
				db.table = "user_account";

				// 查询一个列表数据，参数为查询条件对象
				var list = await db.get({
					state: 1
				});
				console.log("操作结果", list);

				// 修改数据，参数分别为：查询条件对象，修改对象
				var bl = await db.set({
					state: 0
				}, {
					state: 1
				});
				console.log("操作结果", bl);

				// 表主键，可不填写，但填写后若再查一条数据，查到的对象修改属性值会直接同步到数据库中
				db.key = "user_id";
				// 获取一条数据，传入一个对象参数作为查询条件
				var obj = await db.getObj({
					username: "admin"
				});

				obj.nickname = "白马快枪手";

				obj.gm = 5;
				obj.vip = 5;
				console.log("数据库结果", obj);

				// 直接SQL语句
				var ret = await db.run("select count(*) from user_account");
				console.log("操作结果", ret);
				msg = "数据库操作完成，请查看数据库变化！";
				break;
			case "正则匹配":
				msg = "触发了正则匹配指令";
				break;
			case "前缀匹配":
				msg = "触发了前缀匹配指令";
				break;
			case "后缀匹配":
				msg = "触发了后缀匹配指令";
				break;
			case "包含匹配":
				msg = "触发了包含匹配指令";
				break;
			case "测试markdown":
				msg = await $.reply.md("这是一个markdown信息");
				break;
			case "测试图片":
				msg = await $.reply.img(
					"https://cbu01.alicdn.com/img/ibank/O1CN01xXIyjz1bhfoEthSTs_!!2209746473497-0-cib.jpg"
				);
				break;
			case "测试转发":
				this.e.send(from.wechat_uuid, content.replace("#测试转发", ""));
				msg = null;
				break;
			default:
				break;
		}
		console.log("来了CMD", cmd_name, from, to, type, content);
		return msg;
	}
}
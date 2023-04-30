const lodash = require('lodash');
const chokidar = require('chokidar');
const puppeteer = require('puppeteer');
const {
	segment
} = require('icqq');
const {
	marked
} = require('marked');

const _path = process.cwd();

class Puppeteer {
	constructor() {
		this.browser = false
		this.lock = false
		this.shoting = []
		/** 截图数达到时重启浏览器 避免生成速度越来越慢 */
		this.restartNum = 100
		/** 截图次数 */
		this.renderNum = 0
		this.config = {
			headless: true,
			args: [
				'--disable-gpu',
				'--disable-setuid-sandbox',
				'--no-sandbox',
				'--no-zygote'
			]
		}

		if ($.config.bot?.chromium_path) {
			/** chromium其他路径 */
			this.config.executablePath = $.config.bot.chromium_path
		}

		this.html = {}
		this.watcher = {}
		'./data/html'.addDir();
	}

	/**
	 * 初始化chromium
	 */
	async browserInit() {
		if (this.browser) return this.browser
		if (this.lock) return false
		this.lock = true

		$.log.info('puppeteer Chromium 启动中...')

		/** 初始化puppeteer */
		this.browser = await puppeteer.launch(this.config).catch((err) => {
			if (typeof err == 'object') {
				$.log.error(JSON.stringify(err))
			} else {
				$.log.error(err.toString())
				if (err.toString().includes('Could not find Chromium')) {
					$.log.error(
						'没有正确安装Chromium，可以尝试执行安装命令：node ./node_modules/puppeteer/install.js')
				}
			}
		})

		this.lock = false
		if (!this.browser) {
			$.log.error('puppeteer Chromium 启动失败')
			return false
		}
		$.log.info('puppeteer Chromium 启动成功')

		/** 监听Chromium实例是否断开 */
		this.browser.on('disconnected', (e) => {
			$.log.error('Chromium实例关闭或崩溃！')
			this.browser = false
		})

		return this.browser
	}

	/**
	 * `chromium` 截图
	 * @param data 模板参数
	 * @param data.tplFile 模板路径，必传
	 * @param data.saveId  生成html名称，为空name代替
	 * @param data.imgType  screenshot参数，生成图片类型：jpeg，png
	 * @param data.quality  screenshot参数，图片质量 0-100，jpeg是可传，默认90
	 * @param data.omitBackground  screenshot参数，隐藏默认的白色背景，背景透明。默认不透明
	 * @param data.path   screenshot参数，截图保存路径。截图图片类型将从文件扩展名推断出来。如果是相对路径，则从当前路径解析。如果没有指定路径，图片将不会保存到硬盘。
	 * @return oicq img
	 */
	async screenshot(name, data = {}) {
		if (!await this.browserInit()) {
			return false
		}

		let savePath = this.dealTpl(name, data)
		if (!savePath) return false

		let buff = ''
		let start = Date.now()

		this.shoting.push(name)

		try {
			const page = await this.browser.newPage()
			await page.goto(`file://${savePath}`, data.pageGotoParams || {})
			let body = await page.$('#container') || await page.$('body')

			let randData = {
				// encoding: 'base64',
				type: data.imgType || 'jpeg',
				omitBackground: data.omitBackground || false,
				quality: data.quality || 90,
				path: data.path || ''
			}

			if (data.imgType == 'png') delete randData.quality

			if (data.width) {
				if (data.height) {
					await page.setViewport({
						width: data.width,
						height: data.height
					});
				} else {
					await page.setViewport({
						width: data.width,
						height: Math.round(data.width / 414 * 896)
					});
				}
			}

			buff = await body.screenshot(randData)

			page.close().catch((err) => $.log.error(err))
		} catch (error) {
			$.log.error(`图片生成失败:${name}:${error}`)
			/** 关闭浏览器 */
			if (this.browser) {
				await this.browser.close().catch((err) => $.log.error(err))
			}
			this.browser = false
			buff = ''
			return false
		}

		this.shoting.pop()

		if (!buff) {
			$.log.error(`图片生成为空:${name}`)
			return false
		}

		this.renderNum++

		/** 计算图片大小 */
		let kb = (buff.length / 1024).toFixed(2) + 'kb'

		$.log.info(`[图片生成][${name}][${this.renderNum}次] ${kb} ${`${Date.now() - start}ms`}`);

		this.restart()
		
		return segment.image(buff);
	}

	/** 模板 */
	dealTpl(name, data) {
		let {
			tplFile,
			saveId = name
		} = data;
		let savePath = `./data/html/${name}/${saveId}.html`.fullname()
		savePath.addDir();

		/** 读取html模板 */
		if (!this.html[tplFile]) {
			try {
				this.html[tplFile] = tplFile.loadText();
			} catch (error) {
				$.log.error(`加载html错误：${tplFile}`)
				return false
			}

			this.watch(tplFile)
		}

		data.resPath = `${_path}/resources/`

		/** 替换模板 */
		let tmpHtml = $.tpl.render(this.html[tplFile], Object.assign({}, data, data.model || {}))

		/** 保存模板 */
		savePath.saveText(tmpHtml);

		$.log.debug(`[图片生成][使用模板] ${savePath}`);
		return savePath
	}

	/** 监听配置文件 */
	watch(tplFile) {
		if (this.watcher[tplFile]) return

		const watcher = chokidar.watch(tplFile)
		watcher.on('change', path => {
			delete this.html[tplFile]
			$.log.info(`[修改html模板] ${tplFile}`)
		})

		this.watcher[tplFile] = watcher
	}

	/** 重启 */
	restart() {
		/** 截图超过重启数时，自动关闭重启浏览器，避免生成速度越来越慢 */
		if (this.renderNum % this.restartNum == 0) {
			if (this.shoting.length <= 0) {
				setTimeout(async () => {
					if (this.browser) {
						await this.browser.close().catch((err) => $.log.error(err))
					}
					this.browser = false
					console.info('puppeteer 关闭重启...')
				}, 100)
			}
		}
	}

	toImg(html_path, model, options = {}) {
		if (html_path.indexOf('.html') === -1) {
			html_path = `./tpl/${html_path}.html`.fullname($.runPath);
		}
		options.tplFile = html_path;
		options.model = model;
		return this.screenshot(html_path.basename().replace(".html", ""), options);
	}

	h5(html, options = {}) {
		var html_path = 'h5';
		var model = {
			html: html
		};
		options.width = options.width ? options.width : 414
		return this.toImg(html_path, model, options);
	}

	md(text, options = {}) {
		var html_path = 'markdown';
		var model = {
			markdown: marked.parse(text)
		};
		options.width = options.width ? options.width : 414
		return this.toImg(html_path, model, options);
	}

	/**
	 * 输出图片
	 * @param {String} image 图片网址或base64
	 * @param {Boolean} cache 是否缓存
	 * @param {Number} timeout 生成超时时间
	 */
	img(image, cache, timeout) {
		return segment.image(image, cache, timeout);
	}
	/**
	 * 输出视频
	 * @param {String} video 视频网址或base64
	 */
	video(video) {
		return segment.video(video);
	}
	/**
	 * 输出XML卡片
	 * @param {String} xml 卡片内容
	 */
	xml(xml) {
		return segment.xml(xml);
	}
	/**
	 * 输出JSON卡片
	 * @param {String} json 卡片内容
	 */
	json(json) {
		return segment.json(json);
	}
	/**
	 * 输出JSON卡片
	 * @param {String} url 网址
	 * @param {String} title 标题
	 * @param {String} image 图片
	 * @param {String} content 内容
	 */
	share(url, title, image, content) {
		return segment.share(url, title, image, content);
	}
}

$.reply = new Puppeteer();

/**
 * 判断是否管理员
 * @param {Object} user
 */
$.isGM = function(user) {
	var user_id = 0;
	if (typeof(user) == "string") {
		user_id = Number(user);
	} else if (typeof(user) == "object") {
		user_id = user.user_id;
	} else {
		user_id = user;
	}
	var bl = $.config.masterQQ.includes(user_id);
	return bl
}
require("mm_expand");
$.runPath = __dirname + $.slash;

const MM_chatbot = require('../index.js');

var mode = process.argv[2];
$.config = `./config/${mode}.json`.loadJson();

var bot = new MM_chatbot($.config);

bot.runC();
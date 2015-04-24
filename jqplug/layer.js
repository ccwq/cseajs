/**
* 鉴于layer不能改变和内部资源的相对未知，故使用加载器引用
* */

define(function(require){
	var layer = require("./layer/layer");
	layer.config({
	    path: require.resolve("./") + "layer/"
	});
    return layer;
});
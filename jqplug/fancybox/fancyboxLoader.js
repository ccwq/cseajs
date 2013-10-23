//docurment ready前执行

(function(){
	var script = $("script[src*=fancyboxLoader]");
	if(script.length==0){
		throw "请勿修改文件名";
		return ;
	}

	var dir = pathInfo(script[0].src).dir;
    if(!$.fancybox) loader(dir + "jquery.fancybox-1.3.4.js");       //如果存在就不再加载
	loader(
		dir + "jquery.fancybox-1.3.4.css",
		dir + "fancyboxPlus.js"
	);
	return;
	////////////////////////////////////////////

	function pathInfo(path){
		if(/(.*\/)([^\/]*)\.(\w{1,5})$/.test(path)){
			return {dir:RegExp["$1"],fname:RegExp["$2"],ftype:RegExp["$3"]};
		}
		return null;
	}

	function loader(){
		for(var i=0;i<arguments.length;i++){
			var src = arguments[i];
			if(/css$/.test(typeof src == "string"?src:src.src)){
				loadcss(src);
			}else{
				loadscript(src);
			}
		}
	}

	function loadcss(src){
		document.write("<link rel=\"stylesheet\" href=\"{src}\"/>".replace("{src}",src));
	}
	function loadscript(src){
		document.write('<script src="{src}"></script>'.replace("{src}",src));
	}
})();

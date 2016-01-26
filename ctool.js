/*ctool no jquery*/
define(function (require) {
    var ctool = {noop:function(){ }};

    //存留一份全局ctool到ctool.ctl
    if(window.ctool){
        ctool.ctl = window.ctool;
        ctool.root = window.ctool.root;
    }

    (function(){
        /*让ie支持indexOf*/
        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function(elt, from) {
                var len = this.length >>> 0;
                var from = Number(arguments[1]) || 0;
                from = (from < 0) ? Math.ceil(from) : Math.floor(from);
                if (from < 0) from += len;
                for (; from < len; from++) {
                    if (from in this && this[from] === elt) return from;
                }
                return - 1;
            };
        }
    })();

    (function(){
        /*
         *浏览器兼容性判断(不缺分大小写)
         * bro("ie6")        //true|false
         * bro("ie6,fF")     //true|false
         * bro()            // ie6 | ff |
         * */
        var map = {op:"Opear",mx:"Maxthon",sf:"Safari",ch:"Chrome",ot:"Other",ff:"FF"};
        var reverse_map ={};    //反映射
        for(var k in map){reverse_map[map[k]]=k;};
        function bro(typeString,reTest){
            if(typeString===undefined){
                if(bro.bro_type)    return bro.bro_type;
                else return bro.bro_type = myBrowser().toLowerCase();
            }

            if(bro.cacheData && bro.cacheData[typeString]!=undefined &&!reTest)   return bro.cacheData[typeString];     //类型判断缓存
            //--浏览器判断
            typeString = typeString.toLowerCase();
            var bro_short_name = myBrowser();
            var returnVal = typeString.indexOf(bro_short_name) != -1;
            bro.cacheData=bro.cacheData || {};
            bro.cacheData[typeString] = returnVal;
            return returnVal;

            //private
            function myBrowser(){
                //浏览器判断
                var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
                var isOpera  =  userAgent.indexOf("Opera")  != -1;
                var isChorme =  userAgent.indexOf("Chrome") != -1;
                var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE
                if (isIE) {
                    var IE5 = IE55 = IE6 = IE7 = IE8 = false;
                    var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
                    reIE.test(userAgent);
                    var vstring = RegExp["$1"].replace(".0","").replace(".","_");
                    return "ie"+vstring;
                }

                if (userAgent.indexOf("Firefox") > -1)      return reverse_map["FF"];
                if (isOpera)                                return reverse_map["Opera"];
                if (userAgent.indexOf("Maxthon") > -1)      return reverse_map["Maxthon"];
                if (userAgent.indexOf("Safari") > -1 && !isChorme)
                    return reverse_map["Safari"];
                if (isChorme)                               return reverse_map["Chrome"];
                return reverse_map["Other"];
            } //myBrowser() end
        };
        ctool.bro=bro;
        bro.cls = function(){ return "_" + bro(); }
        bro._ = "_" + bro();


        /**
         * 使ie支持css3 媒体查询
         * todo 在ie7上，可能会使某些元素，奇怪的小消失
         */
        ctool.mediaQueryIE = function(bro_v_str, callback){
            bro_v_str = bro_v_str || "ie6,ie7,ie8";
            callback = callback || ctool.noop;
            ctool.log("该插件可能在ie上可能会引起一些bug，比如元素消失什么的，请谨慎使用");
            if(bro(bro_v_str)){
                require.async("css3-mediaqueries",function(){
                    callback.call();
                });
            }
        }


        /**
         * 调用selectivizr
         * 使ie支持[attr] [attr=] [attr~=][attr|=] :nth-child :not等 css高级选择器
         * */
        ctool.boostIESelector = function(){
            if(bro("ie6,ie7,ie8"))
                require.async("$/selectivizr");
        }

        /**
         * 增加浏览器标示符到html的class
         */
        ctool.add_bro_sign = function(){
            var ht = document.getElementsByTagName("html")[0];
            var attrName = bro("ie6,ie7,ie8,ie9")?"className":"class";
            var org_cls = ht.getAttribute(attrName);
            if(org_cls) org_cls=org_cls + " ";
            ht.setAttribute(attrName,  org_cls + bro._);
        }


        /*
         * 最大化缩放至容器内部
         * */
        function fit_on_container(continerWH, picWH, space){
            if(!space)  space=0;
            var cw = continerWH[0] - space,ch = continerWH[1] - space;
            var pw = picWH[0],ph = picWH[1];
            var cn = cw / ch,pn = pw / ph;
            var tmpArr=(cn < pn)?[cw, cw / pn]:[ch * pn, ch];
            tmpArr.push((cw - tmpArr[0] + (cn < pn?space:0) )*0.5);
            tmpArr.push((ch - tmpArr[1] + (cn > pn?space:0) )*0.5);
            tmpArr.css={width:tmpArr[0],height:tmpArr[1],left:tmpArr[2],top:tmpArr[3]};
            return tmpArr;
        }
        ctool.fit_on_container = fit_on_container;

        //最大化等比剪裁
        function max_on_container(continerWH, picWH, space) {
            if(!space)  space=0;
            var cw = continerWH[0] - space,ch = continerWH[1] - space;
            var pw = picWH[0],ph = picWH[1];
            var cn = cw / ch,pn = pw / ph;
            var tmpArr=(cn > pn)?[cw, cw / pn]:[ch * pn, ch];
            tmpArr.push((cw - tmpArr[0]));
            tmpArr.push((ch - tmpArr[1]));
            tmpArr.css={width:tmpArr[0],height:tmpArr[1],left:tmpArr[2],top:tmpArr[3]};
            return tmpArr;
        };
        ctool.max_on_container = max_on_container;

        ctool.getHideBox = function(){
            throw "该方法已经迁移至ctooj！";
        };

        /*
         * 图片预加载
         * para = {}        //传入数据，图片加载结束后，作为毁掉函数的参数传出
         * no_error_replace : false;//图片加载错误的时候，是否禁止加载默认图代替原图
         * */
        function imgPreLoad(url_paras, callback, isLoadDefaultPic) {
            var url,paras;
            if(!url_paras){
                throw "传入参数为空！";
            }else if(typeof url_paras == "string"){
                url = url_paras;
                paras  = {};
            }else if(typeof url_paras == "object"){
                paras = url_paras;
                url = paras.url;
            }else{
                throw "url_paras参数1不正确";
            }
            var img = new Image();
            img.onload = function () {
                if(callback){
                    callback.call(img, {paras:paras});
                    callback = null;
                }
            };
            img.onerror = function () {
                if(paras && paras.no_error_replace)   return;         //加载错误时禁止去加载默认图
                if(!paras) paras = {};
                paras.origUrl = url;
                paras.url = paras.errurl || ctool.err_img_url || window.err_img_url;
                isLoadDefaultPic || imgPreLoad(paras, function () {
                    callback && callback.call(this, {error: true,paras:paras});
                }, true);
            }

            img.src = url;

            if (img.complete) {
                if(callback){
                    callback.call(img, {paras:paras});
                    callback = null;
                }
                return;
            }


        };
        ctool.imgPreLoad = imgPreLoad;

        //调试 firebug
        function debugStart(){(function(F,i,r,e,b,u,g,L,I,T,E){if(F.getElementById(b))return;E=F[i+'NS']&&F.documentElement.namespaceURI;E=E?F[i+'NS'](E,'script'):F[i]('script');E[r]('id',b);E[r]('src',I+g+T);E[r](b,u);(F[e]('head')[0]||F[e]('body')[0]).appendChild(E);E=new Image;E[r]('src',I+L);})(document,'createElement','setAttribute','getElementsByTagName','FirebugLite','4','firebug-lite-debug.js','releases/lite/debug/skin/xp/sprite.png','https://getfirebug.com/','#startOpened');};
        if(1+ location.href.indexOf("debug")) debugStart();
        ctool.firebug = debugStart;
        window.firebug = debugStart;

        /*
         *字符串截取,
         * n  整数 5英文字符
         * n  文本 5中文字符
         *       例子: strleng("dd",1)           //d
         *             strleng("ddssd","2")      //ddss
         */
        function strleng(str,n,more_sign){
            more_sign = more_sign || "..."
            var strReg=/[^\x00-\xff]/g,  _str=str.replace(strReg,"**"),  _len=_str.length;
            if(typeof n == "string")    n=n*2;
            if(_len>n){
                var _newLen=Math.floor(n/2),_strLen=str.length
                for(var i=_newLen;i<_strLen;i++){
                    var _newStr=str.substr(0,i).replace(strReg,"**");
                    if(_newStr.length>=n) return str.substr(0,i) + more_sign;
                }
            }else   return str;
        };
        ctool.strleng = strleng;
        String.prototype.strleng = function(word_num,mor_sign){return strleng(this,word_num||10,mor_sign);}


        /*
         * url参数反序列化
         * */
        var urlParas = function(url) {
            url = url||location.href;
            var urlObject = {};
            if (/\?/.test(url)) {
                var urlString = url.substring(url.indexOf("?")+1);
                var urlArray = urlString.split("&");
                for (var i=0, len=urlArray.length; i<len; i++) {
                    var urlItem = urlArray[i];
                    var item = urlItem.split("=");
                    urlObject[item[0]] = item[1];
                }
            }
            return urlObject;
        };
        ctool.urlParas = urlParas;


        /**
         * 节流阀
         * throttle / debounce - v1.1 - 3/7/2010
         * http://benalman.com/projects/jquery-throttle-debounce-plugin/
         * Copyright (c) 2010 "Cowboy" Ben Alman
         * Dual licensed under the MIT and GPL licenses.
         * http://benalman.com/about/license/
         */
        (function(window,undefined){
            var $ = ctool, jq_throttle;
            /*像机关枪，把持续的小间隔的执行，转换为自定义间隔*/
            $.throttle = jq_throttle = function( delay, no_trailing, callback, debounce_mode ) {
                var timeout_id, last_exec = 0;
                if ( typeof no_trailing !== 'boolean' ) {
                    debounce_mode = callback;  callback = no_trailing;   no_trailing = undefined;
                }
                function wrapper() {
                    var that = this, elapsed = +new Date() - last_exec, args = arguments;
                    function exec() {
                        last_exec = +new Date();
                        callback.apply( that, args );
                    };
                    function clear() {
                        timeout_id = undefined;
                    };
                    if ( debounce_mode && !timeout_id ) {
                        exec();
                    }
                    timeout_id && clearTimeout( timeout_id );
                    if ( debounce_mode === undefined && elapsed > delay ) {
                        exec();
                    } else if ( no_trailing !== true ) {
                        timeout_id = setTimeout( debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay );
                    }
                };
                if ( $.guid ) {
                    wrapper.guid = callback.guid = callback.guid || $.guid++;
                }
                return wrapper;
            };

            /*持续执行n久，中断n时间后执行*/
            $.debounce = function( delay, at_begin, callback ) {
                return callback === undefined
                    ? jq_throttle( delay, at_begin, false )
                    : jq_throttle( delay, callback, at_begin !== false );
            };
        })(this);

        /**
         *css loader css加载器
         * */
        (function(){
            function loadcss(url_segment,is_prepend_mode){
                var link = document.createElement("link");
                var head = document.getElementsByTagName("head")[0];
                link.rel = "stylesheet";
                link.href = window.ctool.root + url_segment;
                head[is_prepend_mode?"prepend":"appendChild"](link);
            }
            ctool.loadcss = loadcss;
        })();


        /*
         * 过滤html代码中body之外的部分
         * */
        function filter_html_in_body(data){
            var bodyInner_start = data.search(/(<body[^>]*?>)/);
            if(bodyInner_start==-1){
                throw "未找到body开始标签!";
            }
            var body_str = RegExp["$1"];
            var bodyInner_end = data.indexOf("</body>");
            if(bodyInner_end == -1){
                throw "未找到body结束标签!";
            }
            return data.substring(bodyInner_start + body_str.length,bodyInner_end);
        }
        ctool.filter_html_in_body = filter_html_in_body;


        //获取scrollElement       //目前有副作用，会使刷新后的页面回到顶端
        !function(){
            ctool.getScrollEle = function(){
                var scrollEle;
                document.body.scrollTop = document.documentElement.scrollTop = 1;
                if(document.body.scrollTop!==0) scrollEle = document.body;
                else scrollEle = document.documentElement;
                scrollEle.scrollTop = 0;
                return ctool.scrollElement = scrollEle;
            }


            function scrollY(val){

                if(val===undefined)
                    return (
                        window.pageYOffset                   || //用于FF
                        document.documentElement.scrollTop   ||
                        document.body.scrollTop              ||
                        0
                    );
                window.scrollTo(scrollX(), val);
            }

            function scrollX(val){
                if(val===undefined)
                    return (
                        window.pageXOffset                   || //用于FF
                        document.documentElement.scrollLeft   ||
                        document.body.scrollLeft              ||
                        0
                    );
                window.scrollTo(val, scrollY());
            }

            ctool.scrollX = scrollX;
            ctool.scrollY = scrollY;
        }();
        //bottom
    })();



    !function(){
        /**
         * @year {number} 年份四位数
         * @month {number} 月份
         * */
        ctool.dayNumOfMonth = function(year,month){
            return new Date(Year,Month,0).getDate();
        }
    }();

    !function(){
        var regCache = {}; //避免建立太多的RegExp对象
        /**
         * 增加replaceAll方法
         * */
        String.prototype.replaceAll = function(s1, s2) {
            var reg = regCache[s1] || (regCache[s1]=new RegExp(s1, "gm"));
            return this.replace(reg, s2); //g全局
        }
    }();

    //log
    !function(){
        /**
         * 参数可以任意多
         */
        ctool.log = function(){
            var co = window.console;
            var ar =arguments;
            if(!co)    return;

            var le = ar.length,str="";
            for(var i=0; i<le; i++){
                str+="," + ar[i].toString();
            }
            co.log(str.substr(1));
        };

        /**
         * 支持多参数alert
         */
        ctool.alert = function(){
            var ar =arguments;
            var le = ar.length,str="";
            for(var i=0; i<le; i++){
                str+="," + ar[i].toString();
            }

            alert(str.substr(1));
        }
        getWinCtool().log = ctool.log;
    }();

    //对路径操作的一些正则
    !function(){
        var rgTpl = "([^\/]+\/?){{n}}$";

        /**
         * 截取路径cutPath("/a/c/d/e",3)结果为/a/
         * @param path
         * @param n
         * @returns {*}
         */
        function cutPath(path,n){
            n = n||1;
            var rg = getRegexp(rgTpl.replace("{n}",n));
            return path.replace(rg,"");
        }
        getWinCtool().cutPath = ctool.cutPath = cutPath;


        var folderRg = /([^\/]+)\/[^\/]+$/;

        /**
         * 获取目录名称
         * @param path
         * @returns {*} 返回目录名称或者undefined
         */
        function getFolderName(path){
            if(folderRg.test(path || location.href)){
                return RegExp["$1"];
            }
            return undefined;
        }
        getWinCtool().getFolderName = ctool.getFolderName = getFolderName;



        //提取文件名称正则
        var fileNameRg = /\/([^\/?]+)[?#]?[^\/]*$/;

        /**
         * 获取文件名称，支持提取/abc.aas?ppa#ss;(abc.ass)
         * @param path
         * @returns {*}
         */
        function getFileName(path){
            path = path || location.href;

            if(fileNameRg.test(path)){
                return RegExp["$1"];
            }

            /*path = path.replace(/[#\?].+$/,"");
            if(/\/$/.test(path)){
                return path;
            }*/
            return "";
        }
        getWinCtool().getFileName = ctool.getFileName = getFileName;
    }();



    /**
     * 创建一个Regexp,避免多次创建（使用对象池优化）
     * @param str 字符串
     * @param flag 标志位
     * @returns {Regexp}
     */
    function getRegexp(str,flag){
        flag = flag || "";
        var pool = getRegexp.pool || (getRegexp.pool={});
        var rg = pool[str+flag];
        if(rg) return rg;
        rg = new RegExp(str,flag);
        pool[str+flag] = rg;
        return rg;
    }
    ctool.getRegexp = getRegexp;


    //此ctool为window全局对象。非seajs mould
    function getWinCtool(){
        if(!window.ctool) window.ctool = {};
        return window.ctool;
    }



    /**
     * 用于在html中定义js变量
     * html中应该这样写 <mate id="pagevars" content="path:'root/abc, imgbase:'ddd'"></mate>
     * @param mateId 默认id为pagevars如果用其他的id，请传入id名称
     * @returns {*}
     */
    ctool.getPageVars = function(mateId){
        mateId = mateId || "pagevars";
        var mat = document.getElementById(mateId);
        var obj = {};

        if(!mat){
            ctool.log("未找到#"+mateId+"，参数对象");
            return obj;
        }
        var str = mat.getAttribute("content");
        try{
            obj = eval("({"+str+"})");
        }catch(e){
            ctool.log("页面变量格式错误，将返回空对象");
        }
        return obj;
    };

    /**
     * 判断是否是//doname/index.html | //doname/  | //doname形式的url
     * @param url 地址，形如http://baidu.com;  //baidu.com
     * @returns {boolean}
     */
    ctool.is_index_url = function (url){
        url = url.split(/\?\#/)[0];
        return /(\/\/[^\/]+)($|\/$|\/index\.html)/.test(url)
    }



    /**
     * 取模运算
     * @param be_mod        a%b 中的a
     * @param mod           a%b 中的b
     * @returns {number}    计算结果
     */
    function modp(be_mod,mod){
        return be_mod>=0?(be_mod % mod):(((be_mod%mod)+mod)%mod);
    }

    ctool.modp = modp;

    //数字的原型增加mod
    Number.prototype.mod = function(val){
        return modp(this,val);
    }



    /**
     * 圆减法,举例，表盘上，12点到1点的距离是1个小时，round_subtract(12,1,12) //1
     * @param value         减数
     * @param subtract      被减数
     * @param circle        周期
     */
    function round_subtract(value,subtract, circle){
        value = modp(value,circle);
        subtract = modp(subtract,circle);

        var obj = [
            value - subtract,
            value - (subtract + circle),
            (value + circle) - subtract
        ]
        var min = 9999999,min_i = 0;
        for(var i=0; i<obj.length; i++){
            if(Math.abs(obj[i])<min){
                min = Math.abs(obj[i]);
                min_i = i;
            }
        }

        return obj[min_i];
    }
    ctool.round_subtract = round_subtract;



    /**
     * obj key转换
     * @param object 接收数组或者object。如果是数组，则遍历数组每个元素，来转换key
     * @param transmap
     */
    var trans_obj_key = function(object,transmap){
        //数组自动遍历
        if(object instanceof Array){
            for(var i = 0; i<object.length; i++){
                transkey(object[i], transmap);
            }
        }else{
            for(var ke1 in object){
                var el1 = object[ke1];
                for(var ke2 in transmap){
                    var el2 = transmap[ke2];
                    if(ke1 == ke2){
                        object[el2] = el1;
                        delete object[ke2];
                        continue;
                    }
                }
            };
        }


        return object;
    }

    ctool.trans_obj_key = trans_obj_key;


    /**
     * 调用函数的delayCall方法，可以使函数在规定时间后执行。并且支持改变scope和参数。
     * @param delay 延迟调用的间隔
     * @param scope 改变this。如果传入数组，则表示parselist的内容
     * @param paralist
     * @returns {*}
     */
    Function.prototype.delayCall = function(delay,scope,paralist){
        var m = this;
        if(!m.__delay_timeout_list){
            m.__delay_timeout_list = [];
        }

        //简单判断是否是数组
        //参数校正
        if(ctool.isArray(scope)){
            paralist = scope;
            scope = null;
        }

        delay = delay || 500;

        var stimeout_obj;
        m.__delay_timeout_list.push(
            {
                ti_id:stimeout_obj = setTimeout(function () {
                    m.apply(scope, paralist || []);
                }, delay),
                win:window
            }
        );
        return stimeout_obj;
    }

    /**
     *
     * @param stimeout_obj 如果为空，则清除该函数发起的所有所有延时执行，否则清除特定的延时执行
     */
    Function.prototype.killDelayCall = function(stimeout_obj){
        var m = this;

        //清除特定的delayCall
        if(stimeout_obj){
            clearTimeout(stimeout_obj);
            return;
        }

        if(!m.__delay_timeout_list || !m.__delay_timeout_list.length)   return;

        var dtl = m.__delay_timeout_list;
        for(var i=0; i< dtl.length; i++){
            dtl[i].win.clearTimeout(dtl[i].ti_id);
        }
    }


    /**
     * 数字前自动填充0
     * @param num
     * @param size
     * @returns {string}
     */
    function zfill(num, size) {
        //很长不需要填充
        if((num+"").length > size) return num;
        //补0并剪裁
        var s = "000000000000" + num;
        return s.substr(Math.max(0, s.length - size));
    }

    Number.prototype.zfill = function(size){ return zfill(this,size); }
    ctool.zfill = zfill;


    /**
     * 图片头数据加载就绪事件 - 更快获取图片尺寸
     * @version	2011.05.27
     * @see		http://blog.phpdr.net/js-get-image-size.html
     * @param	{String}	图片路径
     * @param	{Function}	尺寸就绪
     * @param	{Function}	加载完毕 (可选)
     * @param	{Function}	加载错误 (可选)
     * @example imgReady('http://www.google.com.hk/intl/zh-CN/images/logo_cn.png', function () {
		alert('size ready: width=' + this.width + '; height=' + this.height);
	});
     */
    var imgready = (function () {
        var
            list = [],
            intervalId = null,

        // 用来执行队列
            tick = function () {
                var i = 0;
                for (; i < list.length; i++) {
                    list[i].end ? list.splice(i--, 1) : list[i]();
                };
                !list.length && stop();
            },

        // 停止所有定时器队列
            stop = function () {
                clearInterval(intervalId);
                intervalId = null;
            }
            ;

        /**
         * url_data只是两种形式
         * 1，字符串。直接会赋值为图片地址
         * 2，对象，其src属性会被识别为图片地址，本身会被img的data属性所携带，用来携带参数到图片加载成功或者失败的句柄中处理
         */
        return function (url_data, ready, load, error) {
            var onready, width, height, newWidth, newHeight, img = new Image();
            if(typeof url_data == "string"){
                img.src = url_data;
            }else{
                img.data = url_data;
                img.src = url_data.src;
            }


            //传入url为空的情况，直接跳入错误处理
            if(!url_data){
                error && error.call(img);
                return;
            }

            // 如果图片被缓存，则直接返回缓存数据
            if (img.complete) {
                ready.call(img);
                load && load.call(img);
                return;
            };

            width = img.width;
            height = img.height;

            // 加载错误后的事件
            img.onerror = function () {
                error && error.call(img);
                onready.end = true;
                img = img.onload = img.onerror = null;
            };

            // 图片尺寸就绪
            onready = function () {
                newWidth = img.width;
                newHeight = img.height;
                // 如果图片已经在其他地方加载可使用面积检测
                if (newWidth !== width || newHeight !== height || newWidth * newHeight > 1024) {
                    ready.call(img);
                    onready.end = true;
                };
            };
            onready();

            // 完全加载完毕的事件
            img.onload = function () {
                // onload在定时器时间差范围内可能比onready快
                // 这里进行检查并保证onready优先执行
                !onready.end && onready();

                load && load.call(img);

                // IE gif动画会循环执行onload，置空onload即可
                img = img.onload = img.onerror = null;
            };

            // 加入队列中定期执行
            if (!onready.end) {
                list.push(onready);
                // 无论何时只允许出现一个定时器，减少浏览器性能损耗
                if (intervalId === null) intervalId = setInterval(tick, 40);
            };
        };
    })();

    ctool.imgready = imgready;

    /**
     * 对layer进行封装
     * @param is_load_ext 是否加载扩展
     * @param callback 完成的回调
     */
    ctool.layer = function(is_load_ext,callback){
        require.async("$/layer",function(l){
            if(typeof is_load_ext=="function"){
                callback = is_load_ext;
                is_load_ext = false;
            }

            is_load_ext && l.config({
                extend: 'extend/layer.ext.js'
            });
            l.ready(function(){
                callback && callback.call(l,l);
            });
        })
    }


    /**
     * dom ready类似
     * 针对ie6 7特殊处理， 针对已引用jquery的处理
     */
    !function(){
        var isTop,testDiv,scrollIntervalId,isBrowser=typeof window!=="undefined"&&window.document,isPageLoaded=!isBrowser,doc=isBrowser?document:null,readyCalls=[];function runCallbacks(callbacks){var i;for(i=0;i<callbacks.length;i+=1){callbacks[i](doc)}}function callReady(){var callbacks=readyCalls;if(isPageLoaded){if(callbacks.length){readyCalls=[];runCallbacks(callbacks)}}}function pageLoaded(){if(!isPageLoaded){isPageLoaded=true;if(scrollIntervalId){clearInterval(scrollIntervalId)}callReady()}}if(isBrowser){if(document.addEventListener){document.addEventListener("DOMContentLoaded",pageLoaded,false);window.addEventListener("load",pageLoaded,false)}else{if(window.attachEvent){window.attachEvent("onload",pageLoaded);testDiv=document.createElement("div");try{isTop=window.frameElement===null}catch(e){}if(testDiv.doScroll&&isTop&&window.external){scrollIntervalId=setInterval(function(){try{testDiv.doScroll();pageLoaded()}catch(e){}},30)}}}if(document.readyState==="complete"){pageLoaded()}}function domReady(callback){if(isPageLoaded){callback(doc)}else{readyCalls.push(callback)}return domReady}domReady.version="2.0.1";domReady.load=function(name,req,onLoad,config){if(config.isBuild){onLoad(null)}else{domReady(onLoad)}};
        ctool.domReady = (typeof jQuery != "undefined")?jQuery:domReady;
    }();



    //根据 html或者body的某种选择器，来执行相应的函数
    !function(){
        var html_el = document.getElementsByTagName("html")[0];


        /**
         * 传入一个map，根据map的值，决定是否要执行該值对应的func
         *    html:
         *    <html class="foo">
         *    {
         *          ".foo":function(){},//执行
         *          "@/.foo":function(){},         //documeng ready执行
         *          "!/.foo":function(){},          //非 .foo执行
         *          "@!/.foo":function(){}
         *    }
         * @param funcMap
         */
        function rootCondiFunc(bodymode,funcMap,is_dom_ready){
            if(bodymode === true){
                if(!is_dom_ready){
                    ctool.domReady(function(){
                        rootCondiFunc(bodymode, funcMap,true);
                    });
                    return;
                }
                html_el = document.getElementsByTagName("body")[0];
                if(!html_el){
                    alert(888);
                }
            }else{
                funcMap = bodymode;
            }
            for(k in funcMap){
                var el = funcMap[k];
                var isDomReady = false;         //dom构成后执行
                var isrevert = false;           //条件不符合执行
                var sel = k;
                if(/^([!@]{1,2})\/(.+)/.test(k)){
                    var flags = RegExp["$1"];
                    isDomReady = flags.indexOf("@")!=-1;
                    isrevert = flags.indexOf("!")!=-1;
                    sel = RegExp["$2"];
                    if(!sel) throw "传入选择器非法或者空";
                }
                var sel_class_name = sel.substr(1);                             //↓ie7特殊
                var html_el_class_str = " " + (html_el.getAttribute("class")||html_el.className) + " ";
                var isvalid = (sel=="*") || getRegexp(" "+sel_class_name+" ").test(html_el_class_str);
                if(isrevert) isvalid = !isvalid;
                if(isvalid){
                    isDomReady?ctool.domReady(el):el();
                }
            };
        }

        ctool.rootCondiFunc = rootCondiFunc;
    }();

    /**
     * 判断是数组类型
     * @param object
     * @returns {*|boolean}
     */
    ctool.isArray = function(object){
        return object && typeof object==='object' && Array == object.constructor;
    }


    /**
     * 计算object属性的个数
     * @param object
     * @returns {number}
     */
    ctool.obj_leng = function(object){
        var n = 0;
        for(var k in object){ n++; }
        return n;
    }


    /**
     * 逆序数组
     * @returns {Array}
     */
    Array.prototype.revert = function(){
        var a = [];
        var el;
        while(el = this.pop()){a.push(el)}
        return a;
    }

    /**
     * 打乱数组
     * @returns {Array.<T>}
     */
    Array.prototype.random = function(){
        return this.sort(function(a,b){
            return Math.random()?-1:1;
        });
    }

    /**
     * 使数组的所有元素，向前或者向后移动，边沿重复
     * @param n
     */
    Array.prototype.drift = function(n){
        var ar = this;
        var le = ar.length;
        n  = modp(n,le);
        if(n == 0)  return this;
        if(n>0){
            var tmp = ar.splice(le-n,n);
            Array.prototype.splice.apply(ar,[0,0].concat(tmp));
        }else if(n<0){
            n = -n;
            var tmp = ar.splice(0,n);
            Array.prototype.splice.apply(ar,[le-1,0].concat(tmp));
        }
        return this;
    }


    /**
     * 重复执行某函数，知道该函数返回值为true，或者其他非 false的返回值
     * @param interval 重复执行setp的间隔，默认90ms
     * @param times 重复执行最大次数的定义，避免一直重复下去
     *        times>0,表示重复执行多久时间。单位毫秒
     *        times<0,表示重复执最大多少次，单位 次
     * @param step 被重复执行的函数，如果该函数返回true停止重复
     *        function(flag){} //flag如果flag为true，表示为重复执行时间已经到，或者重复执行的次数已到
     */
    ctool.run_until = function(interval,times,step){
        var time_mode = false;
        if(typeof interval == "function") {
            times = 0;
            step = interval;
            interval = 90;
        }else if(typeof interval == "number" && typeof times == "function"){
            step = times;
            times = 0;
        }



        var interval = setInterval(function () {

            if(step()){
                clearInterval(interval);
            }

            if(judge()){
                clearInterval(interval);
                step(true);
            }
        }, interval);




        var now = new Date().getTime();
        function judge(){
            if(times<0){
                times ++ ;
                if(times === 0){
                    return true;
                }
            }else if(times>0){
                if(new Date().getTime() - now > times ){
                    return true;
                }
            }
        }

    }


    /**
     * 获取元素的位置矩形
     * @param element dom元素或者jquery元素
     * @returns {{top: number, bottom: number, left: number, right: number}}
     * @constructor
     */
    ctool.getRect = function(element) {
        var rect ;
        //简单检测是否为jquery对象
        if(element.prop){
            if(!element.length){
                throw "jquery对象dom对象长度为空";
            }
            rect = element[0].getBoundingClientRect();
        }else{
            rect = element.getBoundingClientRect();
        }
        var top = document.documentElement.clientTop;
        var left= document.documentElement.clientLeft;
        return{
            top    :   rect.top - top,   //如果是IE7以下那么 结果为 ‘2 - 2’。 不是为IE的话 结果是 ‘ 0 - 0 ’；  不管哪种方式，结果最终就是0
            bottom :   rect.bottom - top,
            left   :   rect.left - left,
            right  :   rect.right - left
        }
    }


    /**
     * 获取一个元素相对于另外一个元素的位置
     * @param element               要获取位置的元素
     * @param relativeElement       相对元素，如果忽略改参数。该方法等同于ctool.getRect
     * @returns {{left: number, top: number}}
     */
    ctool.getOffset = function(element,relativeElement){
        var os = {left:0,top:0};
        var rec_el = ctool.getRect(element);
        if(!relativeElement){
            return rec_el;
        }

        var rec_rel = ctool.getRect(relativeElement);
        os.left = rec_el.left - rec_rel.left;
        os.top = rec_el.top - rec_rel.top;
        return os;
    }


    /**
     * 判断浏览器是否支持某一个CSS3属性
     * @param {String} 属性名称
     * @return {Boolean} true/false
     * @version 1.0
     * @author ydr.me
     * 2014年4月4日14:47:19
     */
    function supportCss3(style) {
        var prefix = ['webkit', 'Moz', 'ms', 'o'],
            i,
            humpString = [],
            htmlStyle = document.documentElement.style,
            _toHumb = function (string) {
                return string.replace(/-(\w)/g, function ($0, $1) {
                    return $1.toUpperCase();
                });
            }
            ;

        for (i in prefix) humpString.push(_toHumb(prefix[i] + '-' + style));
        humpString.push(_toHumb(style));
        for (i in humpString) if (humpString[i] in htmlStyle) return true;
        return false;
    }




    /**
     * 获取
     * @returns {*|string|string|dir|Function|string}
     */
    ctool.getPageDir = function(){
        var ac = arguments.callee;
        if(!ac.dir){
            var div = document.createElement('div');
            div.innerHTML = '<a href="./"></a>';
            ac.dir = div.firstChild.href;
            div = null;
        }
        return ac.dir;
    }


    /**
     * extend 参考 jQuery.extend方法
     * @returns {*|{}}
     */
    ctool.extend = function() {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {}, // 默认第0个参数为目标参数
            i = 1,    // i表示从第几个参数凯斯想目标参数进行合并，默认从第1个参数开始向第0个参数进行合并
            length = arguments.length,
            deep = false;  // 默认为浅度拷贝

        // 判断第0个参数的类型，若第0个参数是boolean类型，则获取其为true还是false
        // 同时将第1个参数作为目标参数，i从当前目标参数的下一个
        // Handle a deep copy situation
        if ( typeof target === "boolean" ) {
            deep = target;

            // Skip the boolean and the target
            target = arguments[ i ] || {};
            i++;
        }

        //  判断目标参数的类型，若目标参数既不是object类型，也不是function类型，则为目标参数重新赋值
        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
            target = {};
        }

        // 若目标参数后面没有参数了，如$.extend({_name:'wenzi'}), $.extend(true, {_name:'wenzi'})
        // 则目标参数即为jQuery本身，而target表示的参数不再为目标参数
        // Extend jQuery itself if only one argument is passed
        if ( i === length ) {
            target = this;
            i--;
        }

        // 从第i个参数开始
        for ( ; i < length; i++ ) {
            // 获取第i个参数，且该参数不为null，
            // 比如$.extend(target, {}, null);中的第2个参数null是不参与合并的
            // Only deal with non-null/undefined values
            if ( (options = arguments[ i ]) != null ) {

                // 使用for~in获取该参数中所有的字段
                // Extend the base object
                for ( name in options ) {
                    src = target[ name ];   // 目标参数中name字段的值
                    copy = options[ name ]; // 当前参数中name字段的值

                    // 若参数中字段的值就是目标参数，停止赋值，进行下一个字段的赋值
                    // 这是为了防止无限的循环嵌套，我们把这个称为，在下面进行比较详细的讲解
                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }

                    // 若deep为true，且当前参数中name字段的值存在且为object类型或Array类型，则进行深度赋值
                    // Recurse if we're merging plain objects or arrays
                    if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
                        // 若当前参数中name字段的值为Array类型
                        // 判断目标参数中name字段的值是否存在，若存在则使用原来的，否则进行初始化
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src && jQuery.isArray(src) ? src : [];

                        } else {
                            // 若原对象存在，则直接进行使用，而不是创建
                            clone = src && jQuery.isPlainObject(src) ? src : {};
                        }

                        // 递归处理，此处为2.2
                        // Never move original objects, clone them
                        target[ name ] = jQuery.extend( deep, clone, copy );

                        // deep为false，则表示浅度拷贝，直接进行赋值
                        // 若copy是简单的类型且存在值，则直接进行赋值
                        // Don't bring in undefined values
                    } else if ( copy !== undefined ) {
                        // 若原对象存在name属性，则直接覆盖掉；若不存在，则创建新的属性
                        target[ name ] = copy;
                    }
                }
            }
        }

        // 返回修改后的目标参数
        // Return the modified object
        return target;
    };


    return ctool;
});



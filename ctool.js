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
            if(fileNameRg.test(path || location.href)){
                return RegExp["$1"];
            }
            return false;
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


    return ctool;
});



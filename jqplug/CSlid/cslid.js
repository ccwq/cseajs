/**
 * Created with WebStorm.
 * User: cheweiqing
 * Date: 14-5-12
 * Time: 上午9:05
 * To change this template use File | Settings | File Templates.
 */
define(function (require, exports, module) {
    var $ = require("jq");
    var cl = require("ctool");
    var cj = require("ctooj");
    var CTimer = require("CTimer");
    require("./css.css");

    /**
     * prototype
     */
    var fn;

    /**
     * 默认配置
     */
    var def = {
        /**
         * 是否使用序列模式加载，true，表示在元素n加载完成之后，才会加载n+1
         */
        sequMode:true,

        /**
         * 在缩略图加载完成后，就加入显示列表；否则，需要等待主图加载完成后才加入显示列表
         */
        addOnPreLoaded:true,

        /**
         * 间隔
         */
        delay:1500,

        /**
         * 渲染容器
         */
        cont:"#CSLid",

        /**
         * 开始切换
         */
        switchStartCbk: $.Callbacks(),

        /**
         * 切换完成
         */
        switchCompleteCbk: $.Callbacks(),

        autoPlay:true,

        size:{w:500,h:300}

    };

    /**
     * 模板
     */
    var scrollTpl =
        "<div class='scrollEle'></div>"
    ;

    /**
     * 类定义
     * 严格要求缩略图尺寸，和主图尺寸，同比。
     * @constructor
     */
    var Slid = module.exports = CSlid = function(setting){
        var me= this;
        var sett = $.extend(true,{},def,setting);
        //私有变量

        /**
         * 配置信息
         */
        me.sett = sett;

        /**
         * 所有图片加载完成？初始有0张图片，所以任务所有已加载完成
         * @type {boolean}
         */
        me.loaded = true;

        /**
         * 当前有效的播放列表
         * @type {Array}
         */
        me._data = [];

        /**
         * 播放列表缓存
         */
        me._dataCache = [];

        /**
         * 当前索引
         * @type {number}
         */
        me._index = -1;

        /**
         * 可视尺寸
         * @type {number}
         */
        me.width = 0;
        me.height = 0;

        /**
         * 滚动尺寸
         */
        me.scrollWidth = 0;

        me.el = $(sett.cont);
        me.el.addClass("cslid");
        if(!me.el.length) throw "请传入有效的选择器";

        me.scrollEle = me.el.children(".scrollEle");
        if(!me.scrollEle.length){
            me.scrollEle = $(scrollTpl).appendTo(me.el);
        }


        //控制点
        me.ctrlPan = $("<div class='ctrlPan'></div>").appendTo(me.el);
        me.ctrlPan.delegate(">a","click",function(e){
           var ti = $(this);
            me.reCount();
            me.index(ti.index(),true);
        });

        //处理自带的内置元素
        var orgEles = me.scrollEle.children(".csele");
        if(orgEles.length){
            orgEles.detach();
            me.addAll(orgEles);
        }

        me.setSize(sett.size.w,sett.size.h);

        //me.loadNext();

        //计时器
        me.tock = new CTimer({
            delay:sett.delay,
            callback:function(){
                me.index(me.index() + 1);
            }
        });

        sett.autoPlay && me.play();
    };

    /**
     * Slid prototype
     */
    fn = Slid.prototype;

    /**
     * 增加一个元素
     */
    fn.addToStage = function(obj){
        var me = this;
        var i = me._data.length;
        obj.resize(me.width,me.height);
        obj.setPos(i * me.width);
        me.scrollEle.append(obj.el);
        me._data.push(obj);
        me.freshSize();
        me.ctrlPan.append("<a></a>");
    };

    /**
     * 增加到等待列表
     * @param obj
     */
    fn.addToCache = function(obj){
        this.addAll([obj]);
    }

    /**
     * 一次加入所有的item，并序列化加载
     */
    fn.addAll = function(list){
        var me = this;
        //转换jquery对象
        if(list.constructor === $){
            list = list.toArray();
        }
        me._dataCache = me._dataCache.concat(list);
        if(me.loaded)   me.loadNext();
    }

    /**
     * 删除一个元素
     */
    fn.remove = function(){

    }

    /**
     * 开始播放
     */
    fn.play = function(){
        this.tock.start();
    };

    /**
     * 暂停播放
     */
    fn.pause = function(){
        this.tock.stop();
    };

    /**
     * 重新计时(用于鼠标移到等情况)
     */
    fn.reCount = function(){
        this.tock.reCount();
    }

    /**
     * 播放到第n
     * @param i
     */
    fn.index = function(i,isByClick){
        var me = this;
        if(i===undefined)   return me._index;

        if(i<0) i=me._data.length-1;
        if(i>me._data.length-1) i = 0;

        me._index = i;
        me.animate();
        me.ctrlPan.children().removeClass("cur").eq(i).addClass("cur");
    };

    /**
     * 执行动画
     */
    fn.animate = function(leftVal){
        var me = this;
        var curEle = me._data[me._index];
        me.animating = true;
        me.scrollEle.stop(true).animate(
            {
                left:-curEle.el.position().left
            }
            ,300,
            function(){
                me.animating = false;
            }
        );
    }

    /**
     * 改变尺寸
     * @param w
     * @param h
     */
    fn.setSize = function(w,h){
        var me = this;
        w = me.width    =   w   || me.width;
        h = me.height   =   h   || me.height;
        me.freshSize();
    };



    /**
     * 刷新尺寸
     */
    fn.freshSize = function(){
        var me = this;
        me.el.css({
            width:me.width,
            height:me.height
        });

        var lw = 0;
        $.each(me._data,function(k,el){
            el.resize(me.width,me.height);
            el.setPos(lw);
            lw+=me.width;
        });

        me.scrollEle.css({
            height:me.height,
            width:lw
        });

        if(me.animating){
            me.scrollEle.stop(true);
        }

        if(me._data.length)
            me.index(me.index());

    }

    /**
     * 从缓存池，开始加载
     */
    fn.loadNext = function(){
        var me = this;
        var cache = me._dataCache;
        if(!cache.length){
            cl.log("已经加载完成");
            me.loaded = true;
            return;
        }
        var ele = new Ele({
            preLoad:function(){
                me.addToStage(this)
            },
            load:function(){
                me.loadNext();
            },
            el: cache.shift()
        });
    };


    //___________________________________________
    var eledef = {
        /**
         * pre加载完成时
         */
        preLoad: $.noop,

        /**
         * pre和main都加载完成时
         */
        load: $.noop,

        /**
         * 是否在pre加载完成的时候认为加载完成
         */
        loadedOnPreComplete:false
    };
    var eleTpl =
        "<div class='csele'>" +
            "<div class='mainCont'><img _src='{src}' preSrc=''/></div>" +
            "<div class='subCont'></div>" +
        "</div>"
    ;
    /**
     * 滑动项元素
     * @constructor
     */
    var Ele = function(config){
        var me = this;
        var sett = me.sett = $.extend({},eledef,config);
        var el = me.sett.el;

        if(typeof el == "string"){
            if($.trim(el).subStr(0,1) === "<"){
                //html形式，转换为jq形式处理
                el = $(el);
            }else{
                //路径形式，转换为配置形式处理
                el = {src:el};
            }
        //dom对象//jq的判断方式
        }else if(el.nodeType){
            el = $(el);//转交给jquery
        }

        //是jquery对象
        if(el.constructor == $){
            var img = el.find(".mainCont>img");
            if(!img.length) throw "请注意格式";
            me.info = getScrollEleInfo({
                el:el,
                src:img.attr("_src") || img.attr("src"),
                preSrc:img.attr("preSrc")
            });
        //配置对象
        }else if($.isPlainObject(el)){
            me.info = getScrollEleInfo(el);
            me.info.el = eleTpl.replace("{src}",el.src);
        }

        me.el = me.info.el;
        me.loaded = false;
        me.mainCont = me.el.find(".mainCont")
        me.pic = me.el.find(".mainCont>img");

        //预加载图
        me.preimg = $();
        if(me.info.preSrc){
            me.preimg = $("<img class=preImg src='"+ me.info.preSrc +"'/>");
            me.mainCont.prepend(me.preimg);
        }

        //开始加载
        me.load(
            function(size){
                //成功加载
                if(size){
                    me.pic.attr("psize",size.w + "," + size.h);
                    me.resize();
                }
                me.el.find("img").unblockImg();
                sett.preLoad.call(me,size);
            },
            function(size){
                sett.load.call(me,size);
                me.preimg && me.preimg.remove();
                me.resize();
            }
        );
    };

    /**
     * 滑动项元素 prototype
     */
    fn = Ele.prototype;

    /**
     * 尺寸重绘
     * @param w 宽度
     * @param h 高度
     */
    fn.resize = function(w,h){
        var me = this;
        w = me.width = w || me.width;
        h = me.height =h || me.height;

        me.el.css({
            width:w,height:h
        });

        me.preimg.maxonLite();
        me.pic.maxonLite();
    };

    /**
     * 开始加载
     */
    fn.load = function(subLoadover,mianLoadover){
        var me = this;
        var info = me.info;
        var preDf,mainDf;
        preDf = loadImg(info.preSrc).always(function(pimg,isSuccess1){
            if(isSuccess1) me.psize = getImgSize(pimg);
            subLoadover(me.psize);
            if(!isSuccess1) cl.log("缩略图读取失败",info.preSrc);
            mainDf = loadImg(info.src).always(function(mimg,isSuccess2){
                if(isSuccess2) me.psize = getImgSize(mimg);
                mianLoadover(me.psize);
                me.loaded = true;
                if(!isSuccess2) cl.log("主图读取失败",info.src);
            });
        });
    };


    /**
     * 设置序号
     * @param i
     */
    fn.setIndex = function(i,pwidth){
        var me = this;

    };

    /**
     * 设置位置
     */
    fn.setPos = function(left){
        this.el.css({
            left:left
        });
    }


    var def_info = {
        /**
         * 主图加载完成之前，预加载的小图地址
         */
        preSrc:"",
        /**
         * 主图地址
         */
        src:"",

        /**
         * 构建的对象
         */
        el:""
    };
    /**
     * 获取一个信息对象
     * @param cofnig
     */
    function getScrollEleInfo(cofnig){
        return $.extend({},def_info,cofnig);
    }

    //----------------------


    /**
     * 预加载
     * @param src
     * @returns Deferred; 成功
     */
    function loadImg(src){
        var dfc = loadImg.deffCache = loadImg.deffCache || {};
        if(dfc[src])  return dfc[src];
        var df = $.Deferred();
        dfc[src] = df;

        var img = new Image();
        img.onload = function () {
            df.resolve(img,true);
        };
        img.onerror = function () {
            df.reject(img,false);
        };
        img.src = src;
        if (img.complete && src) {
            img.onload();
        }

        if(!src){
            img.onerror();
            cl.log("未传入图片地址");
        }

        return df;
    }

    /**
     *获取图片的原始尺寸
     * @param img
     * @returns {w:xxx,h:xxx}
     */
    function getImgSize(img){
        var hb = cj.getHideBox();
        hb.append(img);
        var size = {
            w:img.clientWidth,
            h:img.clientHeight
        };
        hb.children(":last").remove();
        return size;
    };
});
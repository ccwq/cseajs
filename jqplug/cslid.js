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
    var CTimer = require("ctimer");
    require("./cslid/css.css");


    var fn;

    /**
     * 默认配置
     */
    var def = {
        //是否使用序列模式加载，true，表示在元素n加载完成之后，才会加载n+1
        sequMode:true,


        //在缩略图加载完成后，就加入显示列表；否则，需要等待主图加载完成后才加入显示列表
        addOnPreLoaded:true,

        //滑动间隔
        delay:2700,

        //自定义重新计算尺寸方法
        /**
         * customResizeFunc(eleWidth, eleHeight){
         *      this //Ele instance
         *      this.img //主图
         *      this.preimg  //预加载图
         * }
         */
        customResizeFunc: null,


        //滚动完成后执行
        /**
         * function onScrollComplete(cur_index, isLastOne){ this //-->me }
         */
        onScrollComplete: $.noop,

        //参数同上
        onScrollStart: $.noop,

        //当一个元素被加入显示列表(图片是加载一张，显示一张)
        //function(index, isLast) this --> me
        onEleAppend: $.noop,

        //dom,selector,htmlstr
        cont:"#CSLid",

        //开始切换
        switchStartCbk: $.Callbacks(),

        //切换完成
        switchCompleteCbk: $.Callbacks(),

        autoPlay:true,

        //使用淡入淡出模式切换
        fademode:false,

        //动画持续默认时间
        anim_dura:510,

        /**
         * 分4种情况,
         * w:number,h:number,此值无用
         * w:"auto",h:number,w计算出的值，h为number。无用
         * w:number,h:"auto",h为w*scaleWH
         * w:"auto",h:"auto",w计算得出,h为w*scaleWh
         */
        scaleWH:0.66,
        //初始尺寸
        size:{w:500,h:300},

        //如果true，size数据直接从css里读取，上面两个配置失效。
        sizeFromCss:false,

        //当宽度为auto时，的节流间隔
        aotuFreshDelay:180,

        //不显示control pan
        noCtrlpan:false,

        //控制选择器或者$el <div id=ctrlCont><a class=next>下一张</a><a class=prev>上一张</a></div>
        controlCont:undefined,
        nextEl:"",
        prevEl:""

    };

    /**
     * 模板
     */
    var scrollTpl = "<div class='scrollEle'></div>";

    /**
     * 类定义
     * 严格要求缩略图尺寸，和主图尺寸，同比。
     * @constructor
     */
    var Slid = module.exports = CSlid = function(setting){
        var me= this;
        var sett = $.extend(true,{},def,setting);

        //私有变量
        me.sett = sett;

        //所有图片加载完成？初始有0张图片，所以任务所有已加载完成
        me.loaded = true;

        //当前有效的播放列表
        me._data = [];

        //播放列表缓存
        me._dataCache = [];

        //当前索引
        me._index = -1;

        //可视尺寸

        me.width = 0;
        me.height = 0;

        //滚动元素的宽度
        me.scrollWidth = 0;

        //主体元素
        me.el = $(sett.cont);

        //z值一直在递增
        me.z_counter = 0;

        //尺寸信息来源于css时执行
        if(sett.sizeFromCss){
            sett.size = {
                w:me.el.width(),
                h:me.el.height()
            };
        }

        me.el.addClass("cslid");

        if(me.sett.fademode){
            me.el.addClass("fademode");
        }

        if(!me.el.length) throw "请传入有效的选择器";

        //滚动元素
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

        if(sett.noCtrlpan){
            me.ctrlPan.hide();
        }

        //计时器
        me.tock = new CTimer({
            delay:sett.delay,
            autoStart:false,
            callback:function(){
                me.index(me.index() + 1);
            }
        });

        //处理自带的内置元素
        var orgEles = me.scrollEle.children(".csele");
        if(orgEles.length){
            orgEles.detach();
            me.addAll(orgEles);
        }

        //初始尺寸
        me.setSize(sett.size.w,sett.size.h);



        //自动播
        //sett.autoPlay && me.play();

        var winRize = function(){}

        cj.winResize(sett.aotuFreshDelay, function (w, h) {
            if(!me.autoWidth)   return;
            me.width = me.el.width();
            if(me.autoHeight){
                me.height = me.width * sett.scaleWH;
            }
            me._setSize();
        });

        //href单击跳转
        me.el.delegate("*[href]","click",function(e){
            var t = $(this);
            var href = t.attr("href");
            e.preventDefault();
            if(!href)   return;
            t.attr("target")=="_blank"?
                window.open(href)
                :
                location.href = href
            ;
        });


        //外部控制器
        if(sett.controlCont){
            $(sett.controlCont).delegate(".prev,.next","click",function(e){
                e.preventDefault();
                var ti = $(this);
                if(ti.is(".prev")) me.prev();
                if(ti.is(".next")) me.next();
            });
        }

        if(sett.nextEl){
            $(sett.nextEl).click(function(){
                me.next();
            });
        }
        if(sett.prevEl){
            $(sett.prevEl).click(function(){
                me.prev();
            });
        }
    };

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
        var cur_index = me.scrollEle.children().length-1;

        me.sett.onEleAppend.call(me, cur_index, cur_index == me.length() - 1);

        //默认打开第一副
        if(cur_index == 0){
            me.index(0);
            me.sett.autoPlay && me.play();
        }
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
    fn.remove = function(){ }

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
    fn.index = function(i,dura){
        var me = this;
        if(i===undefined)   return me._index;
        i = cl.modp(i,me._data.length);
        me._index = i;
        me.animate(dura);
        me.ctrlPan.children().removeClass("cur").eq(i).addClass("cur");
    };

    /**
     * 上一张
     */
    fn.next = function(n){
        var me=this;
        me.index(me.index()+ (n||1));
        me.reCount();
    };

    /**
     * 下一张
     */
    fn.prev = function(n){
        var me=this;
        me.index(me.index()-(n||1));
        me.reCount();
    }


    /**
     * 执行动画
     */
    fn.animate = function(dura){
        var me = this;
        var sett = me.sett;
        var curEle = me._data[me._index];

        //防止在index调用过早，导致的控件停止运行的bug
        if(!curEle){
            var _dura = dura;
            var itv = setInterval(function(){
                if(me._data[me._index]){
                    clearIntervals(itv);
                    me.animate(_dura);
                }
            },90);
            return;
        }

        dura===undefined?sett.anim_dura:dura;
        me.animating = true;

        me.z_counter++;

        if(sett.fademode){
            curEle.el
                .fadeTo(0,0)
                .css({zIndex:me.length() + me.z_counter})
                .fadeTo(dura,1,animate_complete)
            ;
        }else{
            me.scrollEle
                .stop(true)
                .animate({left: -curEle.el.position().left}, dura, animate_complete)
            ;
        }

        dura!==0 && me.sett.onScrollStart.call(me, me._index, me._index == me.length() - 1);
        function animate_complete(){
            me.animating = false;
            //如果是0仅仅是为了调整布局，不能算为滑动完成            是否是最后一个
            dura!==0 && me.sett.onScrollComplete.call(me, me._index, me._index == me.length() - 1 );
        }
    }

    /**
     * 改变尺寸,可以接受auto
     * @param w
     * @param h
     */
    fn.setSize = function(w,h){
        var me = this;
        //宽度自动布局
        me.autoWidth = (w=="auto");
        if(me.autoWidth){
            me.el.css({width:"auto"});
            w = me.el.width();
        }
        me.autoHeight = (h=="auto")
        if(me.autoHeight){
            h = w * me.sett.scaleWH;
        }

        me._setSize(w,h)
    };

    /**
     * 获取所有图片的数量 包括已加载未加载(展示)的
     */
    fn.length = function(){
        var me = this;
        return me._dataCache.length + me._data.length;
    }


    //内部方法 只接受数字
    fn._setSize = function(w,h){
        var me = this;
        w = me.width    =   w   ||  me.width;
        h = me.height   =   h   ||  me.height;
        me.freshSize();
    }



    /**
     * 刷新尺寸
     */
    fn.freshSize = function(){
        var me = this;
        var sett = me.sett;
        var fademode = sett.fademode;
        me.el.css({
            width:me.autoWidth?"auto":me.width,
            height:me.height
        });

        var lw = 0;
        $.each(me._data,function(k,el){
            el.resize(me.width,me.height);
            el.setPos(lw);
            if(!fademode) lw += me.width;
        });

        me.scrollEle.css({ height: me.height, width: fademode?me.width:lw});

        //动画过程中改变尺寸，动画快进到完成（fade模式下无效）
        if(me.animating && !fademode){
            me.scrollEle.stop(true);
            if(me._data.length) me.index(me.index(),0);
        }

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
            el: cache.shift(),
            hostSett:me.sett
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
            "<div class='mainCont' style='position: absolute;'><img _src='{src}' preSrc=''/></div>" +
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

        //ie对样式识别错误的bug
        el.find(".mainCont").css({position:"absolute"});



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
                me.el.find("img:not(.force_block img)").unblockImg();
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

        var hsett = me.sett.hostSett;
        if(hsett.customResizeFunc){
            hsett.customResizeFunc.call(me,w,h)
        }else{
            me.preimg.maxonLite();
            me.pic.maxonLite();
        }

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
     * 设置位置
     */
    fn.setPos = function(left){
        this.el.css({ left: left});
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
        cl.imgready(src, $.noop,success,fail);
        function success(){
            df.resolve(this,true);
        }

        function fail(){
            df.reject(this,false);
        }

        if(!src){
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
        var hb = $("body");;
        hb.append(img);
        var size = {
            w:img.clientWidth,
            h:img.clientHeight
        };
        hb.children(":last").remove();
        return size;
    };


    /**
     * 从平行列表的开始创建slid 形如<div><img/><img/><img/></div>结构.缺点是无法使用自定义element层内容
     * @param $el外部容器
     * @param config配置
     */
    CSlid.fromPlaneList = function($el,config){
        $el = $($el);
        config.cont = config.cont || $($el);
        $el.find(">img").each(function(){
            var im = $(this);
            im.wrap("<div class='csele'><div class='mainCont'></div></div>");
        });
        $el.wrapInner("<div class='scrollEle'></div>");

        return new CSlid(config);
    }


    //封装jquery
    $.fn.cslid = function(cfg){
        var m = this;
        return m.each(function(){
            var _self = $(this);
            var ins;
            cfg.cont = _self;

            if($(">img",_self).length){
                ins = CSlid.fromPlaneList(_self,cfg);
            }else{
                ins = new CSlid(cfg);
            }
            m.ins = ins;
            _self.data().cslid_ins = ins;
        });
    }
});

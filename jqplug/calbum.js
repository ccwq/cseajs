/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-7-25
 * Time: 下午3:35
 * To change this template use File | Settings | File Templates.
 */
define(function (require) {
    var plug_name = "c_album";
    var ins;
    var $ = require("seajq");
    var cl = require("ctool");
    var cj = require("ctooj");
    require("./calbum/embed/c.css");
    var templete =
        '<div>'+
            '<div class="album_wrapper" id="c_album">'+
                '<div class="mask"></div>'+
                '<div class="container">'+
                    '<div class="back"></div> <div class="photo_wrapper"></div> <div class="photo_scaler"></div>'+
                    '<div class="loading"></div> <span class="left_arrow arrow btn"></span> <span class="right_arrow arrow btn"></span> <span class="close_btn btn"></span>'+
                    '<div class="tools">'+
                        '<span class="posiLabel"></span> <span class="name"></span>'+
                        '<span class="fullScr btn"></span> <span class = "one_size btn">1:1</span> <span class="play btn"></span>'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';

    var dom = $(templete).find("#c_album");
    var oldie = cl.bro("ie6,ie8,ie8");
    var loadedCacheDic = undefined;             //缓存那些图片已经加载完成
    var cb = $.Callbacks();
    var timeoutObj=null;

    var
        mask = dom.find(".mask"),
        cont = dom.find(".container"),
        back = cont.find(".back"),
        close_btn = dom.find(".close_btn"),
        arrows = dom.find(".arrow"),
        arrow_left= dom.find(".left_arrow "),
        arrow_right= dom.find(".right_arrow "),
        loading = dom.find(".loading"),
        posiLabel = dom.find(".posiLabel"),
        tools = dom.find(".tools"),
        name = dom.find(".name"),
        fullScr = dom.find(".fullScr"),
        btn_play = dom.find(".play"),
        scaler = dom.find(".photo_scaler"),
        one_size = dom.find(".one_size"),
        photo_wrapper = dom.find(".photo_wrapper")
    ;
    $(function(){ dom.appendTo("body");});

    //Class
    var def_config = {
        margin:30,
        marginHori:false,
        marginVert:false,
        dura:360,
        playInterval:3600,
        maskAlpha:0.66,
        backAlpha:0.90,
        photoMargin:37,
        photoMarginOffset:{left:0,top:-24},
        onChange: $.noop,
        onImage: $.noop,
        //json中获取图片地址的字段
        src_field:"src",
        //指定获取name的字段
        name_filed:"name",
        no:null
    };
    var setting = {};
    function calbum(config){
        ins = this;
        var me = this;
        me.isOpened = 0;
        me.curImage = undefined;
        me.curImgSize = {w:0,h:0};
        me.lastImg = undefined;     //记录上一张图片
        me.jsonData = undefined;    //json数据
        me.imgCounter = 0;
        me.index = 0;
        me.playing = false;         //标识是否自动播放中
        $.extend(true,setting,def_config,config);

        setting.marginHori = setting.marginHori || setting.margin;
        setting.marginVert = setting.marginVert || setting.margin;

        mask.fadeTo(0,setting.maskAlpha);
        back.fadeTo(0, setting.backAlpha);
        close_btn.click(function(){
            me.close();
        });
        resizeFunc();
        me.updataPos_size();
        me.close(0);

        arrows.click(function(){
            var mee =$(this);
            if(mee.hasClass("right_arrow")){
                mee.hasClass("disable") || me.nextPhoto() ;
            }else{
                mee.hasClass("disable") || me.prevPhotp();;
            }
        });

        photo_wrapper.css({width:"auto",height:"auto",top:setting.photoMargin,right:setting.photoMargin,bottom:setting.photoMargin,left:setting.photoMargin,marginLeft:setting.photoMargin.left,marginTop:setting.photoMarginOffset.top});
        fullScr.click(function(){
            fullScr.toggleClass("full");
            me.updataPos_size();
        });

        btn_play.click(function(){
            btn_play.toggleClass("playing");
            if(btn_play.hasClass("playing")){
                setAutoPlay(function(){me.nextPhoto();});
            }else{
                setAutoPlay(false);
            }
        });

        one_size.click(function(){
            if(one_size.hasClass("nouse"))  return;
            one_size.toggleClass("showing");
            if(one_size.hasClass("showing")){
                setScaler.call(me,true);
            }else{
                setScaler.call(me,false);
            }
        });
    };

    //method
    var fn = calbum.prototype;

    fn.close=function(dura){
        var me=this;
        me.isOpened = -1;  /*-2关闭  -1关闭中  1打开中 2打开*/
        if(dura === undefined) dura = setting.dura;
        var h = cont.height();
        photo_wrapper.children().remove();
        me.curImage = undefined;
        setAutoPlay(false);
        cont.stop(true).animate({top:-h},dura * 0.7,function(){
            mask.stop(true).animate({opacity:0},oldie?0:dura * 0.3 ,function(){
                me.isOpened = -2;
                dom.hide();
            })
        });
        return me;
    };

    /**
    * 打开窗口
    * */
    fn.open=function(withLoading){
        var me=this;
        if(me.isOpened>0)   return;
        me.isOpened = 1;
        dom.show();
        mask.stop(true).animate({opacity:setting.maskAlpha},setting.dura * (oldie?0:0.3),function(){
            cont.stop(true).animate({top:me.isFullSrc()?0:setting.marginVert},setting.dura * 0.7,function(){
                me.isOpened = 2;
                if(me.curImage && !photo_wrapper.children().length){
                    me.curImage.appendTo(photo_wrapper);
                    element_showed.call(me,me.index,this);
                    one_size.removeClass("nouse");
                }
                me.fresh_img_size_posi();
            });
        });
        if(withLoading) loading.show();
        return me;
    };

    //格式
    fn.setDataByJson=function(data,setIndex){
        var me=this;
        if(!data || !data.length) throw "数据设置失败，数据不存在！";
        loadedCacheDic = {};
        loading.hide();
        me.jsonData = data;
        me.setIndex(setIndex || 0);
        me.open();
        return me;
    };


    /**
     * 公开
     * @param url_json 可以传入json地址或者json对象(不支持json字符串)
     * @param initIndex
     * @returns {calbum}
     */
     fn.setData=function(url_json,initIndex){          //fieldname样例:"{name:"name",src:"name2"}
        var me=this,data;
        if(typeof url_json == "string"){
            loading.show();
            $.get(url_json)
                .done(function(data){
                    loading.hide();
                    data = cl.tojson(data,function(){
                        throw "数据已获取，但解析失败";
                    });

                    //转换为对象后，重新调用
                    me.setData(data,initIndex);
                })
                .fail(function(){
                    loading.hide();
                    throw "json请求失败，请检查传入地址;";
                })
            ;
        }else{
            data = url_json;
            me.setDataByJson(data,initIndex || 0);
        }
        return me;
    };

    /*
    * 公开
    * 根据src或者src数组显示图片
    * */
    fn.showImageBySrc=function(src_srclist,init_index){
        var me=this;
        if(typeof src_srclist=="string") src_srclist = [src_srclist];
        var data = $.map(src_srclist,function(ele){
            return {src:ele};
        });
        me.setDataByJson(data,init_index);
    };

    //显示某图片 私有
    fn.showElementByUrl=function(url,type){
        var me=this;
        loading.show();
        one_size.addClass("nouse");

        //通过onImage回调，可以改变访问图片的路径
        url = setting.onImage.call(null,url) || url;

        getImageOrigSize({url:url,index:me.index},function(w,h,resu){
            loadedCacheDic[resu.paras.index]= (resu.error?undefined:this);
            if(loadedCacheDic[me.index] || resu.error)    loading.hide();
            me.curImgSize.w=w; me.curImgSize.h=h;
            me.lastImg = me.curImage;
            var img = me.curImage =$(this).addClass("c_image").attr({seqno:me.imgCounter++});
            if(me.isOpened == 2 && resu.paras.index==me.index){
                img.appendTo(photo_wrapper);
                me.fresh_img_size_posi();
                me.curImage.stop(true).fadeTo(0,0).stop(400).fadeTo(410,1);
                element_showed.call(me,me.index,this);
                one_size.removeClass("nouse");
            }

            var oldimg = photo_wrapper.children(":not(:last)");

            var scalerShowing = scaler.is(":visible");
            oldimg.stop(true).fadeTo(scalerShowing?0:410,0,function(){oldimg.remove();});
            setScaler(false);
        });
    };

    /*刷新当前图片的显示位置和缩放*/
    fn.fresh_img_size_posi = function(){
        var me=this;
        if(!me.curImage)    return;
        photo_wp_w=photo_wrapper.width(); photo_wp_h=photo_wrapper.height();
        if(photo_wp_w>me.curImgSize.w && photo_wp_h>me.curImgSize.h){
            me.curImage.css({ left: (photo_wp_w-me.curImgSize.w)*0.5, top: (photo_wp_h - me.curImgSize.h)*0.5 ,width:"auto", height:"auto"});
        }else{
            var css = cl.fit_on_container([photo_wp_w,photo_wp_h],[me.curImgSize.w, me.curImgSize.h]).css;
            me.curImage.css(css);
        }
    }

    fn.leng = function(){
        var me=this;
        return me.jsonData.length;
    };

    fn.setIndex=function(i){
        var me=this;
        arrows.removeClass("disable");
        if(i <= 0){
            i=0;
            arrow_left.addClass("disable");
        }
        if(i >= me.leng()-1){
            i=me.leng()-1;
            arrow_right.addClass("disable");
        }
        me.index = i;
        me.showElementByUrl(me.jsonData[i][setting.src_field]);
        posiLabel.text(i+1+"/"+me.leng());
        name.text(me.jsonData[i][setting.name_filed] || "");
    };

    fn.nextPhoto=function(){
        var me=this;
        me.setIndex((me.index == me.leng()-1)?0:me.index+1);
    };

    fn.prevPhotp=function(){
        var me=this;
        me.setIndex(me.index ==0?me.leng()-1:me.index - 1);
    }

    fn.isFullSrc = function(){
        return fullScr.hasClass("full");
    }

    /*刷新位置尺寸*/
    var photo_wp_w = 0, photo_wp_h = 0;
    fn.updataPos_size = function(){
        var me=this;
        var mvert = setting.marginVert || setting.margin, mhori = setting.marginHori || setting.margin;
        if(me.isFullSrc()) mvert = mhori = 0;
        var cont_width = 0;
        cont.css({
            left: mhori,                                top:mvert,
            width: cont_width = sw - mhori * 2,         height:sh - mvert * 2
        });

        if(me.isOpened < 0 )me.close(0);
        arrows.css({top:(cont.height() - arrows.height()) * 0.5});
        photo_wp_w=photo_wrapper.width(); photo_wp_h=photo_wrapper.height();
        if(me.isOpened > 1) me.fresh_img_size_posi();

        if(scaler.is(":visible") && scaler.freshpos) scaler.freshpos();
        return me;
    }

    var sw = 0,sh = 0,resizeFunc;
    var wi = $(window).resize(resizeFunc = function(){
        sw = wi.width(),  sh = wi.height();
        ins && ins.updataPos_size();
    });


    //private function
    /*当某个元素显示完成回调*/
    function element_showed(index,element){
        var me=this;
        setting.onChange.call(me,index,element);
        if(me.playing) setAutoPlay(function(){ me.nextPhoto(); });
    };

    /*自动播放控制*/
    function setAutoPlay(callback_noStopFlag){
        var me = ins;
        timeoutObj&&clearTimeout(timeoutObj);
        if(callback_noStopFlag===false){
            me.playing = false;
            btn_play.removeClass("playing");
            return;
        }
        me.playing=true;
        timeoutObj = setTimeout(function(){
            callback_noStopFlag && callback_noStopFlag();
        },setting.playInterval);
    };

    /*设置缩放层*/
    function setScaler(showFlag){
        var me=this;
        scaler[showFlag?"show":"hide"]().empty();
        photo_wrapper[!showFlag?"show":"hide"]();
        if(!showFlag){
            one_size.removeClass("showing");
            return;
        }
        var cloner = me.curImage.clone().removeAttr("style").css({width:"auto",height:"auto",position:"absolute"});
        scaler.append(cloner);
        scaler.img = cloner;

        if(!scaler.initedDrag){
            scaler.initedDrag = true;
            scaler.downPoint = {x:0,y:0};
            var mg = 30;
            scaler.bind("mousedown mousemove mouseup",function(e,moveOption){
                var t = e.type;
                if(t == "mousedown"){
                    scaler.pressed=true;
                    scaler.downPoint.x = e.clientX;  scaler.downPoint.y= e.clientY;
                    scaler.ipos = scaler.img.position();
                    scaler.isize = {w:scaler.img.width(), h:scaler.img.height()};
                    e.preventDefault();
                    e.stopPropagation();
                }else if(t == "mousemove"){
                    if(!scaler.pressed && !moveOption)  return;
                    var ileft = scaler.ipos.left + e.clientX - scaler.downPoint.x;
                    var itop = scaler.ipos.top + e.clientY - scaler.downPoint.y;

                    ileft = ileft || scaler.ipos.left;
                    itop = itop || scaler.ipos.top;

                    if(ileft> mg) ileft = mg;
                    if(itop > mg) itop = mg;

                    if(ileft + scaler.isize.w < scaler.width() - mg )    ileft = scaler.width() - mg - scaler.isize.w;
                    if( itop + scaler.isize.h< scaler.height()-mg)      itop = scaler.height() - mg - scaler.isize.h;

                    if(scaler.width()>scaler.isize.w)   ileft = (scaler.width() - scaler.isize.w) * 0.5;
                    if(scaler.height()>scaler.isize.h)   itop = (scaler.height() - scaler.isize.h) * 0.5;

                    if(moveOption && moveOption.center){
                        ileft = (scaler.width() - scaler.isize.w) * 0.5;
                        itop = (scaler.height() - scaler.isize.h) * 0.5;
                    }
                    scaler.img.css({ left: ileft, top: itop });
                    if(moveOption)    scaler.ipos = scaler.img.position();
                }else if(t == "mouseup")
                    scaler.pressed =false;
            });

            document.onmousemove=function(ev){
                var ev = ev|| event;
                ev.cancelBubble=true;ev.returnValue = false;
            };
            $(document).mouseup(function(){ scaler.pressed =false; });
            scaler.center=function(){
                scaler.mousedown().trigger("mousemove",{center:true});
            }
            scaler.freshpos=function(){
                scaler.mousedown().trigger("mousemove",true);
            }
        }
        scaler.center();
    };

    /*
     * 获取图片原始尺寸
     * */
    function getImageOrigSize(url_paras,callback){
        cl.imgPreLoad(url_paras,function(result){
            var $ti = $(this);
            cj.getHideBox().append($ti);
            callback && callback.call(this,$ti.width(),$ti.height(),result);
            if($ti.parent().is("#hidebox")) $ti.remove();
        });
    };


    //全局唯一单例实例
    calbum.create = function(config){
        if(!ins) ins = new calbum(config);
        return ins;
    }

    return calbum;
});
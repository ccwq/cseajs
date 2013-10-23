/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-8-29
 * Time: 下午7:32
 * To change this template use File | Settings | File Templates.
 */
define(function (require) {
    var $ = require("seajq");
    var cl = require("ctool");
    var cj = require("ctooj");
    require("cpicwall/c.css");
    var def = {
        width:880,
        scrollDura:410,
        blackAlpha:0.36,
        hmargin:30,
        expandWidth:33,                         //展开时增加宽度量
        expandHeight:45,                        //展开时候增加的高度量
        isFreshOnWindowResize:true,
        curentIndex:0,
        hightAdd:0,                             //焦点图，高度增加值
        no:null
    };

    $.fn.cphotowall=function(config_method,para){
        if(typeof config_method == "string"){
            var method = methods[config_method];
            if(!method) throw "访问的方法不存在！";
            return method.call(this,para);
        };
        return this.each(function(i){
            var me=$(this).addClass("cpicwall").addClass(cl.bro._);
            var d=me.data();
            var c = d.c =$.extend(true,{},def,config_method);
            me.wrapInner("<div class='cpwview'><div class='scroller'></div></div>");
            var view = $(".cpwview",me);
            var scer = $(".scroller",view);
            var imgs = scer.children().addClass("cele").each(function(i){
                var mee=$(this);
                var mee_ = mee.get(0);
                if(!mee_.src)    mee_.src = mee.attr("block_src");
            });
            var eles = imgs.maxOn().removeClass("cele").closest("span").addClass("cele");
            eles.css({marginLeft: c.hmargin,marginRight: c.hmargin});
            var ele_w = eles.outerWidth(true);
            var left_right_btn = $("<a class='left'></a><a class='right'></a>").appendTo(me).fadeTo(0,0.85).click(function(){
                var bt = $(this);
                if(bt.is(".left")){
                    methods.playto.call(me, d.index-1);
                }else if(bt.is(".right")){
                    methods.playto.call(me, d.index+1);
                }
            });
            var dot_div = $("<div class='dots'></div>").appendTo(me);

            if(cl.bro("ie7")) ele_w+=1;
            scer.width(ele_w * eles.length + c.expandWidth * 4 + ele_w * 2);

            d.ele_postions = [];
            eles.each(function(i){
                var ele = $(this);
                dot_div.append("<a></a>");
                ele.append("<div class='mask'></div>");
                d.ele_postions[i] = ele.position().left + ele_w*0.5;
            });
            dot_div.delegate(">a","click",function(){
                var dt = $(this);
                methods.playto.call(me, dt.index());
            });

            d.eles = eles;
            d.leng = eles.length;
            d.view = view;
            d.scer = scer;
            d.ele_w = ele_w;
            d.ele_h = eles.height();
            d.index = -1;
            d.lastIndex = -2;
            d.btns = left_right_btn;
            d.dot_div = dot_div;
            d.ease = "";

            methods.playto.call(me, c.curentIndex);

            var btn_height = left_right_btn.height();
            var me_h = me.height();
            left_right_btn.css({top:(me_h - btn_height - c.expandHeight * 3)*0.5});

            if(c.isFreshOnWindowResize) cj.winResize(true,function(){
                methods.fresh.call(me);
            });

            require.async("jqplug/easing",function(){
                d.ease = "easeOutBack";
            });
        });
    };

    var methods = {
        playto:function(index){
            return this.each(function(){
                var i=index;
                var me = $(this), d = me.data(), c= d.c;
                d.btns.show();
                if(i<=0){
                    i==0;
                    d.btns.filter(".left").hide();
                }

                if(i>= d.leng-1){
                    i= d.leng-1;
                    d.btns.filter(".right").hide();
                }

                if(i == d.index)    return;
                d.lastIndex = d.index;

                d.dot_div.children().removeClass("cur").eq(i).addClass("cur");
                d.eles.removeClass("cur").eq(i).addClass("cur");
                var curele = d.eles.eq(i), cur_img = curele.children("img");
                var focusHeightAdd = c.hightAdd? c.hightAdd : c.hmargin * 2;
                cur_img.maxOn("tweenResizeTo",{
                    css:{
                        marginTop:-c.expandHeight * 2,
                        width: d.ele_w  + c.expandWidth  * 2,   height: d.ele_h + c.expandHeight * 2
                    }
                });
                d.eles.eq(d.lastIndex).children("img").maxOn("tweenResizeTo",{
                    css:{
                        marginTop:0,
                        width: d.ele_w -c.hmargin * 2 ,   height: d.ele_h
                    }
                });

                d.index = i;
                methods.fresh.call(me);
            });
        },
        fresh:function(dura){
            return this.each(function(i){
                var me = $(this), d = me.data();
                var curele = d.eles.eq(d.index);
                var ofs = curele.position();
                var w = d.width = me.width();
                var is_increace = d.index - d.lastIndex;
                var offsetx = 0;
                //if(is_increace > 0) offsetx =
                //var left = -(ofs.left+ d.ele_w*0.5) + w*0.5 + offsetx;
                var left = -d.ele_postions[d.index] + w * 0.5 - d.c.expandWidth * 1.5;
                d.scer.stop(true).animate(
                    {left:left},
                    dura || d.scrollDura,
                    d.ease,
                    function(){ }
                ); //animate
            }); //end each
        }//end fresh
    };

    return {};
});
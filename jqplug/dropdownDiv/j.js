define(function (require) {
    var $ = require("seajq");
    require.async("jqplug/dropdownDiv/css.css");
    var cl = require("ctool");
    var cj = require("ctooj");
    /*
     * drop down div
     * */
    (function(){
        var _def = {
            sel:undefined,
            offsetx:0,  offsety: 0,
            dura:200,
            hideOnClick:true,
            zindex:undefined,
            mouseOverShow:false,            //鼠标滑过时显示
            delayHide:450,                   //鼠标移出后隐藏延迟时间
            dura_hide:undefined
        };

        var body = $();
        $(function(){ body = $("body"); });

        $.fn.dropdownDiv=function(config_method,para){
            if(typeof config_method == "string"){
                if(function_object[config_method]){
                    return function_object[config_method].call(this);
                }else{
                    throw "访问的方法不存在";
                }
            }
            var c = $.extend(true,{},_def,config_method);
            return this.each(function(i){
                var me=$(this),d=me.data();
                var dropElement;
                if(c.sel) dropElement = $(c.sel);
                if(!dropElement || !dropElement.length)
                    dropElement = me.next();

                if(!dropElement.length) throw "未找到有效的下拉元素！";

                d.dropElement = dropElement.addClass("drop_ele").addClass("_"+cl.bro());
                d.c = c;
                var dropElement_data = dropElement.data();

                dropElement.appendTo(cj.getHideBox()).css({display:"block"});

                if(c.zindex)    dropElement.css({zIndex: c.zIndex});
                hide(me,dropElement,c,0);


                if(!dropElement_data.hosts) dropElement_data.hosts = [];
                dropElement_data.hosts.push(me);

                if(c.hideOnClick)   dropElement.click(function(){
                    hide(me,dropElement,c);
                });

                me.click(function(){
                    console.log("执行");
                    if(!dropElement.height()){
                        show(me,dropElement,c);
                    }else{
                        if(me != dropElement.data().host){
                            hide(me,dropElement,c,0);
                            show(me,dropElement,c);
                        }else{
                            hide(me,dropElement,c);
                        }
                    }
                });


                /*滑入显示，滑出隐藏*/
                if(c.mouseOverShow){
                    var stout;
                    dropElement.add(me).mouseleave(mouse_leave).mouseenter(mouse_enter);
                    function mouse_leave(){
                        clearTimeout(stout);
                        stout = setTimeout(function(){
                            hide(me,dropElement,c);
                        }, c.delayHide);
                    };
                    function mouse_enter(){
                        clearTimeout(stout);
                        if(!dropElement.height())
                            show(me,dropElement,c);
                    };
                }

                 /*单击空白处隐藏*/
                $(document).click(function(e){
                    var tar = $(e.target);
                    var mee;
                    for(var i=0;i<dropElement_data.hosts.length; i++){
                        mee = dropElement_data.hosts[i];
                        if(e.target == mee[0] || $.contains(mee[0], e.target))
                            return;
                    }
                    if(tar.is(c.sel) || tar.closest(".drop_ele").length)
                        return;
                    hide(me,dropElement,c);
                });
            });
        };

        function hide(me,dropElement,c,dura){
            if(dura!==0) dura = c.dura_hide || c.dura;
            dropElement.stop(true).animate({height:0}, dura,function(){
                dropElement.hide();
                me.removeClass("cdroping");
                dropElement.appendTo(cj.getHideBox());
            });
        }

        function show(me,dropElement,c){
            dropElement.appendTo(body);
            dropElement.show();
            dropElement.data().host = me;
            dropElement.host = me;
            var ofs = me.offset();
            var doc_offset_y = document.documentElement.scrollTop + document.body.scrollTop;
            dropElement.css({
                left:ofs.left + c.offsetx,
                top:ofs.top + c.offsety + me.height() - doc_offset_y
            });
            dropElement.stop(true).animate({height:dropElement.prop("scrollHeight")}, c.dura);
            me.addClass("cdroping");
        }



        var function_object={
            hide:function(para){
                return this.each(function(){
                    var me=$(this),d=me.data();
                    hide(me, d.dropElement, d.c,para);
                });
            },
            show:function(){
                return this.each(function(para){
                    var me=$(this),d=me.data();
                    show(me, d.dropElement, d.c);
                });
            },
            getDropEle:function(){
                return this.first().data().dropElement;
            }
        }
    })();
    return {name:"dropdownDiv"};
});
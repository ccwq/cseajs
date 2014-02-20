/**
 * Created with WebStorm.
 * User: Administrator
 * Date: 14-2-20
 * Time: 上午9:06
 * To change this template use File | Settings | File Templates.
 */
define(function (require, exports, module) {
    var $ = require("jq");
    require("$/mousewheel");        //支持滑轮
    var Cscroller__;
    !function(){
        var $body = $();
        $(function(){ $body = $("body"); });
        var nullFunc = function(){};
        var def = {
            mousewheelValue:0.05,               //滚轮滚动一次移动的像素
            onScroll:nullFunc,
            onScrollComplete:nullFunc,
            disabledMousewhellHandler:false,    //禁止自动的鼠标滚动关联（使用环境，需要根据条件外部条件滚动的情况，需配合onMousewheel使用）
            onMousewheel:nullFunc                   //当鼠标滚动时候
        };
        var Cscroller = function($cscroll,setting){
            var setting = $.extend(true,{},def,setting);
            var me = this;
            me.el = $cscroll;
            var $bar = me.bar = me.el.find(">.csbar");

            //public
            /*
             * 当前位置  0-1
             * */
            var value = me.value = 0;
            //--public

            //滚动条的尺寸
            me.width = me.el.width();
            me.height = me.el.height();
            me.barHieght = me.bar.height();
            me.ratio = 0;                       //0-1之间，取值，表示鼠标的位置

            //滚轮事件
            me.el.parent().on("mousewheel",function(e){
                var delta = e.deltaY;
                setting.onMousewheel.call(me,delta);
                if(setting.disabledMousewhellHandler)   return;
                var wheelRatio = -delta * setting.mousewheelValue;
                me.scrollto(me.ratio + wheelRatio,true,true);
                e.isDefaultPrevented();
            });


            var msDownValue = {},msdv = msDownValue;
            var isMsDown = false;
            $bar.mousedown(function(e){
                msDownValue.mouseX = e.screenX;
                msDownValue.mouseY = e.screenY;
                msDownValue.barX = $bar.position().left;
                msDownValue.barY = $bar.position().top;
                isMsDown = true;
                scrollMsk.show();
                $body.addClass("noSelect");
                disableSelectInIe();
            });
            $(document).mousemove(function(e){
                if(!isMsDown)   return;
                var bartop = e.screenY - msdv.mouseY + msdv.barY;
                if(bartop < 0) bartop = 0;
                var maxTop = me.height - me.barHieght;
                if(bartop > maxTop) bartop = maxTop;
                me.scrolling(bartop/maxTop);
                $bar.css({ top: bartop });
            });

            $(document).mouseup(function(e){
                isMsDown = false;
                scrollMsk.hide();
                me.scrollComplete();
                $body.removeClass("noSelect");
                disableSelectInIe(false);
            });

            //
            me.scrolling = function scrolling(ratio){
                me.ratio = ratio;
                setting.onScroll.call(me,ratio);
            }

            me.scrollComplete = function scrollComplete(){
                setting.onScrollComplete.call(me,me.ratio);
            }
        }

        /*
         * 根据0-1之间的小数滚动
         * 后面两参数可选，表示是否派发相应事件
         * */
        Cscroller.prototype.scrollto = function(ratio,isDispatchCompleteEvent,isDispatchScrollingEvent){
            var me = this;
            if(ratio<0) ratio=0;
            if(ratio>1) ratio = 1;
            var bartop = (me.height - me.barHieght) * ratio;
            me.bar.stop(true).animate({top:bartop},210);
            me.ratio = ratio;
            isDispatchCompleteEvent && me.scrollComplete(ratio);
            isDispatchScrollingEvent && me.scrolling(ratio);
        };

        /*
         * 尺寸改变
         * */
        Cscroller.prototype.reSize = function(h,isDispatchCompleteEvent,isDispatchScrollingEvent){
            var me = this;
            if(h===undefined){
                me.height = me.el.height();
            }else{
                me.el.height(me.height = h);
            }
            me.scrollto(me.ratio,isDispatchCompleteEvent,isDispatchScrollingEvent);
        }
        Cscroller__ = Cscroller;

        //全局
        var scrollMsk = $("<div id='cscrollMask'></div>");
        $(function(){
            scrollMsk.appendTo("body");
        });

        function nosel(){
            return false;
        }

        function disableSelectInIe(flag){
            var body = $body[0];
            if(!body)   return;
            if(flag===undefined || flag)
                body.onselectstart = nosel;
            else
                body.onselectstart = function(){};
        }
    }();
    return Cscroller__;
});
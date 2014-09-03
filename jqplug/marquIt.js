/**
 * 自定义的马灯效果
 *
 * dom结构
 *<div id="slider" class="row3 slider">
 *      <div class="item"><img _src="res/img/pinpaiFace.jpg"/></div>
 *</div>
 *
 *
 */
define(function (require, exports, module) {
    var $ = require("jq");

    function marquIt($mquee,cfg){
        var $mquee = $($mquee);
        var cfg = cfg || {};
        var dura = cfg.dura || 35;
        var stepVal = cfg.stepVal || 2;
        var cur = getCur();
        function step(){
            if(cur.outerWidth()<= -getMLeft(cur)){
                clean(cur);
                cur = getCur();
            }else{
                cur.css("marginLeft",getMLeft(cur) - stepVal);
            }
        }

        var sitvl = setInterval(step, dura);
        $mquee.mouseenter(function(){
            clearInterval(sitvl);
        });

        $mquee.mouseleave(function(){
            sitvl = setInterval(step, dura);
        });

        function clean($el){
            $mquee.append( $el.css({marginLeft:0}) );
        }

        function getCur(){
            return $mquee.find(">.item:first");
        }

        function getMLeft($el){
            return parseInt(cur.css("marginLeft"));
        }
    }


    $.fn.marquIt =  function(cfg){
        return this.each(function(){
            marquIt($(this),cfg);
        });
    }

    return marquIt;
});
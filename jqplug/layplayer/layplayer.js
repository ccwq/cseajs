/**
 * Created with PhpStorm.
 * User: Shinelon
 * Date: 2015/6/15
 * Time: 8:34
 * To change this template use File | Settings | File Templates.
 */
define(function (require, exports, module) {
    var layer = require("$/layer");
    var jwplayer = require("$/jwplayer");
    require("./layplayer.css");
    var dir = require.resolve("./");

    var is_custom_frame_rg = /\.html#?$/;

    var def = {
        //是否在初始化后自动打开
        autopop:false,

        base:"",

        //如果提供的地址是直接可以播放的网址，请改为true
        //如果是视频文件地址，请改为false
        custom_play_page:false
    };

    $.fn.layplayer = function(config){
        var sett = $.extend({},def,config);
        return this.each(function(i){
            var me=$(this);
            var src = me.attr("src");
            var is_custom_frame = is_custom_frame_rg.test(src);

            if(!sett.custom_play_page){
                src = dir + "frame.html?src="+ sett.base + src;
            }


            if(sett.autopop){
                open();
            }else{
                me.click(function(){
                    open()
                })
            }


            function open(){
                layer.ready(function(){
                    var full_layer_index = layer.open({
                        skin:"layplayer",
                        type: 2,
                        shift:666,
                        area: ['80%', '80%'],
                        title:false,
                        content: src
                    });

                    //layer.full(full_layer_index);
                });
            }


        });
    }

    return {};
});
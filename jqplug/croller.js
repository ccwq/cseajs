/**
 * 用法见demo
 * croller/demo.html
 */

define(function(require){
    var cl = require("ctool");
    var $ = require("jq");
    require("./croller/css.css");

    var def = {
        height:undefined,
        item_size:undefined,
        index:0,
        calc_edge_alw:12,                   //计算边界元素的容差
        dura:360,
        controlCont:undefined,              //控制选择器或者$el <div id=ctrlCont><a class=next>下一张</a><a class=prev>上一张</a></div>,
        autoPlay:0                          //为0获取null，undefined等的时候，表示不会自动播放
    };

    var Croller = function($el, config){
        var sett = $.extend({},def,config);
        var me = this;
        me.sett = sett;
        var el = $($el);
        el.addClass("vcscroller");
        var $list = me.$list = el.children();
        $list.addClass("item");
        var list = me.list = $list.map(function(){
            return $(this);
        });

        //未设置高度，取当前高度
        if(!sett.height){
            sett.height = el.outerHeight(true);
        }

        //未设置单元格高度，取当前单元格高度
        if(!sett.item_size){
            sett.item_size = $list.outerHeight(true);
        }

        me.length = list.length;
        me.center_index = me.length/2>>0;

        //位置数组
        me.pos_arr = [];
        me.pos_arr.length = me.length;

        //初始化
        me.index(sett.index);

        //控制元素设置
        if(sett.controlCont){
            $(sett.controlCont).delegate(".prev,.next","click",function(e){
                e.preventDefault();
                var ti = $(this);
                if(ti.is(".prev")) me.prev();
                if(ti.is(".next")) me.next();
            });
        }

        if(sett.autoPlay){
            require.async("ctimer",function(Ctimer){
                me.timer = new Ctimer({
                    delay:sett.autoPlay,
                    callback:function(){
                        me.next()
                    }
                });
            });
        }
    }


    $.extend(Croller.prototype,{
        index:function(i){
            var me=this;
            if(i===undefined)   return me._index;
            var me=this;
            i = cl.modp(i,me.length);
            me.step_num = Math.abs(cl.round_subtract(me._index,i,me.length)) || 0;//跨度
            me._index = i;
            me.__trim_pos_arr();
            me.__pos_item();
        },
        next:function(){
            var me=this;
            me.index(me.index()+1);
            me.timer && me.timer.reCount();
            return me;
        },
        prev:function(){
            var me=this;
            me.index(me.index()-1);
            me.timer && me.timer.reCount();
            return me;
        },

        /**
         * 获取修剪过的数组（能对应实际位置的）
         * @private
         */
        __trim_pos_arr:function(){
            var me=this;

            var d = me.center_index - me.index();

            me.edge_start   = me.pos_arr[0];
            me.edge_end     = me.pos_arr[me.length-1];

            for(var i=0; i<me.length; i++){
                me.pos_arr[i] = me.list[cl.modp(i-d,me.length)];
            }
            return me.pos_arr;
        },


        __pos_item:function(){
            var me=this;
            for(var i=0; i<me.length; i++){
                var ii = i - me.center_index;
                var tar_pos = ii * me.sett.item_size;
                var $item = me.pos_arr[i];
                var dura = me.sett.dura;
                var d = $item.data();
                $item.stop(true);
                if(Math.abs(d.old_tar_pos - tar_pos) > me.sett.item_size*me.step_num + me.sett.calc_edge_alw){
                    dura = 0;
                }

                d.old_tar_pos = tar_pos;
                $item.animate(
                    {
                        top:tar_pos
                    },
                    dura
                )
            }
        }
    });


    return Croller;

});
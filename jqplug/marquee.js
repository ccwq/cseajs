define(function(require){
    /***
     * 作者 wange1228 https://github.com/wange1228
     @name Marquee-Slide
     @description 基于 jQuery 的多功能无缝滚动插件
     @url https://github.com/wange1228/marquee-slide
     @version 0.4.3
     @author 万戈
     @blog http://wange.im
     ***/


    /**
     <div class="mqCont">
         <i class="sanjiao"></i>
         <em class="left"></em>
         <div class="mq">
             <ul>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
             </ul>
         </div>
         <em class="right"></em>
     </div>

     var mq = new MQ(".mq",{
        showNum:5,
        interval: 3600,
        nextElement:".mqCont>.left",
        prevElement:".mqCont>.right",
        auto:false,
        prevBefore: function() { },
        nextBefore: function() { },
        prevAfter: function() { },
        nextAfter: function() { }
     });
     */

    var Timer = require("ctimer");
    var jQuery = require("jq");




    (function($) {
        var Marquee;

        Marquee = (function() {
            function Marquee(element, options) {
                this.elements = {
                    wrap: element,
                    ul: element.children(),
                    li: element.children().children()
                };
                this.settings = $.extend({}, $.fn.marquee.defaults, options);
                this.cache = {
                    allowMarquee: true
                };
                return;
            }

            Marquee.prototype.init = function() {
                this.setStyle();
                this.move();
                this.bind();
            };

            Marquee.prototype.setStyle = function() {
                var floatStyle, liMargin, liOuterH, liOuterW, ulH, ulW, wrapH, wrapW;

                liOuterW = this.elements.li.outerWidth(true);
                liOuterH = this.elements.li.outerHeight(true);
                liMargin = Math.max(parseInt(this.elements.li.css('margin-top'), 10), parseInt(this.elements.li.css('margin-bottom'), 10));
                switch (this.settings.type) {
                    case 'horizontal':
                        wrapW = this.settings.showNum * liOuterW;
                        wrapH = liOuterH;
                        ulW = 9999;
                        ulH = 'auto';
                        floatStyle = 'left';
                        this.cache.stepW = this.settings.stepLen * liOuterW;
                        this.cache.prevAnimateObj = {
                            left: -this.cache.stepW
                        };
                        this.cache.nextAnimateObj = {
                            left: 0
                        };
                        this.cache.leftOrTop = 'left';
                        break;
                    case 'vertical':
                        wrapW = liOuterW;
                        wrapH = this.settings.showNum * liOuterH - liMargin;
                        ulW = 'auto';
                        ulH = 9999;
                        floatStyle = 'none';
                        this.cache.stepW = this.settings.stepLen * liOuterH - liMargin;
                        this.cache.prevAnimateObj = {
                            top: -this.cache.stepW
                        };
                        this.cache.nextAnimateObj = {
                            top: 0
                        };
                        this.cache.leftOrTop = 'top';
                }
                this.elements.wrap.css({
                    position: 'static' ? 'relative' : this.elements.wrap.css('position'),
                    width: wrapW,
                    height: wrapH,
                    overflow: 'hidden'
                });
                this.elements.ul.css({
                    position: 'relative',
                    width: ulW,
                    height: ulH
                });
                this.elements.li.css({
                    float: floatStyle
                });
            };

            Marquee.prototype.bind = function() {
                var _ref, _ref1, _ref2, _ref3, _ref4, _this;

                _this = this;
                if ((_ref = this.settings.prevElement) != null) {
                    _ref.click(function(ev) {
                        ev.preventDefault();
                        _this.prev();
                    });
                }
                if ((_ref1 = this.settings.nextElement) != null) {
                    _ref1.click(function(ev) {
                        ev.preventDefault();
                        _this.next();
                    });
                }
                if ((_ref2 = this.settings.pauseElement) != null) {
                    _ref2.click(function(ev) {
                        ev.preventDefault();
                        _this.pause();
                    });
                }
                if ((_ref3 = this.settings.resumeElement) != null) {
                    _ref3.click(function(ev) {
                        ev.preventDefault();
                        _this.resume();
                    });
                }
                if ((_ref4 = this.elements.wrap) != null) {
                    _ref4.hover(function() {
                        _this.pause();
                    }, function() {
                        _this.resume();
                    });
                }
            };

            Marquee.prototype.move = function() {
                var interval, moveEvent, _this;

                _this = this;
                if (this.settings.auto) {
                    switch (this.settings.direction) {
                        case 'forward':
                            moveEvent = _this.prev;
                            break;
                        case 'backward':
                            moveEvent = _this.next;
                    }
                    interval = _this.settings.interval;
                    setTimeout(function() {
                        moveEvent.call(_this);
                        setTimeout(arguments.callee, interval);
                    }, interval);
                    this.cache.moveBefore = this.cache.moveAfter = function() {
                        return null;
                    };
                } else {
                    this.cache.moveBefore = function() {
                        return _this.cache.allowMarquee = false;
                    };
                    this.cache.moveAfter = function() {
                        return _this.cache.allowMarquee = true;
                    };
                }
            };

            Marquee.prototype.prev = function() {
                var preEls, ul, _this;

                _this = this;
                if (this.cache.allowMarquee) {
                    this.cache.moveBefore.call(this);
                    this.settings.prevBefore.call(this);
                    ul = this.elements.ul;
                    preEls = ul.children().slice(0, this.settings.stepLen);
                    preEls.clone().appendTo(ul);
                    ul.animate(this.cache.prevAnimateObj, this.settings.speed, function() {
                        ul.css(_this.cache.leftOrTop, 0);
                        preEls.remove();
                        _this.cache.moveAfter.call(_this);
                        _this.settings.prevAfter.call(_this);
                    });
                }
            };

            Marquee.prototype.next = function() {
                var sufEls, ul, _this;

                _this = this;
                if (this.cache.allowMarquee) {
                    this.cache.moveBefore.call(this);
                    this.settings.nextBefore.call(this);
                    ul = this.elements.ul;
                    sufEls = ul.children().slice(-this.settings.stepLen);
                    sufEls.clone().prependTo(ul);
                    ul.css(_this.cache.leftOrTop, -this.cache.stepW).animate(this.cache.nextAnimateObj, this.settings.speed, function() {
                        sufEls.remove();
                        _this.cache.moveAfter.call(_this);
                        _this.settings.nextAfter.call(_this);
                    });
                }
            };

            Marquee.prototype.pause = function() {
                this.settings.pauseBefore.call(this);
                this.cache.allowMarquee = false;
                this.settings.pauseAfter.call(this);
            };

            Marquee.prototype.resume = function() {
                this.settings.resumeBefore.call(this);
                this.cache.allowMarquee = true;
                this.settings.resumeAfter.call(this);
            };

            return Marquee;

        })();
        $.fn.marquee = function(options) {
            this.each(function(key, value) {
                var m = $(this);
                var marquee;

                marquee = new Marquee(m, options);
                marquee.init();

                m.data().marquee_ins = marquee;
            });
        };
        $.fn.marquee.defaults = {
            auto: true,
            interval: 3000,
            direction: 'forward',
            speed: 500,
            showNum: 1,
            stepLen: 1,
            type: 'horizontal',
            prevElement: null,
            prevBefore: function() {},
            prevAfter: function() {},
            nextElement: null,
            nextBefore: function() {},
            nextAfter: function() {},
            pauseElement: null,
            pauseBefore: function() {},
            pauseAfter: function() {},
            resumeElement: null,
            resumeBefore: function() {},
            resumeAfter: function() {}
        };
    })($);





    var Marquee = function(el,config){
        var me = this;
        me.el = $(el);
        me.proxy_btn_prev = $("<i></i>");
        me.proxy_btn_next = $("<i></i>");
        me.proxy_btn_pause = $("<i></i>");
        me.proxy_btn_resume = $("<i></i>");


        //连续运动数量方向的缓存
        me._series_move_count = 0;

        me._disable = false;

        me.sett = $.extend({}, def, config, {
            pauseElement:me.proxy_btn_pause,
            resumeElement:me.proxy_btn_resume,
            nextElement:me.proxy_btn_next,
            prevElement:me.proxy_btn_prev
        });


        //依旧支持旧版的控制方式
        config = config || {};
        if(config.pauseElement) $(config.pauseElement).click(function(){
            me.pause();
        });
        if(config.resumeElement) $(config.resumeElement).click(function(){
            me.resume();
        });
        if(config.nextElement) $(config.nextElement).click(function(){
            me.next();
        });
        if(config.prevElement) $(config.prevElement).click(function(){
            me.prev();
        });



        //自定义的自动播放
        me.tock = new Timer({
            delay:me.sett.interval,
            autoStart:false,
            callback:function(){
                me.prev();
            }
        });


        if(me.sett.auto) me.tock.start();

        me.el.marquee($.extend({},me.sett,{auto:false}));

        me.ins = me.el.data().marquee_ins;

        if(me.sett.autoPause){
            me.el.mouseenter(function(){
                me.pause();
            });

            me.el.mouseleave(function(){
                me.resume();
            });
        }
    }


    var def = {
        auto:true,
        /**
         * 鼠标停留的时候自动停止
         */
        autoPause:true,
        interval:3000
    };

    $.extend(Marquee.prototype, {
        next:function(n){
            var me = this;

            if(me._disable) return;

            if(n!==undefined){
                me._series_move_count = n;
            }

            if(me._series_move_count > 1){
                me._series_move_count --;
                me.next.delayCall(me.ins.settings.speed + 10,me);
            }

            me.ins.cache.allowMarquee = true;
            me.ins.next();
            me.tock.recount();

            me.disable(true);
            me.disable.delayCall(me.ins.settings.speed,me,false);
        },

        disable:function(flag){
            var me = this;
            me._disable = flag
        },
        prev:function(n){
            var me = this;
            if(me._disable) return;

            if(n!==undefined){
                me._series_move_count = n;
            }

            if(me._series_move_count > 1){
                me._series_move_count --;
                me.prev.delayCall(me.ins.settings.speed + 10,me);
            }

            //me.proxy_btn_prev.click();
            me.ins.cache.allowMarquee = true;
            me.ins.prev();
            me.tock.recount();

            me.disable(true);
            me.disable.delayCall(me.ins.settings.speed,me,false);
        },
        pause:function(){
            var me = this;
            me.proxy_btn_pause.click();

        },
        resume:function(){
            var me = this;
            me.proxy_btn_resume.click();
            me.tock.recount();
        }
    });

    return Marquee;
});

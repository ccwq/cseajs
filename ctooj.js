/*ctool base on jquery*/
define(function (require) {
    var ctooj = {};
    var $ = require("seajq"),jQuery = $;
    var cl = require("ctool"),  bro = cl.bro;
    var bro_str = "_" + cl.bro();
    $(function(){ $("body").addClass(bro_str); });
    (function(){
        var wi = $(window),sw = 0, sh=0, resiFunc;
        var cb = $.Callbacks();
        wi.resize(resiFunc = function(){
            sw = wi.width();
            sh = wi.height();
            if(sw==0 || sh==0)  return;
            cb.fire(sw,sh,wi);
        });
        //resiFunc();
        $(resiFunc);

        /**
         * @param throttleDelay 节流阀延时，如果为0,或者为true，表示不适用节流阀
         * @param callback 回调function(windowWidth,widnowHeight,$window){}
         * @returns {*|jQuery|HTMLElement}
         */
        function winResize(throttleDelay,callback){
            var delay = 0;
            var _callback = callback;

            if($.isFunction(throttleDelay))
                callback = throttleDelay;
            else
                delay = throttleDelay;

            //delay为0或者true，表示不适用节流阀
            if(delay === 0 || delay === true){
                cb.add(callback);
            }else{
                cb.add(cl.throttle(delay,callback));
                cb.add(cl.debounce(delay,callback));
            }

            //没有找到body时
            if(!document.body){
                cl.run_until(function(){
                    if(document.body){
                        winResize(throttleDelay,callback);
                        return true;
                    }
                });
                return wi;
            }

            /*立即执行一次*/
            function docallback(){
                callback.call(
                    wi,
                    wi.width(),
                    wi.height(),
                    wi
                );
            }

            docallback();
            docallback.delayCall(delay/3);
            return wi;
        }
        ctooj.winResize = winResize;

        /*增加scrpt标签 适用于百度分享等功能*/
        ctooj.addScript = function(url_para,para){
            if(typeof url_para=="string"){
                para = para || {};
                para.src = url_para;
            }else{
                para = url_para;
            }
            para.type = "text/javascript";
            para.parentSel = para.parentSel || "head";
            var scr = document.createElement("script");
            var dom_par = $(para.parentSel).get(0);
            if(!dom_par) throw "script父元素未选择到";
            dom_par.appendChild(scr);
            delete para.parentSel;
            $(scr).attr(para);
        };

        /*阻塞图片加载*/
        /*阻塞网页上当前所有图片加载 直到调用tool.unblock_img_load*/
        ctooj.block_img_load=function(){
            $(function(){
                $("img").each(function(i){
                    var me=$(this);
                    var src = me.attr("src");
                    me.removeAttr("src").attr({ block_src: src });
                });
            });
        };

        ctooj.unblock_img_load = ctooj.unblockImg = function(custom_key){
            custom_key = (custom_key || "_src");
            $(function(){
                $("img[" + custom_key + "]").each(function(i){
                    var me=$(this);
                    var src = me.attr(custom_key);
                    me.removeAttr(custom_key).attr({ src: src });
                });
            });
        };

        /**
         * 在子类或自身开始加载图片
         * */
        $.fn.unblockImg = function(custom_key,callback){
            if(typeof  custom_key == "function"){
                callback = custom_key;
                custom_key = null;
            }
            custom_key = (custom_key || "_src");
            return this.each(function(){
                var me=$(this);
                var img_list = me.find("img["+custom_key+"]").add(me).filter("img["+custom_key+"]");
                var counter = img_list.length;

                if(counter == 0 && callback){
                    callback.call(me, {error: "没有找到有效图片"}, null, null, img_list.length, counter == 0);
                }

                img_list.each(function(){
                    var ti = $(this);
                    var src = ti.attr(custom_key);
                    if(!src)    return;

                    if(callback){
                        cl.imgready(
                            src,
                            function(){
                                counter--;
                                callback.call(ti,null,this.width,this.height,img_list.length,counter == 0)
                            },
                            null,
                            function(){
                                counter--;
                                callback.call(ti,{error:"图片加载失败"},null,null,img_list.length,counter == 0)
                            }
                        );
                    }

                    ti.removeAttr(custom_key).attr({ src: src });

                });

            });
        };
        /*--阻塞图片加载*/


        /*
         * 尺寸为0的容器,用于存放特殊dom对象
         * */
        var hidebox;
        function getHideBox(){
            if(!hidebox){
                hidebox = $("#hidebox");
                if(!hidebox.length)  hidebox = $("<div id='hidebox' style='width: 0; height: 0; overflow: hidden; font-size: 0; position: absolute;'></div>").appendTo("body");
                hidebox.addClass(bro.cls());
            }
            return hidebox;
        };
        ctooj.getHideBox = getHideBox;

        /*
         * 获取图片原始尺寸
         * */
        function getImageOrigSize(url_paras,callback){
            cl.imgPreLoad(url_paras,function(result){
                var $ti = $(this);
                getHideBox().append($ti);
                callback && callback.call(this,$ti.width(),$ti.height(),result);
                if($ti.parent().is("#hidebox")) $ti.remove();
            });
        }
        ctooj.getImageOrigSize = ctooj.getImageSizeByPath = getImageOrigSize;


        /**
         * 获取图片原始尺寸$jq
         * */
        $.fn.get_imgOrg_size = function(callback){
            return this.each(function(){
                var ti = $(this);
                if(!ti.is("img"))   throw "元素必须是图片";
                cl.imgready(ti.attr("src") || ti.attr("_src"),function(){
                    if(callback) callback.call(ti,this.width,this.height);
                });
            });
        };


        !function(){
            var psizeRg = /\d+\,\d+/;
            var config = {
                pw:undefined,                       //如果此值设置，parent宽度会被此值代替
                ph:undefined,

                //不剪裁模式//会调用inContainer
                nocut:false,

                //缩放时候可以附加间距选项
                space:0,

                //当图片尺寸被设置完成执行
                //function($pic){}
                onsize: $.noop,
                customLay: $.noop                   //自定义布局
            };

            /**
             * 剪裁以匹配父容器
             * 注意事项:1父容器必须设置尺寸
             * @returns {*}
             */
            $.fn.maxonLite = function(setting){
                var sett = $.extend({},config,setting);
                return this.each(function(){
                    var ti=$(this),d=ti.data();
                    ti.unblockImg();
                    var par = ti.parent();
                    if("absolute|fixed".indexOf(par.css("position"))===-1){
                        par.css({position:"relative",overflow:"hidden"});
                    }
                    ti.css({position:"absolute"});
                    var path = ti.attr("src") || ti.attr("_src");
                    if(!path)   throw "图片元素无效，没有src或者_src属性";

                    //预设尺寸
                    var psize = ti.attr("psize");
                    if(psize && psizeRg.test(psize)){
                        var s = psize.split(",");
                        d.org_size = [s[0]*1,s[1]*1];
                    }

                    if(!d.org_size || (d.org_size[0]+d.org_size[1]==0)){
                        ti.get_imgOrg_size(function(iw,ih){
                            d.org_size = [iw,ih];
                            (sett.nocut?fit_in_on:fit_out_on).call(ti, d.org_size,[sett.pw || par.width(),sett.ph || par.height()], sett.customLay, sett.space);
                            sett.onsize.call(null,ti);
                        });
                    }else{
                        (sett.nocut?fit_in_on:fit_out_on).call(ti, d.org_size,[sett.pw || par.width(), sett.ph || par.height()], sett.customLay, sett.space);
                        sett.onsize.call(null,ti);
                    }
                });
            };

            function fit_out_on(sizeArr,parSizeArr,customLay, space){
                var css = cl.max_on_container(parSizeArr,sizeArr,space).css;
                //css.marginLeft = (-css.left - parSizeArr) * 0.5;
                //css.left = "50%";
                css = customLay(css,sizeArr,parSizeArr) || css;
                this.css(css);
            }


            function fit_in_on(sizeArr,parSizeArr,customLay,space){
                var css = cl.fit_on_container(parSizeArr,sizeArr, space).css;
                css = customLay(css,sizeArr,parSizeArr) || css;
                this.css(css);
            }

            /**
             * 自定义，位置函数
             */
            $.maxonLite = {
                /**
                 * 使用相对位置居中图片，适用于，父容宽度变化
                 */
                centerImgFunc:function(css){
                    css.left = "50%";
                    css.marginLeft = -css.width * 0.5;
                    return css;
                }
            }
        }();

    })();

    //----------------------------
    /*表单元素美化插件 span实现*/
    (function(){
        require.async("ctool.css");
        var def = {
            useParent:false
        };
        $.fn.extend({
            inputsee:function(config_method,para){
                var method;
                if(typeof config_method == "string"){
                    method = config_method;
                }else{
                    para = config_method;
                }

                var sett = $.extend({},def,para);

                return this.each(function(i){
                    var me=$(this), d=me.data();
                    if(method){
                        if(!inputsee_method[method]) throw "您调用的方法不存在！";
                        inputsee_method[method].call(me,para);
                    }
                    if(me.parent().is(".inputsee")) return;
                    var span;
                    if(sett.useParent){
                        span = me.parent();
                    }else{
                        span = $("<span class='inputsee'></span>");
                        me.after(span).appendTo(span);
                    }
                    span.addClass("inputsee inputsee" + bro_str);

                    if(me.is("textarea")){
                        span.addClass("textarea");
                    }

                    span.addClass(me.attr("inputsee_class")); //外套设置class

                    var blt = me.attr("blank_text") || me.attr("placeholder");
                    me.attr("placeholder") && me.removeAttr("placeholder");
                    if(blt){
                        var label = d.label = $("<span class='blank_label'></span>").text(blt);
                        var labelClass = me.attr("blank_lable_class");      //空label设置class
                        labelClass && label.addClass("labelClass");
                        me.after(label);
                        me.bind("blur focus",function(e){
                            if(e.type == "focus")                           label.hide();
                            else if(e.type == "blur" && !me.val())         label.show();
                        });
                        //自动填充密码后 标签仍再的问题
                        setTimeout(function(){
                            if(me.val())    label.hide();
                        },210);
                    }

                    span.click(function(){ me.focus(); }).addClass(bro());
                });
            }
        });

        var inputsee_method = {
            setBlankText:function(para){
                var me=this,d=me.data();
                if(d.label) d.label.text(para);
            }
        }
    })();
    /*--表单元素美化插件 table实现*/

    //垂直居中
    (function(){
        $.fn.middle = function(){
            return this.each(function(i){
                var me=$(this);
                var val = 0.5*(me.parent().height() - me.height());
                if(me.css("position") == "absolute" && me.css("position") == "position"){
                    me.css({top:val});
                }else{
                    me.css({marginTop:val});
                }
            });
        };
    })();



    (function(){
        $.fn.maxOn=function(config,para){
            if(typeof config == "string"){
                var method = methods[config];
                if(!method) throw "访问的方法不存在！";
                return method.call(this,para);
            };

            if(config && config.calls){
                this.trigger(config.calls,config.callsParam);
                return this;
            }
            if(typeof config == "string") config = {clor:config};
            var defaultConfig = {
                space:0, edgeFix:{bottom:-5,right:0},       //inline-block间距的bug
                posi:{left_perc:0.5,top_perc:0.5,top:0,left:0},     //截取位置。默认居中 即left_perc:0.5,top_perc:0.5
                clor:undefined,                          //closest选择器
                size:{w:0,h:0},                          //直接设定显示尺寸 最优先
                autoFresh:false,                        //在窗口尺寸改变时自动刷新
                calls:"",callsParam:{},                  //方法调用
                //目前支持$el.maxOn({calls:"EV_fresh"})  （执行次函授以当父容器尺寸改变时候）重新计算一次尺寸
                msRadio:1,                               //鼠标移动上去之后图片缩放
                msToggleSetting:{},
                callback:function($this,cssObject,is_first_callback){}
            };
            var EV_fresh="EV_fresh";
            var c = $.extend(true,{},defaultConfig,config);
            var staticObject={};
            this.each(function(){
                var ti=$(this),d = ti.data();
                if(ti.parent().hasClass("scaleWrapper"))    return;
                var
                    img_org_w = d.img_org_w = c.size.w || parseInt(ti.attr("data_pw")),
                    img_org_h = d.img_org_h = c.size.h || parseInt(ti.attr("data_ph"))
                ;
                var closer;
                if(typeof c.clor == "string") closer = ti.closest(c.clor);
                else if(c.clor && c.clor.jquery) closer = c.clor;         //jq对象

                /*显示尺寸 先取参数尺寸，再 closer尺寸 最后本身尺寸*/
                var
                    display_w = d.display_w = c.size.w   || (closer && closer.width())   ||  ti.width(),
                    display_h = d.display_h = c.size.h   || (closer && closer.height())  ||  ti.height()
                ;

                var wrapper;
                if(c.clor)  wrapper = closer;
                else  wrapper = ti.wrap("<span></span>").parent();
                d.wrapper = wrapper;
                ti.css({position:"absolute"});
                var wrapperCss = {
                    width: display_w - c.space * 2,  height: display_h - c.space *2,
                    position:wrapper.css("position")=="absolute"?"absolute":"relative",  display: wrapper.css("display") == "block"?"block":"inline-block",
                    marginBottom: c.edgeFix.bottom, //inline-block间距的bug
                    overflow:"hidden"
                };
                if(c.space) wrapperCss.top = wrapperCss.left = c.space;
                wrapper.addClass("scaleWrapper").css(wrapperCss);

                var is_first_callback = true;
                function fresh(customSizeArray){
                    if(!img_org_w || !img_org_h)  return;
                    var da = cl.max_on_container(customSizeArray || [display_w,display_h],[img_org_w,img_org_h], c.space, c.posi);
                    ti.css(da.css);
                    c.callback.call(ti,da.css,is_first_callback);
                    if(c.msRadio!=1 && is_first_callback){
                        var sizeRatio = c.msRadio, css = da.css;
                        ti.msToggle($.extend(true,c.msToggleSetting,{animCss:{
                            width:css.width*sizeRatio,
                            height:css.height*sizeRatio,
                            left:(1-sizeRatio)*css.width*0.5 + css.left,
                            top:(1-sizeRatio)*css.height*0.5 + css.top
                        }}));
                    }
                    is_first_callback=false;
                }

                if(img_org_w && img_org_h) fresh();
                else{
                    ctooj.getImageOrigSize(
                        ti.attr("src") || ti.attr("_src") || window.errorImageUrl || "At maxOn plug" + Math.random(),
                        function(w,h,info){
                            if(info.error || !ti.attr("src")) ti.attr("src",this.src);
                            img_org_w = d.img_org_w = w; img_org_h = d.img_org_h = h;
                            fresh();
                            ti.trigger("size_got");
                        }
                    );
                };

                if(c.autoFresh) $(window).resize(function(){ fresh(); });
                ti.bind(EV_fresh,fresh);
            });
            return this;
        };

        var methods = {
            fresh:function(size){
                return this.each(function(){

                });
            },
            tweenResizeTo:function(para){
                var css = para.css, dura = para.dura;
                return this.each(function(i){
                    var me=$(this),d=me.data();
                    if(d.img_org_w + d.img_org_h){
                        resize_img();
                    }else{
                        me.bind("size_got",function(){ resize_img(); });
                    }
                    function resize_img(){
                        d.wrapper.stop(true).animate(css,dura || 360);
                        var da = cl.max_on_container([css.width,css.height],[d.img_org_w, d.img_org_h]);
                        me.stop(true).animate(da.css,dura || 360);
                    }
                });
            },
            tweenBack:function(para){
                var dura= para.dura;
                var css = para.css;
                return this.each(function(){
                    var me=$(this),d=me.data();
                    var cs = $.extend(css,{width: d.display_w,height: d.display_h});
                    d.wrapper.stop(true).animate(cs,dura || 360);
                    var da = cl.max_on_container([d.display_w, d.display_h],[d.img_org_w, d.img_org_h]);
                    me.stop(true).animate(da.css,dura || 360);
                });
            }
        };
    })();
    //maxOn-----------------------------------------------------------------------------------

    /*字符截取*/
    (function(){
        $.fn.textLeng = function(leng,more_sign){
            return this.each(function(i){
                var t = $(this);
                var length = leng || t.attr("strleng");
                if(length!==undefined)
                    t.text(t.text().replace(/\s/g,"").strleng(length,more_sign));
            });
        };
    })();
    //textleng------------------------------------



    /*
     * 鼠标感应
     * */
    $.fn.msToggle = function(config){
        var defaultConfig = {
            cls:"msover",           //切换class
            css:{},                  //切换css
            animCss:{},
            animDura:200,           //动画切换时间
            attr:{},                 //切换属性        //src属性时候{dir}{fname}{ftype}分别表示目录路径，文件名称，文件类型名称
            org_config:{},
            host:null,              //host为空，鼠标感应自己切换自己，否则感应host 切换自己
            plug:{},
            disableStr : {mover:"disableMover",mout:"disableMout",all:"disableAll"},          //禁用字符串
            isPreLoadImage:true
        };
        var c = $.extend(true,defaultConfig,config);
        this.each(function (i) {
            var me = $(this);
            var d = me.data();
            d.status = {};d.me=me;
            var cc = d.cc = $.extend(true,{},c);    //深复制配置
            var val_org = d.val_org = {css:{},attr:{},animCss:{}};
            var has_css = d.status.has_css = !$.isEmptyObject(cc.css);
            var has_attr = d.status.has_attr = !$.isEmptyObject(cc.attr);
            var has_animCss = d.status.has_animCss = !$.isEmptyObject(cc.animCss);

            if(has_css)  for (var k1 in cc.css) {val_org.css[k1] = me.css(k1);}
            var reg_dir_fname_ftype = /(.*\/)([^\/]*)\.(\w{1,5})$/
            if(has_attr) for (var k2 in cc.attr) {
                val_org.attr[k2] = me.attr(k2);
                if(k2 == "src"){
                    reg_dir_fname_ftype.test(me.attr(k2));
                    cc.attr[k2] = cc.attr[k2].replace("{dir}",RegExp["$1"]).replace("{fname}",RegExp["$2"]).replace("{ftype}",RegExp["$3"]);
                    cc.isPreLoadImage && imgPreLoad(cc.attr[k2]);//预加载
                }
            }
            if(has_animCss) for (var k3 in cc.animCss) {val_org.animCss[k3] = me.css(k3);}

            //自定义原始属性
            if(!$.isEmptyObject(cc.org_config)){$.extend(true,val_org,cc.org_config);}
            if(c.host)  c.host.data().me=me;
            (c.host||me).mouseenter(function(e){
                if(d[c.disableStr.all] || d[c.disableStr.mover])    return;
                me.addClass(d.cc.cls);
                if(has_css) me.css(d.cc.css);
                if(has_attr) me.attr(d.cc.attr);
                if(has_animCss){
                    me.stop(true);
                    me.animate(cc.animCss,cc.animDura);
                }
            });
            (c.host||me).mouseleave(function(e){
                if(d[c.disableStr.all] || d[c.disableStr.mout])    return;
                me.removeClass(d.cc.cls);
                if(has_css) me.css(d.val_org.css);
                if(has_attr) me.attr(d.val_org.attr);
                if(has_animCss){
                    me.stop(true);
                    me.animate(d.val_org.animCss,d.cc.animDura);
                }
            });
        });
        return this;
    };



    /*
     *当浏览器滚动到某个位置，根据回调的对象的参数，触发回调方法。仅触发一次.
     * */
    (function(){
        var CVScrollTo = {
            callbackList:[],
            init:function(){
                var me = this;
                $(window).scroll(function(){ me.update(); });
                return me;
            },
            update:function(){
                var me=this;
                var scrollTop = document.documentElement.scrollTop + document.body.scrollTop;
                for(var i=0;i<me.callbackList.length;i++){
                    var callbackobjce = me.callbackList[i];
                    if(!callbackobjce.fired && callbackobjce.scrollTop<=scrollTop){
                        callbackobjce.fired = true;
                        callbackobjce.callback(scrollTop);
                    }
                };
                return me;
            },

            /*
             * callbackObject: { scrollTop:500, callback:gowhere.init}
             * */
            add:function(callbackObject){
                var me=this;
                if(callbackObject.scrollTop === undefined){
                    throw "请传入滚动到位置的值";
                }
                if(!callbackObject.callback){
                    throw "回调函数是必须指定";
                }
                me.callbackList.push(callbackObject);
                me.update();
                return me;
            }
        };

        CVScrollTo.init();
        ctooj.vScrollTo = CVScrollTo;
    })();

    /*
    * 最大化等比剪裁，与ctool内同名方法不同个，可以附加posi
    * */
    !function(){
        function max_on_container(continerWH, picWH, space, posi) {
            if(!space)  space=0;
            var def_posi  = {top:0,left:0,top_perc:0.5,left_perc:0.5};
            posi = $.extend(def_posi,posi);
            var cw = continerWH[0] - space,ch = continerWH[1] - space;
            var pw = picWH[0],ph = picWH[1];
            var cn = cw / ch,pn = pw / ph;
            var tmpArr=(cn > pn)?[cw, cw / pn]:[ch * pn, ch];
            tmpArr.push((cw - tmpArr[0]) * posi.left_perc  +  posi.left);
            tmpArr.push((ch - tmpArr[1]) * posi.top_perc   +  posi.top);
            tmpArr.css={width:tmpArr[0],height:tmpArr[1],left:tmpArr[2],top:tmpArr[3]};
            return tmpArr;
        };
        cl.max_on_container = max_on_container;
    }();

    //get kissy
    !function(){
        var cfg = { combine: true,debug:true,tag:""};
        var kissy = window.KISSY,req_ing=false,cache=[];
        var kissPath = "//g.tbcdn.cn/kissy/k/1.4.1/seed-min.js?t=20140212";

        /**
         * 从tbcdn获取KISSY资源
         * */
        ctooj.getKissy = function getKissy(callback,config){
            if(kissy){
                kissy.config($.extend(true,cfg,config));
                callback && callback.call(kissy,kissy);
                return;
            }
            cache.push({cb:callback,paras:config});
            //防止在请求中，出现重复请求。保证全局kissy只有一个
            if(req_ing)  return;

            $.getScript(kissPath)
                .done(function(){
                    kissy = window.KISSY;
                    if(cache.length) $.each(cache,function(k,ele){
                        getKissy(ele.cb,ele.paras);
                    });
                })
                .fail(function(e){ throw "tbcdn获取失败！" })
            ;
            req_ing = true;
        };
    }();


    //多参数请求
    !function(){
        /**
         * ajax多地址请求，第n个路径请求失败，则自动请求地n+1个路径
         * @param reqPathArray 路径，或者路径列表，列表支持两种形式["path1","path2"]和"path1;path2"
         * @param 请求参数，当传入String类型，则认为此项为type
         * @type string "GET"表示使用get方式请求;"GET;json",表示使用GET方式请求，数据类型为json
         * @return $.Deferred.
         * */
        ctooj.reqPlus = $.reqPlus = function(reqPathArray,para,typeValue,callback){
            var df = $.Deferred();
            var dataType = "text",typeStr,reqType;
            if(!reqPathArray || !reqPathArray.length){
                df.reject("未传入有效的路径");
                throw "未传入有效的路径";
            }

            reqType = typeValue;

            //多地址间用分号分割
            if(typeof reqPathArray == "string") {
                reqPathArray = reqPathArray.split(";")
            }
            if($.isFunction(para)){
                callback = para;
            }
            if( $.isFunction(typeValue)){
                callback = para;
            }

            //todo:此处问题过于灵异，暂时回避
            if(typeof para == "string") {
                typeValue = para;
                reqType = para;
                para=undefined;
            }

            //如果type包含分号，则认为此type同时设置requestType和dataType
            //if(typeValue.indexOf(";")!=-1){       //todo:此处会出错，因为typeValue无论如何都会为空
            if(reqType && reqType.indexOf(":")!=-1){
                var splitList = typeValue.split(":");
                reqType = splitList.shift();
                dataType = splitList.shift();
            }

            var cur_path_index = 0;

            //递归请求
            function reqStart(path){
                req(reqPathArray[cur_path_index],para,reqType,dataType)
                    .done(function(data){
                        df.resolve(data);
                        if(callback) callback.call(null,data)
                    })
                    .fail(function(msg){
                        cur_path_index++;
                        if(reqPathArray[cur_path_index]) reqStart(reqPathArray[cur_path_index]);
                        cl.log("地址请求失败(上一个错误，可忽略)",reqPathArray[cur_path_index - 1]);
                    })
                ;
            };
            reqStart(reqPathArray[0]);
            return df;
        }

        function req(url,para,type,dataType){
            return $.ajax({
                url:url,
                data:para,
                type:type || "GET",
                dataType:dataType
            });
        }
    }();//多参数请求end


    //根据 html或者body的某种选择器，来执行相应的函数
    ctooj.rootCondiFunc = ctool.rootCondiFunc;

    /**
     * 获取$元素css的值（剔除单位）
     * @param prop
     * @returns {Number}
     */
    $.fn.getCssVal = function(prop,getFullString){
        return  getFullString?this.css(prop):parseInt( this.css(prop) );
    };

    /**
     * 获取css规则某属性的值（只适用于简单规则如#a{},.bb{}）
     *  fn("#abc","fontSize")
     *  fn($el,"fontSize")
     *  fn("fontSize")               //取#bridge fontSize的值
     *
     * @param selector 任意有效选择器
     * @param prop  规则的属性名
     * @returns {Number}
     */
    ctooj.getCssRuleVal = $.getCssRuleVal = function(selector, prop, getFullString){
        var bd = $("body");
        if(!bd.length)  throw "请于dom ready之后调用该函数！";
        cssRuleShadow.removeAttr("id").removeAttr("class");

        var $el = $(selector);
        var re;

        if($el.length){
            re = $el.getCssVal(prop,getFullString);
        }else if(/^(#|\.)/.test(selector)){
            cssRuleShadow.attr(RegExp["$1"]=="#"?"id":"class", selector.substr(1));
            bd.append(cssRuleShadow);
            re = cssRuleShadow.getCssVal(prop,getFullString);
            cssRuleShadow.detach();
        }else{
            //什么都没找到
            re = "";
        }
        return re;
    };


    //css单位
    var rg_css_unit = /(:\s*\d+\.?\d*)(ms|px|s|em)/g;

    /**
     * 获取并解析font配置中的信息。
     * @param id_or_class_$dom 柜子名称，id或者class也可以是某jquery对象
     *
     * #bridge{
     *      font-family: "hh:@{header_h},h:'9555ss',song:'8855px', cc:4545px";
     * }
     * 结果:Object  {hh: 112, h: "9555ss", song: "8855px", cc: 4545}
     */
    ctooj.getCJObj = function(id_or_class_$dom){
        id_or_class_$dom = id_or_class_$dom || "#bridge"
        var ffs = ctooj.getCssRuleVal(id_or_class_$dom,"fontFamily", true);
        var ffs = $.trim(ffs).replace(/^"|'/,"({").replace(/"|'$/,"})");

        //去除单位
        ffs = ffs.replace(rg_css_unit,"$1");

        //去除引号转义
        ffs = ffs.replace(/\\('|")/g,"\"");

        var obj;
        try{
            obj = eval(ffs);
        }catch(e){
            throw "未找到" + id_or_class_$dom +"对应的css配置，或者配置非法:" + ffs;
        }

        return obj;
    }
    var cssRuleShadow = $("<div style='display:none;'></div>");


    //ajax ifarme
    !function(){


        var def = {
            ondata: $.noop                  //加载完成后执行 //如果有返回值，则以返回值处理的数据为准
            /**
             * onload:function(html){
             *      //return newhtml;
             * }
             */
            ,complete: $.noop               //元素加入dom后，触发
            ,appended: $.noop               //展示以后


            ,splitTag:">>"
            ,emptyCont:true
            ,src:""
            ,selector:""
        };


        /**
         * 使div增加类似iframe的配置 <div src="/pages>>#abc span.light"/>
         * @returns {*}
         */
        $.fn.aiframe = function(cfg){
            var sett = $.extend({},def,cfg);
            return this.each(function(i){
                var me = $(this);
                var src = sett.src || me.attr("src");
                if(!src) return;
                var arr = src.split(sett.splitTag);
                src = arr[0];
                var seletor = sett.selector || arr[1] || me.attr("selector");
                $.get(src)
                    .done(function(data){
                        var data = sett.ondata(data)|| data;
                        data = "<div>"+data+"</div>";               //有时候需要filter来找元素，这样可以全部用find
                        var dom = $(data);
                        if(seletor){ dom = dom.find(seletor); }
                        if(sett.emptyCont){ me.empty(); }
                        dom = sett.complete.call(me,dom) || dom;
                        me.append(dom);
                        sett.appended.call(me,dom);
                    })
                    .fail(function(){
                        throw "aiframe请求失败:" + src;
                    })
                ;
            });
        }
    }();


    /**
     * 使所有标签支持href跳转
     */
    ctooj.hrefPlus = function(){
        $(document).delegate("[href]","click",function(){
            var cur = $(this);
            if(cur.is("a")) return;
            if(cur.is("[target=_blank]")){
                open(cur.attr("href"));
            }else{
                location.href = cur.attr("href");
            }
        });
    }


    /**
     * 传入各种类型，传出json
     * 标准json字符串（属性名带引号），非标准,objcet（此情况直接返回）
     * @param string_objcet
     * @param 如果解析出错，会执行改方法
     */
    ctooj.tojson = function(string_objcet, errFunc){
        var reobj;
        if(typeof string_objcet == "string"){
            try{
                reobj = $.parseJSON(string_objcet);
            }catch(e){
                try{
                    reobj = eval("(" + string_objcet + ")")
                }catch(e){
                    cl.log("传入tojson字符串非法:" + string_objcet);
                    if(errFunc) errFunc.call(null);
                }
            }
        }else{
            reobj = string_objcet;
        }
        return reobj;
    }


    /**
     * 返回当前页面目录的，绝对路径
     * @type {string}
     */
    var base = "";
    ctooj.getbase = function(){
        if(!base){
            var aa = $("<a href='./'></a>").appendTo("body");
            base = aa.prop("href").replace("#","");
            aa.remove();
        }
        return base;
    };


    /**
     * 扩展[]: 用法，例：[*:nochild]
     */
    $.extend($.expr[':'], {
        /**
         * 没有子元素（与:empty的区别是empty认为文本节点也是子元素）
         */
        nochild: function(el, i, m)
        {
            return !$(el).children().length;
        }
    });

    /**
     * 禁止ie下，单击链接时出现border
     */
    ctooj.hide_ie_link_border = function(){
        $(document).delegate("a","focus click", function(){
            this.blur();
        });
    }


    /**
     * 使用页内锚点跳转变平滑
     */
    ctooj.anchor_jump_smooth = function(){
        //页内跳转，平滑
        $(document).delegate("a[href^=#]","click",function(e){
            var idstr = this.getAttribute("href");
            var idel = $(idstr);
            if(!idel.length){
                return;
            }else{
                e.preventDefault();
                $("body,html").animate({
                    scrollTop:idel.offset().top - (offset || 0)
                },500);
            }
        });
    }




    /**
     * 状态按钮组
     * 可作简易导航,单选按钮组。
     * @param selector
     */
    function tog_gp(selector){
        selector = selector || ".togg[tog_type]>em"
        $(document).delegate(selector,"click mouseenter",function(e){
            var cur = $(this);
            if(cur.is(".cur"))  return;
            var par = cur.parent();
            var togg_type = par.attr("tog_type") || "mouseenter";
            if(e.type != togg_type) return;
            cur.addClass("cur").siblings().removeClass("cur");
            par.trigger("change",[par.find("em").index(cur), cur]);
        });
    }

    ctooj.tog_gp = $.tog_gp = tog_gp;


    /**
     * 当内部图片加载完成后，执行回掉
     * config.allready(error,)
     * config.oneready(error)
     */
    $.fn.imgReady = function(config){
        config = config || {};
        if(typeof config == "function"){
            config = {allready:config}
        }

        config.allready = config.allready || $.noop;
        config.oneready = config.oneready || $.noop;


        this.each(function(){
            var ti = $(this);
            var pool = [];
            var url_img_dic ={}
            if(ti.is("img")){
                var url = ti.attr("_src") || ti.attr("src");
                pool.push(url);
                url_img_dic[url] = ti;
            }else{
                ti.find("img").each(function(){
                    var tt = $(this);
                    var url = tt.attr("_src") || tt.attr("src");
                    url_img_dic[url] = tt;
                    pool.push(url);
                })
            }

            $.each(pool,function(k,el){
                cl.imgready(
                    el,
                    function(){
                        judge.call(this)
                    },
                    null,
                    function(){
                        judge.call(this,true)
                    }
                )
            });

            /**
             * 判断
             */
            function judge(iserror){
                pool.pop();
                var islast = !pool.length;

                var ti = url_img_dic[this.getAttribute("src")];
                config.oneready.call(ti, iserror, ti, this, islast);

                if(islast) config.allready.call(ti);
            }
        });
    }


    /**
     * 当某元素滑动到顶部或者底部的时候
     * callback function(state){}
     *      state可能的值 -1 0 1
     *          -1表示在顶端
     *          0两种情况，容器内容不足以存在滚动条|滚动到中间
     *          1滚动到底部
     * @returns {*}
     */
    $.fn.scrollToEdge = function(config,callback){
        var sf = arguments.callee;
        if(!sf.def){
            //默认配置
            sf.def = {
                throttle: 333,
                offset_y: 6,
                triggerOnInit: true,
                onTopClassName: "__top",
                onBottomClassName: "__bot"
            };
        }


        if(typeof config == "function"){
            callback = config;
            config = {};
        }

        callback = callback || $.noop;
        var sett = $.extend({}, sf.def,config);

        var els = this;
        return els.each(function(i){
            var me=$(this);

            var state = undefined;
            var old_state = undefined;


            var scrollHandler1 = cl.throttle(sett.throttle,function(flag){
                //不足以存在滚动条
                if(body.prop("scrollHeight") <= wi.height()){
                    old_state = state;
                    state = 0;
                    //顶部
                }else if(cl.scrollY()<sett.offset_y){
                    old_state = state;
                    state = -1;
                    //底部
                }else if(cl.scrollY() > body.prop("scrollHeight") - sett.offset_y - wi.height()){
                    old_state = state;
                    state = 1;
                    //中间
                }else{
                    old_state = state;
                    state = 0;
                }

                setfunc();
            })

            var scrollHandler2 = cl.throttle(sett.throttle,function(flag){
                var view_h = me.height();
                var cont_h = me.prop("scrollHeight");           //滚动距离总长(注意不是滚动条的长度)
                var nScrollTop = me.prop("scrollTop");                  //滚动到的当前位置

                //不足以撑起
                if(view_h >= cont_h){
                    old_state = state;
                    state = 0;
                }else if(nScrollTop<sett.offset_y){
                    old_state = state;
                    state = -1;
                }else if(nScrollTop + view_h >= cont_h - sett.offset_y){
                    old_state = state;
                    state = 1;
                }else{
                    old_state = state;
                    state = 0;
                }
                setfunc();

            })


            var  setfunc = function(){
                if(state !== old_state){
                    me.removeClass(sett.onBottomClassName+" "+sett.onTopClassName);
                    if(state == 1){
                        me.addClass(sett.onBottomClassName);
                    }else if(state==-1){
                        me.addClass(sett.onTopClassName);
                    }
                    callback.call(me,state);
                }
            }

            var type;

            //对body document window html单独处理
            if(me[0] === window || me[0] === document || me.is("body") || me.is("html")){
                var body = $("body");
                var wi = $(window);
                sett.triggerOnInit && scrollHandler1(1);
                $(window).scroll(scrollHandler1);
                type = 0;
            }else{
                //其他元素的处理
                sett.triggerOnInit && scrollHandler2(1);
                me.scroll(scrollHandler2);
                type = 1;
            }


            //刷新
            els.fresh = function(){
                if(type == 0){
                    scrollHandler1();
                }else{
                    scrollHandler2();
                }
            }

        });
    }


    /**
     * c_loading开关切换
     * @returns {*}
     */
    $.fn.c_loading_toggle = function(){
        return this.each(function(k,el){
            var ti = $(this).toggleClass("c_loading_disable");
            if(!ti.is(".c_loading")){
                ti.addClass("c_loading");
            }
        });
    }

    /**
     * 关闭c_loading
     * @returns {*}
     */
    $.fn.c_loading_disable = function(){
        return this.each(function(k,el){
            $(this).addClass("c_loading_disable");
        });
    }

    /**
     * 开启c_loading
     * @returns {*}
     */
    $.fn.c_cloading_enable = function(){
        return this.each(function(k,el){
            var ti = $(this);
            ti.removeClass("c_loading_disable");
            ti.addClass("c_loading");
        });
    }

    /**
     * c_loading全局停止控制
     * @type {{disable_all: Function, enable_all: Function}}
     */
    ctooj.c_loading = $.fn.c_loading = {
        disable_all:function(){
            $(".c_loading").c_loading_disable();
        },
        enable_all :function(){
            $(".c_loading").c_cloading_enable();
        }
    };

    return ctooj;
});

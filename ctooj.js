/*ctool base on jquery*/
define(function (require) {
    var tool = {};
    var $ = require("seajq"),jQuery = $;
    var ctool = require("ctool"),  bro = ctool.bro;
    var bro_str = "_" + ctool.bro();
    $(function(){ $("body").addClass(bro_str); });
    (function(){
        (function(){
            var wi = $(window),sw = 0, sh=0, resiFunc;
            var cb = $.Callbacks();
            wi.resize(resiFunc = function(){
                sw = wi.width();
                sh = wi.height();
                if(sw==0 || sh==0)  return;
                cb.fire(sw,sh,wi);
            });
            resiFunc();
            if(sw==0 || sh==0)  $(resiFunc);

            /*
            * callback_immediately_run
            *                           :true 立即调用一次
            *                           ：function 回调
            *   callback:   回调
            *           function(window.width,window.height,$(window))
            * */
            function winResize(callback_immediately_run,callback,callbackScope){
                var immediately_run = false;
                if(typeof callback_immediately_run =="function")
                    callback=callback_immediately_run;
                else
                    immediately_run = callback_immediately_run;

                var scope = callbackScope;
                if($.isFunction(callback_immediately_run)){
                    scope = callback;
                }
                cb.add(callback);
                if(immediately_run) callback(scope || wi.width(),wi.height(),wi);
                return wi;
            }
            tool.winResize = winResize;

            /*增加scrpt标签 适用于百度分享等功能*/
            tool.addScript = function(url_para,para){
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
            tool.block_img_load=function(){
                $(function(){
                    $("img").each(function(i){
                        var me=$(this);
                        var src = me.attr("src");
                        me.removeAttr("src").attr({ block_src: src });
                    });
                });
            };

            tool.unblock_img_load = tool.unblockImg = function(custom_key){
                custom_key = (custom_key || "block_src");
                $(function(){
                    $("img[" + custom_key + "]").each(function(i){
                        var me=$(this);
                        var src = me.attr(custom_key);
                        me.removeAttr(custom_key).attr({ src: src });
                    });
                });
            };

            /*
            * 开始加载被延迟的图片
            * */
            $.fn.unblockImg = function(custom_key){
                custom_key = (custom_key || "_src");
                return this.each(function(){
                    var me=$(this);
                    var src = me.attr(custom_key);
                    me.removeAttr(custom_key).attr({ src: src });
                });
            };
            /*--阻塞图片加载*/

            /*一些自定义alert tip msg confirm*/
            tool.jbox_alert = function(msg,title,type,config){
                require.async("jBox/j",function(){
                    $.jBox.prompt(msg, title, type, config);
                });
            };

            tool.jbox_tip = function(msg,type,config){
                require.async("jBox/j",function(){
                    $.jBox.tip(msg || '正在优化', type || 'loading', $.extend({opacity:0.72},config));
                });
            };

            tool.jbox_msg = function(msg,tit,config){
                require.async("jBox/j",function(){
                    $.jBox.messager(msg || "温馨提示", tit||"温馨提示！", null, config);
                });
            };

            tool.jbox_confirm = function(msg,tit,callback,config){
                require.async("jBox/j",function(){
                    $.jBox.confirm(msg ||"确定？", tit||"请选择：", callback, config);
                });
            };

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
            tool.getHideBox = getHideBox;

            /*
             * 获取图片原始尺寸
             * */
            function getImageOrigSize(url_paras,callback){
                ctool.imgPreLoad(url_paras,function(result){
                    var $ti = $(this);
                    getHideBox().append($ti);
                    callback && callback.call(this,$ti.width(),$ti.height(),result);
                    if($ti.parent().is("#hidebox")) $ti.remove();
                });
            }
            tool.getImageOrigSize = tool.getImageSizeByPath = getImageOrigSize;


            /*
            * 获取图片原始尺寸$jq
            * */
            $.fn.get_imgOrg_size = function(callback){
                return this.each(function(){
                    var ti = $(this);
                    if(!ti.is("img"))   throw "元素必须是图片";

                    getImageOrigSize(ti.attr("src") || ti.attr("_src"),function(iw,ih){
                        if(callback) callback.call(ti,iw,ih);
                    });
                });
            };


            !function(){
                /**
                * 剪裁以匹配父容器
                * */
                $.fn.maxonLite = function(){
                    return this.each(function(){
                        var ti=$(this),d=ti.data();
                        var par = ti.parent();
                        if("absolut|fixed".indexOf(par.css("position"))===-1){
                            par.css({position:"relative",overflow:"hidden"});
                        }
                        ti.css({position:"absolute"});
                        var path = ti.attr("src") || ti.attr("_src");
                        if(!path)   throw "图片元素无效，没有src或者_src属性";

                        if(!d.org_size){
                            ti.get_imgOrg_size(function(iw,ih){
                                d.org_size = [iw,ih];
                                fit_out_on.call(ti, d.org_size,[par.width(),par.height()]);
                            });
                        }else{
                            fit_out_on.call(ti, d.org_size,[par.width(),par.height()]);
                        }

                    });
                };

                function fit_out_on(sizeArr,parSizeArr){
                    this.css(ctool.max_on_container(parSizeArr,sizeArr).css);
                }
            }();

        })();




        //----------------------------
        /*表单元素美化插件 table实现*/
        (function(){
            require.async("ctool.css");
            $.fn.extend({
                inputsee:function(config_method,para){
                    return this.each(function(i){
                        var me=$(this), d=me.data();
                        if(typeof config_method == "string"){
                            if(!inputsee_method[config_method]) throw "您调用的方法不存在！";
                            inputsee_method[config_method].call(me,para);
                        }
                        if(me.parent().is(".inputsee")) return;
                        var span = $("<span class='inputsee'></span>").addClass("inputsee" + bro_str);
                        me.after(span).appendTo(span);
                        if(me.is("textarea")){
                            span.addClass("textarea");
                        }

                        span.addClass(me.attr("inputsee_class")); //外套设置class

                        //debugger;
                        //span.css({lineHeight:span.height() + "px"});

                        var blt = me.attr("blank_text") || me.attr("placeholder");
                        me.removeAttr("placeholder");
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


        (function($){
            var stringMap={
                dire:{l:'left',r:"right",t:"top",b:"bottom"},           //方向
                edeg:{m:"margin",b:"border",p:"padding"},               //和模型边沿
                edegDire:{l:'Left',r:"Right",t:"Top",b:"Bottom"}
            }
            $.fn.extend({
                /*
                 * 兼容性行内样式
                 * 用法: data_compa_style="ie6,ie7{a:8};ie7{};ie8{};ie9{};ch,ie9{width:'-5'}"
                 *       data_compa_style="ie6,ie7{par_width_c:'-8'}" 宽度相对于父容器的宽小8px，_c自动增加margin为4
                 *       data_compa_class="ie6,ie7:ie67;ch:chrome_style"
                 * config:  styleStr同data_compa_style,class同data_compa_class
                 *          highPriority:false,如果设置为true，优先级高于行内设置
                 *          以下语句作用相同：
                 compatStyle({styleStr:"all{par_width:'-10',marginLeft:5}"});
                 compatStyle("all{par_width_c:'-10'}");
                 compatStyle({all:{par_width_c:'-10'}});
                 用法详解：
                 innerPadding ；div 宽度 50，设置innerPaddingLeft:10,宽度 40,paddingLeft:10
                 p_width_c,pa_width_c,par_...:'-10'->假设父宽度40，此时元素宽度为30，并且marginLeft:5;
                 c_width_c,ch_width_c,chi_...:'+20'->假设子1宽度40，此时元素宽度为60，并且paddingLeft:5;(尚未完成)
                 c_inPadding,c_inPaddingLeft...          设置盒边沿，并保持盒整体尺寸为盒原内尺寸
                 c_inBorderWidth,c_inBorderTopWidth...   同上
                 c_fullWidth,c_fullHeight:'300 pb'           参见fullWidth..
                 * */
                compatStyle:function(cssStyle_config){
                    var config;
                    if(typeof(cssStyle_config) == "string"){
                        config = {styleInfo:cssStyle_config};
                    }else if(cssStyle_config){
                        if(cssStyle_config.styleInfo || cssStyle_config.classStr || cssStyle_config.styleStr){
                            config = cssStyle_config;
                            if(!config.styleInfo && config.styleStr) config.styleInfo = config.styleStr;        //为了兼容旧版写法
                            delete config.styleStr;
                        }else config = {styleInfo:cssStyle_config};
                    }else config = {};
                    this.each(function(i){
                        var me = $(this), d = me.data() ,par =me.parent();
                        d.displayCache = me.css("display");
                        if(!config.highPriority) setit(me);
                        var styleStr = me.attr("c_style")||me.attr("data_compat_style"),  classStr = me.attr("c_class")||me.attr("data_compat_class");
                        styleStr && setStyle(styleStr,me); classStr && setClass(classStr,me);
                        if(config.highPriority) setit(me);
                    });
                    return this;

                    function setit(me){
                        if(config["styleInfo"]) setStyle(config["styleInfo"],me);
                        if(config["classStr"]) setClass(config["classStr"],me);
                    }

                    function setStyle(data,me){
                        if(typeof data =="object") setStyle_obj(data,me);
                        else setStyle_str(data,me);
                    }
                    /*接收样式字符串，需要eval*/
                    function setStyle_str(style_str,me){
                        me.removeAttr("data_compat_style");
                        var styleStrArr = style_str.split(";"),  mecss;
                        $.each(styleStrArr,function(key,el){
                            var ar1 = el.split("{");
                            mecss = eval("({" + ar1[1]+")");
                            if(bro(ar1[0]) || ar1[0]=="all") {me.css(styleParse(me,mecss));}
                        });
                        return mecss;
                    }
                    /*接收样式Object*/
                    function setStyle_obj(style_obj,me){
                        $.each(style_obj,function(key,el){
                            if(bro(key) || key=="all") {me.css(styleParse(me,el));}
                        });
                    }

                    //解析自定义样式属性
                    function styleParse(me,orgCssObject){
                        var mecss = $.extend(true,{},orgCssObject);
                        $.each(mecss,function(kk,ell){
                            var eleNum = parseInt(ell);
                            if(parseFuncs[kk]){                                 //方法对象里存在此函数
                                parseFuncs[kk].call(me,mecss,kk,ell);
                                delete mecss[kk];
                            }else if(/^c_/.test(kk)){
                                if(/^c_inPadding(\w*)$/.test(kk)){				//设置padding并保持盒沿尺寸
                                    var cssObj = {};
                                    cssObj['padding'+ RegExp["$1"]] = eleNum;
                                    me.setEdge(cssObj)
                                }else if(/^c_inBorder(\w*)Width$/.test(kk)){	//设置border并保持盒沿尺寸
                                    var cssObj = {};
                                    cssObj['border'+ RegExp["$1"] + "Width"] = eleNum;
                                    me.setEdge(cssObj);
                                }else if(/^c_all(Width|Height)$/.test(kk)){
                                    var vh = RegExp["$1"],isWidth = vh=="Width";
                                    var paras = ell?ell.split(" "):[];
                                    if(!paras[0])  me.sizeWithEdge(isWidth?0:false,!isWidth?0:false,paras[1]);
                                    else  me['full'+vh](parseInt(paras[0]),paras[1])
                                }else if(/^c_vcenter$/.test(kk)){
                                    me.css({marginTop:0.5*(me.parent().height - me.height())});
                                }
                                delete mecss[kk];
                            }else if(typeof ell == "string" && /^([^_]+)_([^_]+)(_c)?$/.test(kk)){   //属性为字符串，//判定为自定义属性格式
                                var host = me,  hostName,propName = kk,  centerit,  attrVal  ,hostFlag = 0,edgePara;/*1父，0自，-1子*/;
                                hostName = RegExp["$1"];propName = RegExp["$2"];
                                if( 'parent'.indexOf(hostName)!=-1) { host = me.parent(); hostFlag = 1;}
                                else if( 'children'.indexOf(hostName)!=-1){host = me.children().first();  hostFlag = -1;}
                                centerit = RegExp["$3"]=="_c";
                                attrVal = parseInt(ell);

                                if(hostFlag == 1 ){me.css("display","none");}
                                if(propName == "width"){
                                    if(centerit) mecss.marginLeft = -(attrVal+me.edgeWidth("b,lr")) *0.5;
                                }else if(propName == "height"){
                                    if(centerit) mecss.marginTop = -(attrVal+me.edgeWidth('b,tb')) *0.5;
                                }
                                me.css(propName,attrVal + (parseInt(host.css(propName)) || 0));
                                if(hostFlag == 1 ){me.css("display",me.data().displayCache);}
                                delete mecss[kk];       //删除自定义属性
                            }
                        });
                        return mecss;
                    }

                    function setClass(classStr,me){
                        me.removeAttr("data_compat_class");
                        var classStrArr = classStr.split(";");
                        $.each(classStrArr,function(kk,ele){
                            var ar2 = ele.split(":");
                            if(bro(ar2[0])) me.addClass(ar2[1]);
                        });
                    }
                },
                /*获取特定的margin，border,padding宽度
                 * ele_dir_Str"mbp,lrtb"
                 * 例如        ele.edegWidth("b,l");//border-left宽度
                 *             ele.edegWidth("bp,tb");//border-top,border-bottom,padding-top,padding-borrom宽度合计
                 * */
                edgeWidth:function(ele_dir_Str){
                    var strarr = (ele_dir_Str || "mbp,lrtb").split(",");
                    var eleStr = strarr[0],direStr = strarr[1];
                    var w = 0,me=this.first();
                    var dirChars = (direStr||"lrtb").split(""),eleChars = (eleStr ||"mbp").split("");
                    $.each(eleChars,function(ii,ell){
                        $.each(dirChars,function(i,el){
                            w+=parseInt(me.css(stringMap.edeg[ell] + stringMap.edegDire[el]))||0;
                        });
                    });
                    return w;
                },
                /*设置元素的尺寸，包括padding，border，margin
                 * 用法：
                 *          gwidth,gheight说明
                 *                  false时候，表示不设置
                 *                  0,undefined,null,""时：表示参数为盒的width
                 *          设置宽或者高 ：在原参数基础上减去p，b宽度，设置盒内宽高
                 * */
                sizeWithEdge:function(gwidth,gheight,edgeEleStr){
                    edgeEleStr = edgeEleStr|| "pb";
                    return this.each(function(){
                        var me=$(this);
                        width=gwidth; height=gheight;
                        if(!gwidth) width=me.width();
                        if(!gheight) height=me.height();
                        if( width && gwidth!==false)  me.width(width-me.edgeWidth(edgeEleStr+",lr"));
                        if( height&& gheight!==false) me.height(height-me.edgeWidth(edgeEleStr+",tb"));
                    });
                },
                /*
                 * 设置edge，并且不改变盒尺寸
                 * edgeCss形如:{borderWidth:1}
                 * */
                setEdge:function(edgeCss){
                    return this.each(function(){
                        var me=$(this);
                        var orgSize={width:me.edgeWidth(",lr"),height:me.edgeWidth(",tb")};
                        me.css(edgeCss);
                        var newSize={width:me.edgeWidth(",lr"),height:me.edgeWidth(",tb")};
                        me.width(me.width() + orgSize.width-newSize.width);
                        me.height(me.height() + orgSize.height-newSize.height);
                    });
                },
                /*宽度，默认包括pb*/
                fullWidth:function(w_edgeEleStr,edgeEleStr){
                    if(w_edgeEleStr===undefined || typeof w_edgeEleStr == "string")
                        return this.width() + this.edgeWidth(w_edgeEleStr || 'pb,lr');
                    else
                        return this.sizeWithEdge(w_edgeEleStr,false,edgeEleStr || 'pb');
                },
                /*高度，默认包括pb*/
                fullHeight:function(h_edgeEleStr,edgeEleStr){
                    if(h_edgeEleStr===undefined || typeof h_edgeEleStr == "string")
                        return this.height() + this.edgeWidth(h_edgeEleStr || 'pb,tb');
                    else
                        return this.sizeWithEdge(false,h_edgeEleStr,edgeEleStr || 'pb');
                }
            });
            var parseFuncs = {};
        })(jQuery);
        //--------------------------------------------------

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
                        var da = ctool.max_on_container(customSizeArray || [display_w,display_h],[img_org_w,img_org_h], c.space, c.posi);
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
                        tool.getImageOrigSize(
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
                            var da = ctool.max_on_container([css.width,css.height],[d.img_org_w, d.img_org_h]);
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
                        var da = ctool.max_on_container([d.display_w, d.display_h],[d.img_org_w, d.img_org_h]);
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
    })();


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
        tool.vScrollTo = CVScrollTo;
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
        ctool.max_on_container = max_on_container;
    }();

    //get kissy
    !function(){
        var cfg = { combine: true,debug:false};
        var kissy = window.KISSY,req_ing=false,cache=[];
        var kissPath = "//g.tbcdn.cn/kissy/k/1.4.1/seed-min.js?t=20140212";

        /**
        * 从tbcdn获取KISSY资源
        * */
        tool.getKissy = function getKissy(callback,config){
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
                    kissy = KISSY;
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
        tool.reqPlus = $.reqPlus = function(reqPathArray,para,typeValue,callback){
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
                console.log("到底执行了没"+typeValue);
                typeValue = para;
                reqType = para;
                para=undefined;
                console.log("到底执行了没::"+typeValue);
            }

            //如果type包含分号，则认为此type同时设置requestType和dataType
            //if(typeValue.indexOf(";")!=-1){       //todo:此处会出错，因为typeValue无论如何都会为空
            if(reqType && reqType.indexOf(";")!=-1){
                var splitList = typeValue.split(";");
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
                        throw "请求地址:" + reqPathArray[cur_path_index - 1] + ",出错";
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
    }();
    //多参数请求end
    return tool;
});
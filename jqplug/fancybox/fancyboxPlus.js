//fancybox辅助程序,通过标签增加fancybox
//<span fancyTo="targetId" fancyOptions="width:500px;cacheOpen:true;do:alert("单击按钮触发")">fancybox</span>
//cacheOpen:true;单击时候不打开，除非调用 $(window).trigger("EV_fancyOpen",targetDivId);
//width:500px;target宽度强制为500px；

define(function(require){
    require("seajs/jqplug/fancybox/fancybox.js");
    (function($){
        var targetIdToFancyButton={};
        var hiddenBox;
        $.fn.extend({
            fancyboxPlus:function(){
                if(!hiddenBox) hiddenBox = getHiddenbox();
                this.each(function(){
                    var ti=$(this);
                    var data=ti.data();
                    var proxy = data.proxy=$("<a></a>");
                    var targetId=ti.attr("fancyTo");
                    var optionsString = ti.attr("fancyOptions");
                    var opts = data.opts = {};
                    if(optionsString){
                        $.each(optionsString.split(";"),function(k,ele){
                            if(ele=="")	return;
                            var item1Split=ele.split(":");
                            if(item1Split.length==2) opts[item1Split[0]]=item1Split[1];
                            else throw("fancyOptions属性不合法！");
                        });
                    }

                    var realFancyBox = proxy;//opts.cacheOpen=="true"?proxy:ti;
                    realFancyBox.attr("href","#"+targetId);
                    realFancyBox.fancybox({
                        hideOnOverlayClick:false,
                        padding:10,
                        overlayOpacity:0.2
                    });
                    targetIdToFancyButton[targetId]=ti;

                    $("#"+targetId)
                        .css({display:"",width:opts.width||650})
                        .appendTo(hiddenBox)
                    ;

                    if(opts.cacheOpen=="true"){
                        ti.click(function(){
                            $.fancybox.showActivity();
                            if(opts["do"]) eval(opts["do"]);
                        });
                    }else{
                        ti.click(function(){
                            $(this).data().proxy.trigger("click");
                            if(opts["do"])eval(opts["do"]);
                        });
                    }
                });
            }//fancyboxPlus
        });//$.fn.extend

        $.fancybox.open = function(targetId){
            $.fancybox.hideActivity();
            var ti = targetIdToFancyButton[targetId];
            ti.data().proxy.trigger("click");
        }

        $(window).bind("EV_fancyOpen",function(e,targetId){
            $.fancybox.hideActivity();
            var ti = targetIdToFancyButton[targetId];
            ti.data().proxy.trigger("click");
        });

        $(window).bind("EV_fancyClose",function(e,targetId){
            $.fancybox.close();
        });

        //private tool
        function getHiddenbox(){
            return $("<div></div>",{id:"hiddenBox"}).css({display:"none"}).appendTo($("body"));
        }
    })(jQuery);
});


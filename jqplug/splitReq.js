/**
 * 一个可以分段请求数据的组件，自带分页控件。
 * 支持如下集中数据返回格式
 * json模式 (注：同时设置totalCount和totalPage时totalPage优先)
 *      {"totalCount": "13"，"data": [ { "id": "a104a9d9fc8d429cb96dbaaf5c10160c"}]}
 *      {"totalPage": "9"，"data": [ { "id": "a104a9d9fc8d429cb96dbaaf5c10160c"}]}
 *      {"pageInfo": {totalCount:"13"}，"data": [ { "id": "a104a9d9fc8d429cb96dbaaf5c10160c"}]}
 * html模式
 *      <!--{"totalPage":118}--> <div classitem>条目</div> <div classitem>条目</div> ....
 *
 */
define(function (require, exports, module) {
    var cl = require("ctool");
    var cj = require("ctooj");
    var $ = require("jq");
    var nullFunc = function(){ };
    require("$/simplePagination");

    //常量
    var constVar = {
        rows:10
    }

    var field_transport = {
        total_page:"pages",
        continuous_page:"displayedPages",
        current_page:"currentPage",
        edge_page:"edges",
        preview_text:"prevText",
        next_text:"nextText",
        rows:"itemsOnPage",
        0:0
    };

    //带分页的，分段请求功能类
    !function(){
        var def = {
            container:"",
            total_page: 1,
            continuous_page: 5,
            current_page: 1,
            preview_show: true,
            first_show: true,
            next_show: true,
            last_show: true,
            edge_page: 2,
            skip_show: false,                       //显示跳转到
            total_show:false,                    //是否总页数
            total_text:"共{totalPage}页",         //总页数文案
            first_text:"首页",                    //各种文案
            last_text:"末页",
            preview_text:"上一页",
            next_text:"下一页",

            //custome config
            reqPath:"",                         //允许使用模式如  /root/html_{pageno}.html
                                                //如果为空，不请求，只触发
                                                //目前支持 {pageno}(当前页码)，
                                                //可以写在分页div上 例： <div class="pageSize" data_reqPath="{_}zxhdManage/getActivityPageListZxhdManage.tg"></div>
            reqPara:{rows:5},               	//请求所带参数。默认传rows:5，表示每页显示5条
            reqType:"GET",
            dataType:"json",                    //类型可以"json"或者"html","null"
            //当类型为null的时候仅仅保留分页功能,不会发起数据请求
            //当接受到远程数据的时候，在对数据进行json解析之前调用。返回值可改变data
            onRece:nullFunc,
            onData: nullFunc,                   //当数据返回时 参数为所请求到的原始字符串
            onReq:nullFunc,                     //当请求时候执行
                                                /*
                                                 * function(orgPara){
                                                 *   var newPara = orgPara;
                                                 *   newPara.type = "black";
                                                 *   newRara.redirect = "//newUrlxxx";           //使用这句可以重定向请求地址
                                                 *   return newPara;
                                                 * }
                                                 * */
            onSkip:nullFunc,                    //分页的时候调用
            onInit:nullFunc,                    //当Page对象初始化成功时候执行
            firstReqAuto:true,                 //创建后，是否立即进行一次请求
            defTotalPage:1,                     //如果未获取到页数信息，显示多少页
            pagenoFieldName:"page",             //请求参数：页码字段的name,如 do?page=1
            rowsFiledName:"rows",               //请求参数：每次返回的条目数字段的名称 如(rows的作用):do?rows=10&page=2
            rows:undefined,                     //请求参数：返回条目数量 如(10的作用):do?rows=10&page=2,该值取值优先级，用户config的值>行内设置的值>预设值
            hidePageNav:false,                 //当此项为true时候，隐藏分页按钮（用来发起自定义请求，实现如 换一批等功能）

            cssStyle: 'lite-theme',

            //避免短时间内的多次请求
            reqThrottle:1000,
            a:0
        };
        /**
         * 分页或者换一批请求，一个class
         *
         * */
        module.exports = function(cfg){
            var me = this;

            /**
             * free表示闲置，busy表示正在进行网络请求
             * free|busy
             */
            me._status = "free";

            me.initedCb = $.Callbacks("memory");
            var setting = me.setting = me.st = $.extend(true, {}, def, cfg);

            //如果没有container创建空的
            if(!setting.container){
                setting.container = $("<div style='display: none;' class='splitReq_shadow_el'></div>").appendTo("body");
            }

            var pageCont = me.container = $(setting.container);
            //先去
            setting.rows = setting.rows || pageCont.attr("rows") || constVar.rows;

            setting.reqPath = pageCont.attr("data_reqPath") || setting.reqPath;
            setting.dataType = pageCont.attr("data_dataType") || setting.dataType;

            //字段变换
            $.each(field_transport,function(old,neww){ setting[neww] = setting[old]; });
            pageCont.addClass("page_nav");
            setting.onPageClick = function(num,e){
                me.st.onSkip.call(me,e);
                me.currentPageno = num;
                if(!me.st.reqPath || me.st.dataType==null){     //空类型
                    return;
                }
                var para = setting.reqPara;
                para[setting.pagenoFieldName] = num;
                para[setting.rowsFiledName] = me.st.rows;                     //一次请求多少条
                var back = setting.onReq.call(me,para);
                if(back) para = back;
                me.req(para);
            };


            var pg = me.page = $(setting.container).pagination(setting);
            pg.call = function(method, para){
                return pg.pagination(method, para);
            }

            //自动跳转
            if(setting.firstReqAuto) pg.call("selectPage",1);
            me.st.onInit.call(me,pg);
            me.initedCb.fire();

        };

        var fn = module.exports.prototype;

        /**
         * 根据某参数请求
         * */
        fn.req = function(para){
            var m = this;
            if(m._status!="free"){
                m.req_para_cache = para;
                return;
            }

            if(!m.__req){
                m.__req = cl.throttle(m.setting.reqThrottle,function(){
                    m._req(para);
                })
            }

            m.__req();
        };

        /**
         * 执行请求
         * @param para
         * @private
         */
        fn._req = function(para){
            var me = this,sett = me.setting;
            me.req_para_cache = null;
            me._status_change("busy");
            cj.reqPlus(me.parseReqPath(para),para,sett.reqType)
                .done(function(data){
                    data = sett.onRece.call(me,data) || data;
                    if(sett.dataType=="html"){
                        //暂时无操作
                    }else if(sett.dataType=="json"){
                        data = cj.tojson(data);
                    }else{
                        throw "dataType字段不合法"
                    }
                    if(!sett.hidePageNav) me.setPageInfo(data);
                    data = sett.onData.call(me,data) || data;
                    me._status_change("free");

                })
                .fail(function(){
                    me._status_change("free");
                    throw "网络连接失败！检查后台服务是否开启，是否报错，是否请求跨域！";
                })
            ;
        }

        /**
         *
         * @param flag 枚举busy|free
         * @private
         */
        fn._status_change = function(flag){
            var m = this;
            m._status = flag;
            if(flag == "free" && m.req_para_cache){
                m._req(m.req_para_cache);
            }
        }

        /**
         * 跳转到第n页
         * */
        fn.skip = function(pageno){
            if(this.st.hidePageNav)    return;
            var me = this;

            //如果已经初始化过,直接跳页
            if(me.initedCb.fired()){
                doskip.call(me,pageno)
                return;
            }

            //没有初始化，等待初始化
            me.initedCb.add(function(){
                doskip.call(me,pageno)
            });
        };

        /**
         * 执行跳转
         * @param pageno
         */
        function doskip(pageno){
            var me = this;
            me.page.call("selectPage",pageno || 1);
        }

        /**
         * 跳转到第一页，并执行一次请求，
         * */
        fn.doo = function(){
            this.skip();
        };

        /**
         * 跳转到下一页
         * */
        fn.next = function(){
            var me = this;
            if(!me.pageInfo)    return;
            if(me.pageInfo.totalPage == me.currentPageno){
                cl.log("已经到最后一页");
                return;
            }
            this.skip(this.currentPageno+1);
        }

        /**
         * 设置总页数
         * */
        fn.setTotalPangeNum = function(num){
            if(this.st.hidePageNav)    return;
            var me = this;
            me.page.call("updateItems",(num || 1) * me.st.itemsOnPage);
        };

        /**
         * 解析路径中的变量
         * */
        fn.parseReqPath = function(realPara){
            var me = this;
            var path = me.st.reqPath;

            //重定向请求地址
            if(realPara.redirect){
                path = realPara.redirect;
                delete realPara.redirect;
            }
            path = path.replace("{pno}",me.currentPageno);
            //path = path.replaceAll("{_}",root);
            return path;
        }

        /**
         * 从html片断或者json数据中读取页配置信息对象并设置
         * */
        fn.setPageInfo = function(data){
            if(this.st.hidePageNav)    return;
            var me = this;
            var pageInfo={totalPage:1};
            if(me.st.dataType=="html"){
                if(/-({.+})-/.test(data)){
                    pageInfo = $.parseJSON(RegExp["$1"]);
                }else
                    cl.log("未找到pageinfo信息");
            }else if(me.st.dataType=="json"){
                pageInfo = data.pageInfo || {totalPage:data.totalPage,totalCount:data.totalCount};
            }//else end

            var totalPage = me.st.defTotalPage
            if(pageInfo.totalPage){
                totalPage=pageInfo.totalPage;
            }else if(pageInfo.totalCount){
                pageInfo.totalPage = totalPage = ~~((pageInfo.totalCount-1)/me.st.rows) + 1;
            }
            me.setTotalPangeNum(totalPage);
            me.pageInfo = pageInfo;
        }
    }();
});
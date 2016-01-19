/**
 * Created with WebStorm.
 * User: Administrator
 * Date: 14-8-28
 * Time: 上午10:43
 * To change this template use File | Settings | File Templates.
 */
define(function (require, exports, module) {
    var numRg = /\d+/;

    var rg_tpl = /\{([^{}]+)\}/g;

    var rg_split_field = /./


    /**
     * 模板解析
     * 方法 addVars({}),设定默认变量值
     * 方法 addValAlias({}) 设置变量别名
     *
     * @param lists 数据，可以是[{},{},{}]，也可以是{}
     * @param tpl 模板,例如<a>{name}</a>
     *              {_index_}:遍历到的索引
     * @param config
     *          如果传入一个function，则表示onReplace
     *          {
     *              //到遍历到一组数据
     *              onItem: function(currentData,index){}
     *              //当执行一次替换
     *              onReplace: function(value, vname, origi_value){ this-->currentData}
     *          }
     * @returns {string}
     */
    function parseTpl(lists,tpl,config){

        var onReplace = (function(){});
        var onItem = onReplace;
        if(typeof  config == "function"){
            onReplace = config;
        }else{
            config = config || {};
            onReplace = config.onReplace || onReplace;
            onItem = config.onItem || onItem;
        }

        onReplace = onReplace || (function(){});
        var outPut="",item="";
        if(!isArray(lists))   lists = [lists];

        //渲染传入的变量
        for(var k1 in lists){
            var el1 = lists[k1];
            if(!numRg.test(k1)) continue;           //数字验证。如果字段不是数字，滚。cao fk ie；

            el1 = onItem.call(null,el1, k1) || el1;
            item = tpl.replaceAll("{_index_}",k1);

            item = item.replace(rg_tpl,function(a,vname,c){
                var origi_v = getDeepValue(el1,vname);
                var alias_v = pt.valAlias[origi_v]===undefined?origi_v:pt.valAlias[origi_v];
                var retval = onReplace.call(el1,alias_v,vname,origi_v);
                return retval===undefined?alias_v:retval;
            });

            outPut+=("\n"+item);
        }

        //渲染全局变量(全局变量和用户变量同存，用户变量生效)
        for(var k in pt.vars){
            var el = pt.vars[k];
            outPut = outPut.replaceAll("{"+k+"}",el);
        }

        return outPut;
    };

    var pt = parseTpl;

    /**
     * 值的别名
     */
    pt.valAlias = {};


    /**
     * 全局字典
     * @type {{}}
     */
    pt.vars={};

    /**
     * 给全局字典增加变量
     * @param k 可以是一个object
     * @param val
     */
    pt.addVars = function(k,val){
        var map;
        if(typeof k == "string"){
            map = {};
            map[k] = val;
        }else{
            map = k;
        }
        for(var k in map){
            pt.vars[k] = map[k];
        }
    }

    /**
     * 增加变量别名
     * @param obj
     */
    pt.addValAlias = function(obj){
        for(var k in obj){
            pt.valAlias[k] = obj[k];
        }
    }


    //增加String的replaceAll方法
    if(!String.prototype.replaceAll){
        var regCache = {}; //避免建立太多的RegExp对象
        /**
         * 增加replaceAll方法
         * */
        String.prototype.replaceAll = function(s1, s2) {
            var reg = regCache[s1] || (regCache[s1]=new RegExp(s1, "gm"));
            return this.replace(reg, s2); //g全局
        }
    }
    exports.parseTpl = parseTpl;
    return parseTpl;

    //判断是不是数组
    function isArray(o) {
        return Object.prototype.toString.call(o) ==="[object Array]";
    }

    /**
     * 获取某个对象，深层的值
     * @param object
     * @param mix_fields
     */
    function getDeepValue(object,mix_fields){
        var el = object;
        var fa = mix_fields.split(/\./);

        for(var i = 0; i<fa.length; i++){
            if(!el){
                el ={};
            }
            el = el[fa[i]];
        }
        return el;
    }
});
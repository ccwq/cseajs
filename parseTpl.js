/**
 * Created with WebStorm.
 * User: Administrator
 * Date: 14-8-28
 * Time: 上午10:43
 * To change this template use File | Settings | File Templates.
 */
define(function (require, exports, module) {
    var numRg = /\d+/;
    /**
     * 解析模板
     * 模板字段介绍
     * {_index}:遍历到的索引
     * */
    function parseTpl(lists,tpl){
        var outPut="",item="";
        if(!isArray(lists))   lists = [lists];

        //渲染传入的变量
        for(var k1 in lists){
            var el1 = lists[k1];
            if(!numRg.test(k1)) continue;           //数字验证。如果字段不是数字，滚。cao fk ie；
            item = tpl;
            for(var k2 in el1){
                var el2 = el1[k2];
                item = item.replaceAll("{"+k2+"}",el2)
            }
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
});
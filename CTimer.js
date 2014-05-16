define(function (require, exports, module) {
    var def = {
        delay:1000,
        autoStart:true,
        callback: $.noop
    };
    var CTimer = module.exports = function(opt){
        var me = this;

        //处理参数
        opt = opt || {};
        for(var k in def){
            opt[k] = (opt[k]===undefined?def[k]:opt[k]);
        }
        var sett = me.sett = opt;

        if(sett.autoStart)  me.start();
    }

    var fn = CTimer.prototype;

    fn.start = function(){
        this.itv = this._getItv();
        return this;
    }

    fn.pause = function(){
        return this.stop();
    }

    fn.stop = function(){
        var m = this;
        clearInterval(m.itv);
        return m;
    }

    fn.reCount = function(){
        this.stop().start();
    }

    fn._getItv = function(){
        var m = this;
        if(m.itv) clearInterval(m.itv)
        return setInterval(function(){
            m.sett.callback.call(m);
        },m.sett.delay);
    }

    function extend(){

    }
});
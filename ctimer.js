define(function (require, exports, module) {
    var def = {
        delay:1000,
        autoStart:true,
        callback: $.noop
    };
    var CTimer = module.exports = function(opt){
        var me = this;

        me.status = CTimer.statusStoping;;

        //处理参数
        opt = opt || {};
        for(var k in def){
            opt[k] = (opt[k]===undefined?def[k]:opt[k]);
        }
        var sett = me.sett = opt;

        if(sett.autoStart)  me.start();
    }

    //三个状态
    CTimer.statusPlaying = 1;
    CTimer.statusPausing = 0;
    CTimer.statusStoping = -1;


    var fn = CTimer.prototype;

    fn.start = function(){
        this.status = CTimer.statusPlaying;

        this.itv = this._getItv();
        return this;
    }

    fn.pause = function(){
        this.status = CTimer.statusPausing;
        return this.stop();
    }

    fn.stop = function(){
        var m = this;
        m.status = CTimer.statusStoping;
        clearInterval(m.itv);
        return m;
    }

    fn.reCount = function(){
        //如果不是播放状态，reCount无效
        if(this.status !== CTimer.statusPlaying) return;
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

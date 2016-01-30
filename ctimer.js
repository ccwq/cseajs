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

    /**
     *
     * @param paraList 在脉冲发生持，派发参数的数组
     * @returns {exports}
     */
    fn.start = function(paraList){
        this.paraList = paraList;
        this.status = CTimer.statusPlaying;
        this.itv = this._getItv();
        return this;
    }

    /**
     * 开始，并在开始时，立即调用回调
     * @param paraList
     * @returns {fn}
     */
    fn.start_immediate = function(paraList){
        this.paraList = paraList;
        this.status = CTimer.statusPlaying;
        this.itv = this._getItv(true);
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

    fn.recount = fn.reCount = function(){
        //如果不是播放状态，reCount无效
        if(this.status !== CTimer.statusPlaying) return;
        this.stop().start();
    }

    fn._getItv = function(immediate){
        var m = this;
        if(m.itv) clearInterval(m.itv);

        function __(){
            if(!Function.prototype.apply){
                require.async("ctool",function(){
                    m.sett.callback.apply(m, m.paraList || []);
                })
            }else{
                m.sett.callback.apply(m, m.paraList || []);
            }
        }

        if(immediate){
            __();
        }

        return setInterval(__,m.sett.delay);
    }

    function extend(){

    }
});

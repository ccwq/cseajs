/**
 * Created with PhpStorm.
 * User: Shinelon
 * Date: 2016/1/19
 * Time: 13:13
 * deomo:j
 * To change this template use File | Settings | File Templates.
 */
define(function (require, exports, module) {
    require("./jwplayer/jwplayer");
    var cl = require("ctool");

    var def = {
        //file:"http://www-file.huawei.com/~/media/CORPORATE/Video/home/better-connected-world-cn.mp4",
        //autostart: true,
        //skin:"",
        primary: "html5",
        //image:"http://www-file.huawei.com/~/media/CORPORATE/Video/Images/home/15-12-2-banner_cn.jpg",
        //primary: "flash",
        flashplayer: require.resolve("./jwplayer/jwplayer.flash.swf"),
        html5player: require.resolve("./jwplayer/jwplayer.html5.js")
    };

    jwplayer.get = function(container,config){
        var v = jwplayer(container);
        v.setup(cl.extend({}, def, config));
    }

    return jwplayer;
});
/**
 * jquery.hoverdir.js v1.1.1
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2012, Codrops
 * http://www.codrops.com
 *
 * Modified 2014, WebMan
 * http://www.webmandesign.eu
 * Modifications:
 * Removed CSS3 transitions and Modernizr requirements. Applied CSS
 * classes instead for better flexibility and controlability via CSS.
 *
 * @link     https://github.com/webmandesign/jquery.hoverdir
 * @version  1.0 (modified)
 */

!function(a,b){"use strict";a.HoverDir=function(b,c){this.$el=a(c),this._init(b)},a.HoverDir.defaults={fromPrefix:"out-",toPrefix:"in-"},a.HoverDir.prototype={_init:function(b){this.options=a.extend(!0,{},a.HoverDir.defaults,b),this.allClasses={from:this.options.fromPrefix+"top "+this.options.fromPrefix+"right "+this.options.fromPrefix+"bottom "+this.options.fromPrefix+"left",to:this.options.toPrefix+"top "+this.options.toPrefix+"right "+this.options.toPrefix+"bottom "+this.options.toPrefix+"left"},this._loadEvents()},_loadEvents:function(){var b=this;this.$el.on("mouseenter.hoverdir mouseleave.hoverdir",function(c){var d=a(this),e=b.options.fromPrefix,f=b.options.toPrefix,g=b._getDir(d,{x:c.pageX,y:c.pageY}),h=b._getClass(g);"mouseenter"===c.type?d.removeClass(b.allClasses.from).addClass(f+h).siblings().removeClass(b.allClasses.to):d.removeClass(b.allClasses.to).addClass(e+h).siblings().removeClass(b.allClasses.from)})},_getDir:function(a,b){var c=a.width(),d=a.height(),e=(b.x-a.offset().left-c/2)*(c>d?d/c:1),f=(b.y-a.offset().top-d/2)*(d>c?c/d:1),g=Math.round((Math.atan2(f,e)*(180/Math.PI)+180)/90+3)%4;return g},_getClass:function(a){var b;switch(a){case 0:b="top";break;case 1:b="right";break;case 2:b="bottom";break;case 3:b="left"}return b}};var d=function(a){b.console&&b.console.error(a)};a.fn.hoverdir=function(b){var c=a.data(this,"hoverdir");if("string"==typeof b){var e=Array.prototype.slice.call(arguments,1);this.each(function(){return c?a.isFunction(c[b])&&"_"!==b.charAt(0)?(c[b].apply(c,e),void 0):(d("no such method '"+b+"' for hoverdir instance"),void 0):(d("cannot call methods on hoverdir prior to initialization; attempted to call method '"+b+"'"),void 0)})}else this.each(function(){c?c._init():c=a.data(this,"hoverdir",new a.HoverDir(b,this))});return c}}(jQuery,window);
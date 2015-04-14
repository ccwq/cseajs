/*
* 表单读写插件
* https://github.com/dshimkoski/jquery-inputs
* */
define(function(require){
    var $,jQuery;
    $ = jQuery = require("jq");
    (function($,undefined){var methods={set:function(values){var $form=$(this);var scope={};$form.find(":input[name]").each(function(){var $input=$(this);var lookup=values;var update=true;clearInput($input);var keys=processInput($input.attr("name"),null,scope);for(var i=0,len=keys.length;i<len;i++){var key=keys[i];if(!lookup[key]){update=false;break}lookup=lookup[key]}if(update){if($input.is(":checkbox, :radio")){if($.isArray(lookup)){for(var i=0,len=lookup.length;i<len;i++){$input.filter("[value="+lookup[i]+"]").attr("checked",true)}}else{$input.filter("[value="+lookup+"]").attr("checked",true)}}else{$input.val(lookup)}}})},get:function(){var scope={};$.each($(this).serializeArray(),function(){processInput(this.name,this.value,scope)});return scope}};function clearInput($input){if($input.is(":checkbox, :radio")){$input.attr("checked",false)}else{$input.val("")}}function processInput(name,value,scope){var keys=[];var p=0;var c;var key="";var last;while(c=name[p++]){switch(c){case" ":case"_":case".":case"[":case"]":if(c==="]"&&!key.length){key=0;for(var j in scope){if(scope.hasOwnProperty(j)&&j%1===0){key=Math.max(parseInt(j,10)+1,key)}}}if(key===0||key){last={scope:scope,key:key};if(scope[key]===undefined){scope[key]={}}scope=scope[key];keys.push(key)}key="";break;default:key+=c}}if(key.length){keys.push(key)}else{scope=last.scope;key=last.key}if(!scope[key]||$.isEmptyObject(scope[key])){scope[key]=value}else{if(!$.isArray(scope[key])){scope[key]=[scope[key]]}scope[key].push(value)}return keys}$.fn.inputs=function(method){if(methods[method]){return methods[method].apply(this,Array.prototype.slice.call(arguments,1))}else{$.error("Method "+method+" does not exist on jQuery.inputs")}}})(jQuery);
});



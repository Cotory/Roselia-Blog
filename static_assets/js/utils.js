/**
 * Created by somai on 2017/8/21.
 */
;(function(window){

    let BLOG_TITLE = "{{ title }}";
    let BLOG_MOTTO = "{{ motto }}";
    let utils = {};
    utils.BLOG_TITLE = BLOG_TITLE;
    utils.BLOG_MOTTO = BLOG_MOTTO;
    utils.apiBase = "./api";
    window.onerror = ()=>true;
    utils.getArguments = function () {
        let argStr = window.location.search;
        if(!argStr.length) return {};
        let args = window.location.search.substring(1).split('&');
        let argDict = {};
        args.forEach(function (i) {
            let item = i.split("=");
            argDict[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
        });
        return argDict;
    };
    
    utils.setRedirect = function (url) {
        window.sessionStorage.setItem('redirectURL', url);
    };
    
    utils.getRedirect = function () {
        return window.sessionStorage.getItem('redirectURL');
    };
    
    utils.cleanRedirect = function () {
        window.sessionStorage.removeItem('redirectURL');
    };
    
    utils.getBlogMeta = () => ({
        title: utils.BLOG_TITLE,
        motto: utils.BLOG_MOTTO
    });
    
    utils.setHeimu = () => {
        $(".heimu").mouseover((e) => {
          $(e.target).css("color", "white");
        }).mouseout((e) => {
          $(e.target).css("color", "black");
        });
    };
    
    utils.getAbsPath = function () {
        return window.location.pathname + window.location.search;
    };

    utils.notify = function (message, displayLength, className, completeCallback){
        return Materialize.toast(message, displayLength, className, completeCallback);
    };
    
    utils.redirectTo = url => window.location.href = url || './';
    
    utils.getLoginData = () => window.localStorage.loginData ? JSON.parse(window.localStorage.loginData):null;
    
    utils.setLoginData = data => window.localStorage.loginData = JSON.stringify(data);
    
    utils.removeLoginData = () => window.localStorage.loginData && window.localStorage.removeItem("loginData");

    utils.setLoginUI = (data) => (data || (data = utils.getLoginData())) ? $(".username").text(data.username).attr('href', './userspace') : $(".username").text("Login").attr('onclick', 'utils.setRedirect(utils.getAbsPath())').attr('href', './login');
    
    utils.getPosts = function (callback) {
        let args = {}, login = utils.getLoginData();
        if(login) args.token = login.token;
        $.getJSON('./api/posts', args, function (data) {
            utils.setPosts(data);
            callback && callback(data);
        });
    };
    
    utils.getPostsData = () => JSON.parse(window.localStorage.postData||"null");
    
    utils.deleteDraft = () => window.localStorage.removeItem("postDraft");
    
    utils.setPosts = function (data) {
        window.localStorage.postData = JSON.stringify(data);
    };
    
    utils.apiFor = (...uri) => `${utils.apiBase}/${uri.join('/')}`;
    
    utils.encodeArgs = args => $.map(args, (v, k) => `${k}=${v}`).join('&');
    
    utils.processPosts = function (callback) {
        let post = window.localStorage.postData;
        if(post) callback(JSON.parse(post));
        else utils.getPosts(callback);
        return false;
    };
    utils.fetchJSON = function (url, method = "GET", payload = {}, withToken = true, individual=true) {
        let loginData = this.getLoginData();
        let token = loginData?loginData.token:"";
        method = method.toUpperCase();
        if(individual){
            payload["__timestamp"] = (new Date).getTime();
        }
        let data = withToken ? Object.assign({}, payload, {token: token}):payload;
        if(method!=="GET") data = JSON.stringify(data);
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: method,
                url: url,
                contentType: "application/json",
                dataType: "json",
                data: data,
                success: resolve,
                error: reject
            });
        });
    };
    (function(utils, $){
        utils.colorUtils = {
            splitRGB(color){
                return color.match(/\d+/g);
            },
            getYIQ(color){
                let rgb = this.splitRGB(color);
                return ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
            },
            getNormalizedTextColor(color, light, dark){
                return this.getYIQ(color) >= 128 ? dark : light;
            },
            apply(option){
                let def={
                    changeText: false,
                    textColors: {
                        light: "#fff",
                        dark: "#000"
                    },
                    exclude: ['rgb(0,0,0)'],
                    target: "body", text: null
                };
                let opts = $.extend({}, def, option);
                let img = $(opts.selector)[0];
                let self = this;
                this.RGBaster.colors(img, {
                    paletteSize: 20,
                    exclude: opts.exclude,
                    success(colors){
                        let dominant = self.splitRGB(colors.dominant)?colors.dominant:colors.palette.find(color => self.splitRGB(color))||'rgb(255,255,255)';
                        $(opts.target).css({transition: "background-color 1800ms ease"}).css({backgroundColor: dominant});
                        if(opts.changeText){
                            let $text = $(opts.text || opts.target);
                            $text.css({transition: "color 1800ms ease"}).css({color: self.getNormalizedTextColor(dominant,
                                opts.textColors.light, opts.textColors.dark)});
                        }
                    }
                });
            }
        };
    })(utils, jQuery);
    //Import: RGBaster
    //!function(n){"use strict";var t=function(){return document.createElement("canvas").getContext("2d")},e=function(n,e){var a=new Image,o=n||n.src;"data:"!==o.substring(0,5)&&(a.crossOrigin="Anonymous"),a.onload=function(){var n=t("2d");n.drawImage(a,0,0);var o=n.getImageData(0,0,a.width,a.height);e&&e(o.data)},a.src=o},a=function(n){return["rgb(",n,")"].join("")},o=function(n){return n.map(function(n){return a(n.name)})},r=5,i=10,c={};c.colors=function(n,t){t=t||{};var c=t.exclude||[],u=t.paletteSize||i;e(n,function(e){for(var i=n.width*n.height||e.length,m={},s="",d=[],f={dominant:{name:"",count:0},palette:Array.apply(null,new Array(u)).map(Boolean).map(function(){return{name:"0,0,0",count:0}})},l=0;i>l;){if(d[0]=e[l],d[1]=e[l+1],d[2]=e[l+2],s=d.join(","),m[s]=s in m?m[s]+1:1,-1===c.indexOf(a(s))){var g=m[s];g>f.dominant.count?(f.dominant.name=s,f.dominant.count=g):f.palette.some(function(n){return g>n.count?(n.name=s,n.count=g,!0):void 0})}l+=4*r}if(t.success){var p=o(f.palette);t.success({dominant:a(f.dominant.name),secondary:p[0],palette:p})}})},n.RGBaster=n.RGBaster||c}(utils.colorUtils);
    (function(window, undefined){

        "use strict";
      
        // Helper functions.
        var getContext = function(width, height){
          var canvas = document.createElement("canvas");
          canvas.setAttribute('width', width);
          canvas.setAttribute('height', height);  
          return canvas.getContext('2d');
        };
      
        var getImageData = function(img, loaded){
      
          var imgObj = new Image();
          var imgSrc = img.src || img;
      
          // Can't set cross origin to be anonymous for data url's
          // https://github.com/mrdoob/three.js/issues/1305
          if ( imgSrc.substring(0,5) !== 'data:' )
            imgObj.crossOrigin = "Anonymous";
      
          imgObj.onload = function(){
            var context = getContext(imgObj.width, imgObj.height);
            context.drawImage(imgObj, 0, 0);
      
            var imageData = context.getImageData(0, 0, imgObj.width, imgObj.height);
            loaded && loaded(imageData.data);
          };
      
          imgObj.src = imgSrc;
      
        };
      
        var makeRGB = function(name){
          return ['rgb(', name, ')'].join('');
        };
      
        var mapPalette = function(palette){
          var arr = [];
          for (var prop in palette) { arr.push( frmtPobj(prop, palette[prop]) ) };
          arr.sort(function(a, b) { return (b.count - a.count) });
          return arr;
        };  
        
        var fitPalette = function(arr, fitSize) {
          if (arr.length > fitSize ) {
          return arr.slice(0,fitSize);
        } else {
          for (var i = arr.length-1 ; i < fitSize-1; i++) { arr.push( frmtPobj('0,0,0', 0) ) };
          return arr;
        };
        };
        
        var frmtPobj = function(a,b){
          return {name: makeRGB(a), count: b};
        }
      
      
        // RGBaster Object
        // ---------------
        //
        var PALETTESIZE = 10;
      
        var RGBaster = {};
      
        RGBaster.colors = function(img, opts){
      
          opts = opts || {};
          var exclude = opts.exclude || [ ], // for example, to exclude white and black:  [ '0,0,0', '255,255,255' ]
              paletteSize = opts.paletteSize || PALETTESIZE;
      
          getImageData(img, function(data){
      
                    var colorCounts   = {},
                        rgbString     = '',
                        rgb           = [],
                        colors        = {
                          dominant: { name: '', count: 0 },
                          palette:  []
                        };
      
                    var i = 0;
                    for (; i < data.length; i += 4) {
                      rgb[0] = data[i];
                      rgb[1] = data[i+1];
                      rgb[2] = data[i+2];
                      rgbString = rgb.join(",");
      
                      // skip undefined data and transparent pixels
                      if (rgb.indexOf(undefined) !== -1  || data[i + 3] === 0) {
                        continue;
                      }
      
                      // Ignore those colors in the exclude list.
                      if ( exclude.indexOf( makeRGB(rgbString) ) === -1 ) {
                        if ( rgbString in colorCounts ) {
                          colorCounts[rgbString] = colorCounts[rgbString] + 1;
                        }
                        else{
                          colorCounts[rgbString] = 1;
                        }
                      }
      
                    }
      
                    if ( opts.success ) {
                      var palette = fitPalette( mapPalette(colorCounts), paletteSize+1 );
                      opts.success({
                        dominant: palette[0].name,
                        secondary: palette[1].name,
                        palette:  palette.map(function(c){ return c.name; }).slice(1)
                      });
                    }
          });
        };
        window.RGBaster = RGBaster;
    })(utils.colorUtils);
    //End Import
    utils.debounce = function(func, delay){
        let tmr;
        return (...args) => {
            clearTimeout(tmr);
            tmr = setTimeout(() => func(...args), delay);
        }
    };
    
    utils.throttle = function(func, threshold){
        let last=0, tmr;
        return (...args) => {
            let now = new Date;
            clearTimeout(tmr);
            if(now - last < threshold){
                tmr = setTimeout(() => func(...args), threshold);
            } else {
                last = now;
                func(...args);
            }
        }
    };
    
    utils.render = function render(template, context, delim){
        const funcTemplate = expr => `with(data || {}) {return (${expr});}`;
        return template.replace(new RegExp((delim || ["{{", "}}"]).join("\\s*?(.*?)\\s*?"), "gm"), (_, expr) => (new Function("data", funcTemplate(expr)))(context));
    };
    
    utils.LazyLoad = function($){
        let _ = {
            extend: $.extend,
            deepExtend(...args){
                return this.extend(true, ...args);
            },
            render: utils.render,
            partition(arr, cond){
                let res=[[],[]];
                arr.forEach(v => res[cond(v)^1].push(v));
                return res;
            },
            debounce: utils.debounce,
            throttle: utils.throttle
        };
        let AdovecLazyLoad = function(opts){
            let defaults = {
                load: true,
                placeHolder: "",
                renderPlaceHolder: false,
                selector: "#content img",
                changePlaceHolder: true,
                prefix: "roselia",
                onscrolledimg: null,
                delim: ["{{", "}}"],
                backupSrc: true,
                throttleRate: 500
            };
            this.alive = false;
            let options = this.options = _.deepExtend({}, defaults, opts);
            this.setOption = function(o){
                this.options = _.deepExtend({}, defaults, opts);
                return this;
            }
            this.load = function(){
                this.alive && this.destroy();
                this.alive = true;
                this.pics = document.querySelectorAll(options.selector);
                this.pics.forEach = this.pics.forEach || [].forEach;
                if(this.options.changePlaceHolder){
                    this.pics.forEach(e => {
                        let attr = options.prefix+"-src";
                        options.backupSrc && e.setAttribute(attr, e.src);
                        e.src = options.changePlaceHolder?_.render(options.placeHolder, e, options.delim):options.placeHolder;
                    });
                }
                this.handler();
                addEventListener("scroll", this.handler);
            }
            this.handler = _.throttle(function(e){
                let curY = document.documentElement.scrollTop + window.innerHeight;
                return (new Promise(resolve => {
                    resolve(_.partition(this.pics, e => curY >= e.y));
                })).then(([scrolled, remain]) => {
                    scrolled.forEach(e => e.src = e.getAttribute(this.options.prefix+"-src") || e.src);
                    return this.pics = remain;
                }).then(e => (e.length||this.destroy(), e)).then(imgs => this.options.onscrolledimg && this.options.onscrolledimg(imgs));
            }.bind(this), options.throttleRate);
            this.destroy = function(){
                this.alive = false;
                removeEventListener("scroll", this.handler);
            };
            this.options.load && this.load();
            
        };
        AdovecLazyLoad.of = function(o){
            return new AdovecLazyLoad(o);
        };
        AdovecLazyLoad.utils = _;
        return AdovecLazyLoad;
    }(jQuery);

    utils.setUpEvents = function(app, events){
        app = app || this;
        app.hooks = app.hooks || {};
        app.events = events && events.map(s => s.toLowerCase()) || ['load', 'unload', 'render'];
        ["on", "once"].forEach((cond, isOnce) => app[cond] = function(event, f, ...args){
            this.hooks = this.hooks || {};
            this.hooks[event] = this.hooks[event] || [];
            return this.hooks[event].push({f, args, once:isOnce>0});
        });
        app.remove = function(event, idx){
            this.hooks[event] && this.hooks[event].splice(idx, 1);
        };
        app.trigger = function(event, ...args){
            if(this.hooks&&this.hooks[event]){
                this.hooks[event].forEach((e) => e&&e.f&&e.f(...e.args, ...args));
                this.hooks[event] = this.hooks[event].filter(e => !e.once);
            }
        };
        ["on", "once", "trigger", "remove"].forEach(t => app.events.forEach(e => app[t+e.replace(/\b\w/g, l => l.toUpperCase())] = (f, ...args) => app[t](e, f, ...args)));
        window.onbeforeunload = () => app.trigger("unload");
    };
    
    utils.render = function(template, context, delim){// A not so naive template engine.
        const funcTemplate = expr => `with(data || {}) {return (${expr});}`;
        return template.replace(new RegExp((delim || ["{{", "}}"]).join("\\s*?(.*?)\\s*?"), "gm"), (_, expr) => (new Function("data", funcTemplate(expr)))(context));
    };
    Function.prototype.runAfterDeclare = function(...args){return this(...args), this;};
    if(!Promise.prototype.finally) Promise.prototype.finally = function (f) {
        return this.then(f, f);
    };
    window.utils = utils;
})(window);

(function ($) {
    $(document).ready(function () {
        $('.blog-title').each((_,e) => e.innerHTML = utils.BLOG_TITLE);
        $('.blog-motto').each((_,e) => e.innerHTML = utils.BLOG_MOTTO);
    });
})(jQuery);

if (self.CavalryLogger) { CavalryLogger.start_js(["Hm1se"]); }

__d('legacy:cookie',['Cookie'],(function a(b,c,d,e,f,g){b.getCookie=c('Cookie').get;b.setCookie=c('Cookie').set;b.clearCookie=c('Cookie').clear;}),3);
__d('ServiceWorkerRegistration',['Promise','ClientServiceWorkerMessage'],(function a(b,c,d,e,f,g){var h='serviceWorker' in navigator;function i(){var k=navigator.serviceWorker;if(!h||!k)throw new Error('serviceWorker is not supported in this browser');return k;}var j={isSupported:function k(){return h;},registerWorkerIfUnregistered:function k(l){var m=i();return new (c('Promise'))(function(n,o){this.getWorkerRegistration(l).done(function(p){if(!p){c('Promise').resolve(m.register(l,{updateViaCache:'all'})).done(function(){c('Promise').resolve(m.ready).done(n);});}else n(p);});}.bind(this));},unregisterControllingWorker:function k(){return new (c('Promise'))(function(l,m){var n=new (c('ClientServiceWorkerMessage'))('unregister',{},function(){l(true);});n.sendViaController();});},getWorkerRegistration:function k(l){var m=i();return c('Promise').resolve(m.getRegistration(l));},isAWorkerActivated:function k(){if(!navigator.serviceWorker||!navigator.serviceWorker.getRegistration)return c('Promise').resolve(false);return navigator.serviceWorker.getRegistration().then(function(l){return !!(l&&l.active);});}};f.exports=j;}),null);
if(!self.define){let e,s={};const a=(a,n)=>(a=new URL(a+".js",n).href,s[a]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=s,document.head.appendChild(e)}else e=a,importScripts(a),s()})).then((()=>{let e=s[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e})));self.define=(n,t)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(s[i])return;let c={};const r=e=>a(e,i),o={module:{uri:i},exports:c,require:r};s[i]=Promise.all(n.map((e=>o[e]||r(e)))).then((e=>(t(...e),c)))}}define(["./workbox-4754cb34"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"eb8e24e715634778b9caca30a8122022"},{url:"/_next/static/80KkUaryao96GB4gh5enM/_buildManifest.js",revision:"c155cce658e53418dec34664328b51ac"},{url:"/_next/static/80KkUaryao96GB4gh5enM/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/117-426e7785bafcc39e.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/274.7ad5c88786973a9e.js",revision:"7ad5c88786973a9e"},{url:"/_next/static/chunks/537cd76e.5b20987fd9956b0f.js",revision:"5b20987fd9956b0f"},{url:"/_next/static/chunks/723.5aa4de52ca6005c5.js",revision:"5aa4de52ca6005c5"},{url:"/_next/static/chunks/app/_not-found/page-d0e58227775621e5.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/app/layout-65446d01a938ddc8.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/app/page-aa16a15c95efd047.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/app/test/page-37e6a30f9ce2084d.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/fd9d1056-faca5e55fb7642b2.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/framework-f66176bb897dc684.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/main-a3345ec9d37c8b39.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/main-app-cf636c167c5a0b2a.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/pages/_app-72b849fbd24ac258.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/pages/_error-7ba65e1336b92748.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-f770ad19ca9b24ea.js",revision:"80KkUaryao96GB4gh5enM"},{url:"/_next/static/css/0165ae86d787d7dc.css",revision:"0165ae86d787d7dc"},{url:"/_next/static/media/281dae1e814de8c6-s.woff2",revision:"2e8643e59f8dcca240efa656d5965385"},{url:"/_next/static/media/3c70c5716f1730b3-s.woff2",revision:"f5ca848fdd0823d0e166a4eb4164bc5a"},{url:"/_next/static/media/77fb5eec12c66d49-s.woff2",revision:"0af756a4168d80d59022d8bedb3305a9"},{url:"/_next/static/media/806de4d605d3ad01-s.p.woff2",revision:"55408a774dfe38eb61f842b03ef9e24a"},{url:"/_next/static/media/ae822095a172cc5c-s.woff2",revision:"21132e0765e0538063d507723efe0d3d"},{url:"/_next/static/media/fc727f226c737876-s.p.woff2",revision:"d62e75a5cd2d7406d1c855ae5aac62d3"},{url:"/icons/icon-192x192.png",revision:"d41d8cd98f00b204e9800998ecf8427e"},{url:"/icons/icon-base.svg",revision:"b0fa04e25bcb11cf971a3b779076c16f"},{url:"/icons/icon.svg",revision:"b0fa04e25bcb11cf971a3b779076c16f"},{url:"/manifest.json",revision:"7a6b7138eef931bd68f2bc240689e369"},{url:"/screenshots/placeholder.txt",revision:"f20566a832739c220d72de2b443cbaef"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:a,state:n})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));

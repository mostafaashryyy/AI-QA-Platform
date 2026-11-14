// Client script: section scroll-spy, table filtering / search / sorting, expand-collapse, print, and the ⓘ tooltip
// with Arabic text (role=tooltip, dir=rtl, lang=ar; hover, focus, click-to-pin, Escape) as in AIPromptOutputHistory.html.
module.exports = T => `
(function(){
var links=[].slice.call(document.querySelectorAll('nav.secnav a'));var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'))});
function spy(){var y=window.scrollY+90,cur=0;secs.forEach(function(s,i){if(s&&s.offsetTop<=y)cur=i});if(window.innerHeight+window.scrollY>=document.body.scrollHeight-4)cur=secs.length-1;links.forEach(function(a,i){a.setAttribute('aria-current',i===cur?'true':'false')});
var a=links[cur];if(a&&a.parentNode.scrollWidth>a.parentNode.clientWidth){var p=a.parentNode;p.scrollLeft=a.offsetLeft-p.clientWidth/2+a.clientWidth/2}}
window.addEventListener('scroll',spy,{passive:true});spy();
function apply(t){var tb=document.querySelector(t);if(!tb)return;var q=document.querySelector('[data-filter="'+t+'"]'),sels=document.querySelectorAll('[data-target="'+t+'"]');var rows=tb.tBodies[0].rows,n=0;
for(var i=0;i<rows.length;i++){var r=rows[i],ok=!q||!q.value||r.textContent.toLowerCase().indexOf(q.value.toLowerCase().trim())>=0;
sels.forEach(function(s){if(s.value&&r.getAttribute('data-'+s.getAttribute('data-filter-col'))!==s.value)ok=false});r.classList.toggle('hidden',!ok);if(ok)n++}
var c=document.querySelector('[data-count="'+t+'"]');if(c)c.textContent=n+' of '+rows.length+' shown'}
var targets={};document.querySelectorAll('[data-filter],[data-target]').forEach(function(el){var t=el.getAttribute('data-filter')||el.getAttribute('data-target');targets[t]=1;el.addEventListener(el.tagName==='SELECT'?'change':'input',function(){apply(t)})});
Object.keys(targets).forEach(apply);
document.querySelectorAll('table.sortable').forEach(function(tb){var ths=tb.tHead.rows[0].cells;[].forEach.call(ths,function(th,i){th.tabIndex=0;th.setAttribute('aria-sort','none');function go(e){if(e&&e.target.closest&&e.target.closest('.hint'))return;var dir=th.getAttribute('aria-sort')==='ascending'?'descending':'ascending';[].forEach.call(ths,function(h){h.setAttribute('aria-sort','none')});th.setAttribute('aria-sort',dir);
var rows=[].slice.call(tb.tBodies[0].rows);rows.sort(function(a,b){var x=a.cells[i].textContent.trim(),y=b.cells[i].textContent.trim(),nx=parseFloat(x),ny=parseFloat(y);var c=(!isNaN(nx)&&!isNaN(ny)&&/^[\\d.]/.test(x)&&/^[\\d.]/.test(y))?nx-ny:x.localeCompare(y,undefined,{numeric:true});return dir==='ascending'?c:-c});rows.forEach(function(r){tb.tBodies[0].appendChild(r)})}
th.addEventListener('click',go);th.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){if(e.target!==th)return;e.preventDefault();go()}})})});
document.querySelectorAll('[data-expand]').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll(b.getAttribute('data-expand')+' details').forEach(function(d){d.open=true})})});
document.querySelectorAll('[data-collapse]').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll(b.getAttribute('data-collapse')+' details').forEach(function(d){d.open=false})})});
var was=[];window.addEventListener('beforeprint',function(){was=[];document.querySelectorAll('details').forEach(function(d){was.push(d.open);d.open=true})});
window.addEventListener('afterprint',function(){document.querySelectorAll('details').forEach(function(d,i){d.open=was[i]})});
})();
(function(){var T=${JSON.stringify(T)};
var tip=document.createElement('div');tip.id='hint-tip';tip.setAttribute('role','tooltip');tip.setAttribute('dir','rtl');tip.setAttribute('lang','ar');tip.hidden=true;document.body.appendChild(tip);
var cur=null,pinned=false,touch=false;
document.querySelectorAll('.hint').forEach(function(h){var t=T[h.getAttribute('data-k')];if(!t)return;
h.setAttribute('role','button');h.tabIndex=0;h.setAttribute('lang','ar');h.setAttribute('aria-label','\\u0634\\u0631\\u062d: '+t);h.setAttribute('aria-controls','hint-tip');h.setAttribute('aria-expanded','false');});
function place(){if(!cur)return;var r=cur.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,m=8;
tip.style.left='0px';tip.style.top='0px';var w=tip.offsetWidth,ht=tip.offsetHeight;
var x=Math.min(Math.max(m,r.left+r.width/2-w/2),vw-w-m),y=r.bottom+6;if(y+ht>vh-m)y=r.top-ht-6;if(y<m)y=Math.min(vh-ht-m,r.bottom+6);
tip.style.left=Math.round(Math.max(m,x))+'px';tip.style.top=Math.round(Math.max(m,y))+'px';}
function show(h,pin){if(cur&&cur!==h)cur.setAttribute('aria-expanded','false');cur=h;pinned=!!pin;tip.textContent=T[h.getAttribute('data-k')]||'';tip.hidden=false;h.setAttribute('aria-expanded','true');place();}
function hide(){if(cur)cur.setAttribute('aria-expanded','false');cur=null;pinned=false;tip.hidden=true;}
function hintOf(e){return e.target&&e.target.closest?e.target.closest('.hint[role=button]'):null;}
document.addEventListener('pointerdown',function(e){touch=e.pointerType!=='mouse';},true);
document.addEventListener('mouseover',function(e){var h=hintOf(e);if(h&&!touch&&!pinned)show(h,false);});
document.addEventListener('mouseout',function(e){var h=hintOf(e);if(h&&h===cur&&!pinned&&!(e.relatedTarget&&h.contains(e.relatedTarget))&&document.activeElement!==h)hide();});
document.addEventListener('focusin',function(e){var h=hintOf(e);if(h&&!(pinned&&cur===h))show(h,false);});
document.addEventListener('focusout',function(e){var h=hintOf(e);if(h&&h===cur&&!pinned)hide();});
document.addEventListener('click',function(e){var h=hintOf(e);if(h){e.preventDefault();e.stopPropagation();if(cur===h&&pinned)hide();else show(h,true);return;}if(cur)hide();},true);
document.addEventListener('keydown',function(e){var h=hintOf(e);if(h&&(e.key==='Enter'||e.key===' '||e.key==='Spacebar')){e.preventDefault();e.stopPropagation();if(cur===h&&pinned)hide();else show(h,true);}
else if(e.key==='Escape'&&cur){var c=cur;hide();if(document.activeElement!==c&&c.focus)c.focus();}},true);
document.addEventListener('keyup',function(e){if(hintOf(e)&&(e.key===' '||e.key==='Spacebar'))e.preventDefault();},true);
window.addEventListener('scroll',function(){if(cur){if(pinned)place();else hide();}},{passive:true});window.addEventListener('resize',place);
window.addEventListener('beforeprint',hide);})();`;

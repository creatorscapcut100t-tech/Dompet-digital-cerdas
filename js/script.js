(function(){
var CATS={out:["Makanan","Transportasi","Tagihan","Belanja","Hiburan","Kesehatan","Lainnya"],in:["Gaji","Usaha","Hadiah","Lainnya"]};
var ICON={Makanan:"🍜",Transportasi:"🚌",Tagihan:"💡",Belanja:"🛍️",Hiburan:"🎬",Kesehatan:"💊",Gaji:"💼",Usaha:"🏪",Hadiah:"🎁",Lainnya:"📌"};
var COL={Makanan:"#F2B33D",Transportasi:"#4C6EF5",Tagihan:"#D2493F",Belanja:"#9B5DE5",Hiburan:"#00A6A6",Kesehatan:"#2FBF71",Lainnya:"#8A93C0"};
var KEY="dompet-cerdas-v2";
var S={tx:[],budget:3000000,goal:{name:"Dana darurat",target:5000000,saved:0},lim:{},bills:[]};
var type="out",filt="all",first=true;
function $(i){return document.getElementById(i);}
function load(){try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);if(d&&Array.isArray(d.tx)){S.tx=d.tx;S.budget=+d.budget||0;if(d.goal)S.goal=d.goal;S.lim=d.lim||{};S.bills=d.bills||[];}}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function rp(n){return "Rp "+Math.round(n).toLocaleString("id-ID");}
function num(s){return parseInt(String(s).replace(/\D/g,""),10)||0;}
function ds(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function fillCats(){var s=$("cat");s.innerHTML="";CATS[type].forEach(function(c){var o=el("option","",ICON[c]+" "+c);o.value=c;s.appendChild(o);});}
function setType(t){type=t;$("tOut").setAttribute("aria-pressed",t==="out");$("tIn").setAttribute("aria-pressed",t==="in");fillCats();}
function countUp(n){var e=$("saldo");if(!first||matchMedia("(prefers-reduced-motion:reduce)").matches||!n){e.textContent=rp(n);first=false;return;}first=false;var t0=performance.now();(function f(t){var p=Math.min((t-t0)/900,1),k=1-Math.pow(1-p,3);e.textContent=rp(n*k);if(p<1)requestAnimationFrame(f);})(t0);}
function render(){
  var now=new Date(),ym=ds(now).slice(0,7),day=now.getDate(),dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  var tin=0,tout=0,min=0,mout=0,by={},big=null;
  S.tx.forEach(function(t){
    if(t.type==="in")tin+=t.amount;else tout+=t.amount;
    if(t.date.slice(0,7)===ym){if(t.type==="in")min+=t.amount;else{mout+=t.amount;by[t.cat]=(by[t.cat]||0)+t.amount;if(!big||t.amount>big.amount)big=t;}}
  });
  countUp(tin-tout);
  $("inM").textContent=rp(min);$("outM").textContent=rp(mout);
  $("rate").textContent=min>0?Math.round((min-mout)/min*100)+"%":"-";
  var B=S.budget,pace=day/dim,left=dim-day+1;
  $("fill").style.width=(B>0?Math.min(mout/B,1)*100:0)+"%";
  $("fill").className="fill"+(B>0&&mout>B?" over":"");
  $("tick").style.left="calc("+pace*100+"% - 1px)";
  $("tickl").style.left=Math.min(Math.max(pace*100,8),92)+"%";
  var m;
  if(!B)m="Isi anggaran bulanan untuk melihat ritme belanjamu.";
  else if(!mout)m="Belum ada pengeluaran bulan ini. Jatah harianmu "+rp(B/dim)+".";
  else if(mout>B)m="Anggaran terlampaui "+rp(mout-B)+". Tahan pengeluaran sampai akhir bulan.";
  else if(mout>B*pace)m="Lebih cepat dari ritme. Sisa "+rp(B-mout)+" untuk "+left+" hari, cukup "+rp((B-mout)/left)+" per hari.";
  else m="Ritme aman. Kamu bisa memakai "+rp((B-mout)/left)+" per hari untuk "+left+" hari ke depan.";
  $("insight").textContent=m;
  // donut
  var C=2*Math.PI*42,keys=Object.keys(by).sort(function(a,b){return by[b]-by[a];}),acc=0,sv="",lg=$("leg");
  lg.innerHTML="";
  sv+='<circle cx="60" cy="60" r="42" fill="none" stroke="var(--track)" stroke-width="16"/>';
  keys.forEach(function(k){var l=by[k]/mout*C;sv+='<circle cx="60" cy="60" r="42" fill="none" stroke="'+COL[k]+'" stroke-width="16" stroke-dasharray="'+l+' '+(C-l)+'" stroke-dashoffset="'+(-acc)+'" transform="rotate(-90 60 60)"/>';acc+=l;
    var d=el("div"),a=el("span"),dot=el("i","dot");dot.style.background=COL[k];a.appendChild(dot);a.appendChild(document.createTextNode(k+" "+Math.round(by[k]/mout*100)+"%"));d.appendChild(a);d.appendChild(el("span","",rp(by[k])));lg.appendChild(d);});
  sv+='<text x="60" y="58" text-anchor="middle" font-size="7" fill="var(--mute)">Keluar</text><text x="60" y="69" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink)">'+(mout>=1e6?(mout/1e6).toFixed(1).replace(".",",")+" jt":Math.round(mout/1000)+" rb")+'</text>';
  $("donut").innerHTML=sv;
  if(!keys.length)lg.appendChild(el("p","mu","Belum ada pengeluaran bulan ini."));
  // bars
  var days=[],i,mx=1,bs="";
  for(i=6;i>=0;i--){var d0=new Date(now.getFullYear(),now.getMonth(),day-i),k=ds(d0),s=0;S.tx.forEach(function(t){if(t.type==="out"&&t.date===k)s+=t.amount;});days.push({s:s,w:d0.toLocaleDateString("id-ID",{weekday:"short"}).slice(0,3),t:i===0});if(s>mx)mx=s;}
  days.forEach(function(d,j){var h=Math.max(d.s/mx*78,d.s?3:1),x=6+j*40;bs+='<rect class="'+(d.t?"t":"")+'" x="'+x+'" y="'+(92-h)+'" width="28" height="'+h+'" rx="5"/><text x="'+(x+14)+'" y="108">'+d.w+'</text>';});
  $("bars").innerHTML=bs;
  var T=$("tiles");T.innerHTML="";
  [["Rata-rata harian",rp(mout/day)],["Proyeksi akhir bulan",rp(mout/day*dim)],["Terbesar bulan ini",big?rp(big.amount):"-"],["Kategori teratas",keys[0]?ICON[keys[0]]+" "+keys[0]:"-"]].forEach(function(r){var t=el("div","tile");t.appendChild(el("span","",r[0]));t.appendChild(el("b","",r[1]));T.appendChild(t);});
  // goal
  var g=S.goal,gp=g.target>0?Math.min(g.saved/g.target,1):0,surplus=min-mout;
  $("gfill").style.width=gp*100+"%";
  var gt=rp(g.saved)+" dari "+rp(g.target)+" ("+Math.round(gp*100)+"%)";
  if(g.target>g.saved&&surplus>0)gt+=". Dengan surplus bulan ini, tercapai sekitar "+Math.ceil((g.target-g.saved)/surplus)+" bulan lagi.";
  else if(g.target>0&&g.saved>=g.target)gt+=". Target tercapai!";
  $("gtxt").textContent=gt;
  // dompet
  var wb={Tunai:0,Bank:0,"E-wallet":0},WI={Tunai:"💵",Bank:"🏦","E-wallet":"📱"},W=$("wals");W.innerHTML="";
  S.tx.forEach(function(t){var w=t.w||"Tunai";wb[w]+=t.type==="in"?t.amount:-t.amount;});
  Object.keys(wb).forEach(function(k){var c=el("div","chip");c.appendChild(el("span","lbl",WI[k]+" "+k));c.appendChild(el("b","",rp(wb[k])));W.appendChild(c);});
  // batas
  var LM=$("lims");LM.innerHTML="";
  CATS.out.forEach(function(c){var sp=by[c]||0,l=S.lim[c]||0,r=el("div","lim"),h=el("div","lh"),inp=el("input");
    inp.inputMode="numeric";inp.placeholder="Batas (Rp)";inp.setAttribute("aria-label","Batas "+c);inp.value=l?l.toLocaleString("id-ID"):"";
    inp.onchange=function(){S.lim[c]=num(this.value);save();render();};
    h.appendChild(el("span","",ICON[c]+" "+c));h.appendChild(inp);r.appendChild(h);
    var b=el("div","gbar"),f=el("i");f.style.width=(l?Math.min(sp/l,1)*100:0)+"%";if(l&&sp>l)f.style.background="var(--out)";b.appendChild(f);r.appendChild(b);
    r.appendChild(el("div","mu",l?rp(sp)+" dari "+rp(l)+(sp>l?", lewat "+rp(sp-l):", sisa "+rp(l-sp)):rp(sp)+" terpakai, belum ada batas"));LM.appendChild(r);});
  // tagihan
  var BL=$("bl");BL.innerHTML="";
  S.bills.map(function(b){return{b:b,n:b.day>=day?b.day-day:dim-day+b.day};}).sort(function(a,c){return a.n-c.n;}).forEach(function(o){
    var b=o.b,li=el("li"),ic=el("div","ic","🔔"),m=el("div","m"),x=el("button","del","\u00D7"),p=el("button","sm","Bayar");
    ic.style.background="#F2B33D33";m.appendChild(el("b","",b.name));m.appendChild(el("span",o.n<=3?"out":"","Tanggal "+b.day+", "+(o.n===0?"hari ini":o.n+" hari lagi")));
    p.type=x.type="button";x.setAttribute("aria-label","Hapus tagihan "+b.name);
    x.onclick=function(){S.bills=S.bills.filter(function(q){return q.id!==b.id;});save();render();};
    p.onclick=function(){S.tx.push({id:Date.now(),type:"out",amount:b.amount,cat:"Tagihan",note:b.name,date:ds(new Date()),w:"Bank"});save();render();};
    li.appendChild(ic);li.appendChild(m);li.appendChild(el("div","amt",rp(b.amount)));li.appendChild(p);li.appendChild(x);BL.appendChild(li);});
  if(!S.bills.length)BL.appendChild(el("li","mu","Belum ada tagihan rutin. Tambahkan listrik, internet, atau cicilan."));
  // list
  var L=$("list");L.innerHTML="";
  var qv=$("q").value.trim().toLowerCase(),arr=S.tx.filter(function(t){return(filt==="all"||t.type===filt)&&(!qv||((t.note||"")+" "+t.cat).toLowerCase().indexOf(qv)>-1);}).sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:b.id-a.id;});
  $("demo").hidden=S.tx.length>0;
  if(!arr.length)L.appendChild(el("li","mu","Belum ada transaksi."));
  arr.slice(0,40).forEach(function(t){
    var li=el("li"),ic=el("div","ic",ICON[t.cat]||"📌");ic.style.background=(COL[t.cat]||"#2FBF71")+"33";
    var m=el("div","m");m.appendChild(el("b","",t.note||t.cat));
    m.appendChild(el("span","",t.cat+", "+(t.w||"Tunai")+", "+new Date(t.date+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"short"})));
    var x=el("button","del","\u00D7");x.type="button";x.setAttribute("aria-label","Hapus transaksi "+(t.note||t.cat));
    x.onclick=function(){S.tx=S.tx.filter(function(q){return q.id!==t.id;});save();render();};
    li.appendChild(ic);li.appendChild(m);li.appendChild(el("div","amt "+t.type,(t.type==="in"?"+":"-")+rp(t.amount)));li.appendChild(x);L.appendChild(li);
  });
}
$("tOut").onclick=function(){setType("out");};
$("tIn").onclick=function(){setType("in");};
$("save").onclick=function(){
  var v=num($("amount").value),m=$("msg");
  if(v<=0){m.textContent="Isi jumlah lebih dari 0 dulu.";$("amount").focus();return;}
  S.tx.push({id:Date.now(),type:type,amount:v,cat:$("cat").value,note:$("note").value.trim(),date:$("date").value||ds(new Date()),w:$("wal").value});
  $("amount").value="";$("note").value="";m.textContent="Transaksi tersimpan.";save();render();
};
$("budget").onchange=function(){S.budget=num(this.value);this.value=S.budget?S.budget.toLocaleString("id-ID"):"";save();render();};
$("gname").onchange=function(){S.goal.name=this.value.trim()||"Target tabungan";save();};
$("gtarget").onchange=function(){S.goal.target=num(this.value);this.value=S.goal.target?S.goal.target.toLocaleString("id-ID"):"";save();render();};
$("gbtn").onclick=function(){var v=num($("gadd").value);if(!v)return;S.goal.saved+=v;$("gadd").value="";save();render();};
$("theme").onclick=function(){var r=document.documentElement,d=r.getAttribute("data-theme")==="dark"||(!r.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme:dark)").matches);r.setAttribute("data-theme",d?"light":"dark");};
Array.prototype.forEach.call(document.querySelectorAll("[data-f]"),function(b){b.onclick=function(){filt=b.getAttribute("data-f");Array.prototype.forEach.call(document.querySelectorAll("[data-f]"),function(o){o.setAttribute("aria-pressed",o===b);});render();};});
$("demo").onclick=function(){
  var n=Date.now(),now=new Date();
  [["in","Gaji",4500000,"Gaji bulanan",0],["out","Tagihan",650000,"Listrik & internet",0],["out","Makanan",85000,"Makan siang",0],["out","Transportasi",60000,"Bensin",1],["out","Belanja",320000,"Belanja dapur",2],["out","Hiburan",120000,"Langganan streaming",3],["out","Makanan",45000,"Kopi & roti",4],["out","Kesehatan",90000,"Vitamin",5]].forEach(function(r,i){
    S.tx.push({id:n+i,type:r[0],cat:r[1],amount:r[2],note:r[3],date:ds(new Date(now.getFullYear(),now.getMonth(),Math.max(now.getDate()-r[4],1)))});});
  save();render();
};
$("q").oninput=render;
$("bb").onclick=function(){var n=$("bn").value.trim(),a=num($("ba").value),d=Math.min(num($("bd").value),31);if(!n||!a||!d)return;S.bills.push({id:Date.now(),name:n,amount:a,day:d});$("bn").value=$("ba").value=$("bd").value="";save();render();};
$("csv").onclick=function(){var t="tanggal,jenis,kategori,dompet,jumlah,catatan\n"+S.tx.map(function(x){return [x.date,x.type==="in"?"masuk":"keluar",x.cat,x.w||"Tunai",x.amount,'"'+String(x.note||"").replace(/"/g,'""')+'"'].join(",");}).join("\n"),m=$("tmsg"),bad=function(){m.textContent="Tidak bisa menyalin otomatis dari halaman ini.";};
  try{navigator.clipboard.writeText(t).then(function(){m.textContent="CSV disalin. Tempel ke Excel atau Google Sheets.";},bad);}catch(e){bad();}};
var arm=0;$("rst").onclick=function(){if(!arm){arm=1;this.textContent="Klik lagi untuk menghapus";return;}S.tx=[];S.lim={};S.bills=[];S.goal.saved=0;arm=0;this.textContent="Hapus semua data";save();render();};
load();
$("budget").value=S.budget?S.budget.toLocaleString("id-ID"):"";
$("gname").value=S.goal.name;$("gtarget").value=S.goal.target?S.goal.target.toLocaleString("id-ID"):"";
$("date").value=ds(new Date());
fillCats();render();
})();


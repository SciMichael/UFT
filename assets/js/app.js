const DATA_URL="./assets/data/revistas.json";
const $=id=>document.getElementById(id);
const brl=n=>n==null?"Não informado":"R$ "+Number(n).toLocaleString("pt-BR");
const val=(n,s="")=>n==null?"Não informado":n+s;
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const link=(u,t)=>u?'<a class="btn" href="'+esc(u)+'" target="_blank" rel="noopener">'+t+"</a>":'<span class="btn" aria-disabled="true" style="opacity:.55;cursor:default">'+t+"</span>";

async function init(){
 const response=await fetch(DATA_URL,{cache:"no-store"});
 if(!response.ok) throw new Error("Não foi possível carregar a base editorial.");
 const base=await response.json();
 const REVISTAS=Array.isArray(base.revistas)?base.revistas:[];
 const BASE_ATUALIZADA=base.baseAtualizada||"";
 $("base-data").textContent=BASE_ATUALIZADA;

 const uniq=k=>[...new Set(REVISTAS.map(r=>r[k]).filter(Boolean))].sort();
 [["area","area"],["qualis","qualis"],["acesso","acesso"]].forEach(([el,k])=>uniq(k).forEach(v=>$(el).add(new Option(v,v))));
 const knownTaxas=REVISTAS.map(r=>Number(r.taxa)).filter(Number.isFinite);
 const knownDias=REVISTAS.map(r=>Number(r.dias)).filter(Number.isFinite);
 const maxTaxa=knownTaxas.length?Math.max(...knownTaxas):50000;
 const maxDias=knownDias.length?Math.max(...knownDias):365;
 $("taxa").max=maxTaxa;$("taxa").value=maxTaxa;
 $("dias").max=maxDias;$("dias").value=maxDias;
 const sel=new Set();

 function filtradas(){
   const q=$("q").value.trim().toLowerCase();
   const maxTax=+$("taxa").value,maxDay=+$("dias").value;
   const r=REVISTAS.filter(x=>
     (!q||[x.titulo,x.escopo,x.editora,x.issn].join(" ").toLowerCase().includes(q)) &&
     (!$("area").value||x.area===$("area").value) &&
     (x.percentil==null||Number(x.percentil)>=+$("perc").value) &&
     (!$("sjr").value||x.sjr===$("sjr").value) &&
     (!$("qualis").value||x.qualis===$("qualis").value) &&
     (!$("acesso").value||x.acesso===$("acesso").value) &&
     (x.taxa==null||Number(x.taxa)<=maxTax) &&
     (x.dias==null||Number(x.dias)<=maxDay)
   );
   const o=$("ord").value;
   return r.sort((a,b)=>o==="nome"?a.titulo.localeCompare(b.titulo):o==="taxa"?(a.taxa??Infinity)-(b.taxa??Infinity):o==="dias"?(a.dias??Infinity)-(b.dias??Infinity):(b.percentil??0)-(a.percentil??0)||(b.h??0)-(a.h??0));
 }

 function renderCmp(){
   const r=REVISTAS.filter(x=>sel.has(x.id));
   $("cmp-tabela").innerHTML=r.length
    ?"<table><tr><th>Indicador</th>"+r.map(x=>"<th>"+esc(x.titulo)+"</th>").join("")+"</tr>"+
      [["Editora","editora"],["ISSN","issn"],["Área","area"],["Qualis","qualis"],["Quartil SJR","sjr"],["Índice H","h"],["Percentil H","percentil"],["Acesso","acesso"],["Taxa","taxa"],["Tempo até publicar","dias"]]
      .map(([l,k])=>"<tr><th>"+l+"</th>"+r.map(x=>"<td>"+(k==="taxa"?brl(x[k]):k==="dias"?val(x[k]," dias"):esc(x[k]))+"</td>").join("")+"</tr>").join("")+"</table>"
    :'<p class="empty">Marque “comparar” nos cartões da lista.</p>';
 }

 function render(){
   $("perc-v").textContent=$("perc").value;
   $("taxa-v").textContent=+$("taxa").value>=maxTaxa?"qualquer valor":brl(+$("taxa").value);
   $("dias-v").textContent=+$("dias").value>=maxDias?"qualquer prazo":$("dias").value+" dias";
   const r=filtradas();
   $("count").textContent=r.length+(r.length===1?" revista":" revistas");
   $("lista").innerHTML=r.length?r.map(x=>'<article class="card"><label class="cmp"><input type="checkbox" data-id="'+x.id+'" '+(sel.has(x.id)?"checked":"")+'> comparar</label><h2>'+esc(x.titulo)+'</h2><div class="meta">'+esc(x.editora)+" · ISSN "+esc(x.issn)+" · "+esc(x.area)+'</div><p>'+esc(x.escopo)+'</p><div class="chips"><span>Qualis '+esc(x.qualis)+'</span><span>'+esc(x.sjr)+'</span><span>h '+val(x.h)+'</span><span>percentil '+val(x.percentil)+'</span><span>'+esc(x.acesso)+'</span><span>'+brl(x.taxa)+'</span><span>'+val(x.dias," dias")+'</span></div><div class="act">'+link(x.url_ficha,"Ver ficha")+link(x.url_instrucoes,"Instruções aos autores")+'<small>atualizado em '+esc(x.atualizado)+"</small></div></article>").join(""):'<p class="empty">Nenhuma revista com esses filtros.</p>';
   renderCmp();
 }

 function limpar(){
   $("q").value="";$("area").value="";$("sjr").value="";$("qualis").value="";$("acesso").value="";
   $("perc").value=50;$("taxa").value=maxTaxa;$("dias").value=maxDias;render();
 }

 function pdf(){
   const rows=REVISTAS.map(r=>"<tr><td>"+esc(r.titulo)+"</td><td>"+esc(r.editora)+"</td><td>"+esc(r.issn)+"</td><td>"+esc(r.area)+"</td><td>"+esc(r.sjr)+"</td><td>"+val(r.h)+"</td><td>"+esc(r.acesso)+"</td><td>"+brl(r.taxa)+"</td></tr>").join("");
   const w=window.open("","_blank");
   if(!w){alert("Permita pop-ups para gerar o PDF.");return;}
   w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Referências — PPGAD/UFT</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#17241c}h1{font-size:20px}p{color:#4c5d52}table{border-collapse:collapse;width:100%;font-size:10px}th,td{border:1px solid #ccd5cf;padding:6px;text-align:left;vertical-align:top}th{background:#eef3ef}@media print{button{display:none}}</style></head><body><h1>Referências de periódicos — PPGAD/UFT</h1><p>Base atualizada em '+esc(BASE_ATUALIZADA)+'. Documento gerado pelo portal para impressão ou salvamento em PDF.</p><table><thead><tr><th>Revista</th><th>Editora</th><th>ISSN</th><th>Área</th><th>SJR</th><th>H</th><th>Acesso</th><th>Taxa</th></tr></thead><tbody>'+rows+'</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>');
   w.document.close();
 }

 $("lista").addEventListener("change",e=>{const id=+e.target.dataset.id;if(!id)return;e.target.checked?sel.add(id):sel.delete(id);renderCmp();});
 ["q","area","perc","sjr","qualis","acesso","taxa","dias","ord"].forEach(id=>$(id).addEventListener("input",render));
 $("limpar").onclick=limpar;
 $("pdf").onclick=pdf;
 $("csv").onclick=()=>{const cols=["titulo","editora","issn","area","qualis","sjr","h","percentil","acesso","taxa","dias","atualizado"];const linhas=[cols.join(";"),...filtradas().map(r=>cols.map(c=>'"'+String(r[c]??"").replaceAll('"','""')+'"').join(";"))];const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+linhas.join("\n")],{type:"text/csv;charset=utf-8"}));a.download="revistas-ppgad.csv";a.click();URL.revokeObjectURL(a.href);};
 render();
}
init().catch(error=>{$("lista").innerHTML='<p class="empty">'+esc(error.message)+"</p>";console.error(error)});
const DATA_URL="./assets/data/revistas.json";
const $=id=>document.getElementById(id);
const brl=n=>"R$ "+Number(n||0).toLocaleString("pt-BR");
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
 [["area","area"],["qualis","qualis"],["acesso","acesso"]].forEach(([el,k])=>uniq(k).forEach(v=>$("area"===el?"area":el).add(new Option(v,v))));
 const maxTaxa=REVISTAS.length?Math.max(...REVISTAS.map(r=>Number(r.taxa)||0)):0;
 const maxDias=REVISTAS.length?Math.max(...REVISTAS.map(r=>Number(r.dias)||0)):0;
 $("taxa").max=maxTaxa;$("taxa").value=maxTaxa;
 $("dias").max=maxDias;$("dias").value=maxDias;
 const sel=new Set();

 function filtradas(){
   const q=$("q").value.trim().toLowerCase();
   const r=REVISTAS.filter(x=>
     (!q||[x.titulo,x.escopo,x.editora,x.issn].join(" ").toLowerCase().includes(q)) &&
     (!$("area").value||x.area===$("area").value) &&
     Number(x.percentil)>=+$("perc").value &&
     (!$("sjr").value||x.sjr===$("sjr").value) &&
     (!$("qualis").value||x.qualis===$("qualis").value) &&
     (!$("acesso").value||x.acesso===$("acesso").value) &&
     Number(x.taxa)<=+$("taxa").value &&
     Number(x.dias)<=+$("dias").value
   );
   const o=$("ord").value;
   return r.sort((a,b)=>o==="nome"?a.titulo.localeCompare(b.titulo):o==="taxa"?a.taxa-b.taxa:o==="dias"?a.dias-b.dias:b.percentil-a.percentil||b.h-a.h);
 }

 function renderCmp(){
   const r=REVISTAS.filter(x=>sel.has(x.id));
   $("cmp-tabela").innerHTML=r.length
    ?'<table><tr><th>Indicador</th>'+r.map(x=>"<th>"+esc(x.titulo)+"</th>").join("")+"</tr>"+
      [["Editora","editora"],["ISSN","issn"],["Área","area"],["Qualis","qualis"],["Quartil SJR","sjr"],["Índice H","h"],["Percentil H","percentil"],["Acesso","acesso"],["Taxa","taxa"],["Tempo até publicar","dias"]]
      .map(([l,k])=>"<tr><th>"+l+"</th>"+r.map(x=>"<td>"+(k==="taxa"?brl(x[k]):k==="dias"?"~"+x[k]+" dias":esc(x[k]))+"</td>").join("")+"</tr>").join("")+"</table>"
    :'<p class="empty">Marque “comparar” nos cartões da lista.</p>';
 }

 function render(){
   $("perc-v").textContent=$("perc").value;
   $("taxa-v").textContent=+$("taxa").value>=maxTaxa?"qualquer valor":brl(+$("taxa").value);
   $("dias-v").textContent=+$("dias").value>=maxDias?"qualquer prazo":$("dias").value+" dias";
   const r=filtradas();
   $("count").textContent=r.length+(r.length===1?" revista":" revistas");
   $("lista").innerHTML=r.length?r.map(x=>'<article class="card"><label class="cmp"><input type="checkbox" data-id="'+x.id+'" '+(sel.has(x.id)?"checked":"")+'> comparar</label><h2>'+esc(x.titulo)+'</h2><div class="meta">'+esc(x.editora)+" · ISSN "+esc(x.issn)+" · "+esc(x.area)+'</div><p>'+esc(x.escopo)+'</p><div class="chips"><span>Qualis '+esc(x.qualis)+'</span><span>'+esc(x.sjr)+'</span><span>h '+x.h+'</span><span>percentil '+x.percentil+'</span><span>'+esc(x.acesso)+'</span><span>'+brl(x.taxa)+'</span><span>~'+x.dias+' dias</span></div><div class="act">'+link(x.url_ficha,"Ver ficha")+link(x.url_instrucoes,"Instruções aos autores")+'<small>atualizado em '+esc(x.atualizado)+"</small></div></article>").join(""):'<p class="empty">Nenhuma revista com esses filtros.</p>';
   renderCmp();
 }

 function limpar(){
   $("q").value="";$("area").value="";$("sjr").value="";$("qualis").value="";$("acesso").value="";
   $("perc").value=50;$("taxa").value=maxTaxa;$("dias").value=maxDias;render();
 }

 $("lista").addEventListener("change",e=>{
   const id=+e.target.dataset.id;if(!id)return;
   e.target.checked?sel.add(id):sel.delete(id);renderCmp();
 });
 ["q","area","perc","sjr","qualis","acesso","taxa","dias","ord"].forEach(id=>$(id).addEventListener("input",render));
 $("limpar").onclick=limpar;
 $("csv").onclick=()=>{
   const cols=["titulo","editora","issn","area","qualis","sjr","h","percentil","acesso","taxa","dias","atualizado"];
   const linhas=[cols.join(";"),...filtradas().map(r=>cols.map(c=>'"'+String(r[c]??"").replaceAll('"','""')+'"').join(";"))];
   const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+linhas.join("\n")],{type:"text/csv;charset=utf-8"}));a.download="revistas-ppgad.csv";a.click();URL.revokeObjectURL(a.href);
 };
 render();
}

init().catch(error=>{$("lista").innerHTML='<p class="empty">'+esc(error.message)+"</p>";console.error(error)});
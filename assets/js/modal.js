const modal=document.getElementById("modal-sugestao");
const abrir=document.getElementById("nav-sugerir");
const fechar=document.getElementById("fechar-sugestao");
const cancelar=document.getElementById("cancelar-sugestao");
function abrirSugestao(){if(!modal)return;modal.hidden=false;document.body.style.overflow="hidden";const nome=document.getElementById("nome");if(nome)setTimeout(()=>nome.focus(),50)}
function fecharSugestao(){if(!modal)return;modal.hidden=true;document.body.style.overflow=""}
if(abrir)abrir.addEventListener("click",function(e){e.preventDefault();abrirSugestao()});
if(fechar)fechar.addEventListener("click",fecharSugestao);
if(cancelar)cancelar.addEventListener("click",fecharSugestao);
if(modal)modal.addEventListener("click",function(e){if(e.target===modal)fecharSugestao()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&modal&&!modal.hidden)fecharSugestao()});
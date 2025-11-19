// JS principal do Gestor Promocar v6 (resumido)

const STORAGE_KEYS = {
  rotina: "gp_rotina_tasks",
  videos: "gp_videos",
  anuncios: "gp_anuncios",
  portais: "gp_portais",
  equipe: "gp_equipe",
  settings: "gp_settings",
  vendasPorOrigem: "gp_vendas_origem",
};

const VENDEDORES_INICIAIS = [
  { id: "emerson", nome: "Emerson" },
  { id: "ezequiel", nome: "Ezequiel" },
  { id: "gabriel", nome: "Gabriel" },
  { id: "fernando", nome: "Fernando" },
  { id: "fernanda", nome: "Fernanda (SDR)" },
];

const ROTINA_PADRAO = [
  { id: "bomdia", label: "08:00 – Gravar bom dia"},
  { id: "fotos", label: "08:06 – 09:00 – Fotos + vídeos curtos"},
  { id: "edicao-manha", label: "09:00 – 10:20 – Edição da manhã"},
  { id: "anuncios-manha", label: "10:20 – 12:00 – Anúncios (AutoConf + portais + marketplace)"},
  { id: "almoco", label: "12:00 – 13:00 – Almoço + leads leves"},
  { id: "gestao", label: "13:00 – 14:00 – Gestão (atendimentos, follow-ups, leads quentes)"},
  { id: "videos-tarde", label: "14:00 – 15:00 – Vídeos da tarde"},
  { id: "edicao-tarde", label: "15:00 – 15:40 – Edição da tarde"},
  { id: "marketplace", label: "15:40 – 16:30 – Marketplace + ajustes"},
  { id: "fechamento", label: "16:30 – 17:30 – Fechamento do dia"},
];

const PORTAIS_PADRAO = [
  "Chaves na Mão",
  "Webmotors",
  "OLX",
  "Mobiauto",
  "Mercado Livre",
  "UsadosBR",
  "iCarros",
  "Facebook / Instagram Ads",
  "Google Ads / Tráfego Pago",
  "Marketplace",
];

function salvarLS(k, v){localStorage.setItem(k, JSON.stringify(v));}
function lerLS(k, d){try{const r=localStorage.getItem(k);return r?JSON.parse(r):d;}catch{return d;}}
function formatarMoeda(v){if(!v||isNaN(v))return "R$ 0,00";return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function hojeTexto(){const d=new Date();return d.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit"});}
function horaTexto(){const d=new Date();return d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}

let estadoRotina = lerLS(STORAGE_KEYS.rotina, {});
let estadoVideos = lerLS(STORAGE_KEYS.videos, {});
let estadoAnuncios = lerLS(STORAGE_KEYS.anuncios, {});
let estadoPortais = lerLS(STORAGE_KEYS.portais, []);
let estadoEquipe = lerLS(STORAGE_KEYS.equipe, {});
let estadoSettings = lerLS(STORAGE_KEYS.settings, {
  metaMensal: 50,
  mesReferencia: new Date().toISOString().slice(0,7),
});
let estadoVendasOrigem = lerLS(STORAGE_KEYS.vendasPorOrigem, {});

function atualizarHeader(){
  const d=document.getElementById("header-date");
  const h=document.getElementById("header-time");
  if(d)d.textContent=hojeTexto();
  if(h)h.textContent=horaTexto();
}
setInterval(atualizarHeader, 1000);

function mostrarView(viewId){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active-view", v.id==="view-"+viewId));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active-nav", b.dataset.view===viewId));
}

function setupNav(){
  document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{mostrarView(btn.dataset.view); if(btn.dataset.view==="dashboard")atualizarDashboard();});
  });
  document.querySelectorAll("[data-nav]").forEach(el=>{
    el.addEventListener("click",()=>{
      const t=el.getAttribute("data-nav");
      const btn=document.querySelector('.nav-btn[data-view="'+t+'"]');
      if(btn)btn.click(); else mostrarView(t);
    });
  });
}

function inicializarRotinaDOM(){
  const ul=document.getElementById("rotina-list"); if(!ul)return;
  ul.innerHTML="";
  ROTINA_PADRAO.forEach(t=>{
    const li=document.createElement("li");
    const label=document.createElement("label");
    const c=document.createElement("input");
    c.type="checkbox"; c.checked=!!estadoRotina[t.id];
    c.addEventListener("change",()=>{estadoRotina[t.id]=c.checked;salvarLS(STORAGE_KEYS.rotina,estadoRotina);atualizarDashboard();});
    label.appendChild(c); label.append(" "+t.label); li.appendChild(label); ul.appendChild(li);
  });
}
function calcularStatusRotina(){
  const total=ROTINA_PADRAO.length;
  let concluidas=0; ROTINA_PADRAO.forEach(t=>{if(estadoRotina[t.id])concluidas++;});
  const pendentes=total-concluidas; const percent= total?Math.round(concluidas/total*100):0;
  return {total,concluidas,pendentes,percent};
}

function setupVideos(){
  document.querySelectorAll(".js-video-check").forEach(chk=>{
    const id=chk.dataset.id; chk.checked=!!estadoVideos[id];
    chk.addEventListener("change",()=>{estadoVideos[id]=chk.checked;salvarLS(STORAGE_KEYS.videos,estadoVideos);});
  });
}
function setupAnuncios(){
  document.querySelectorAll(".js-anuncio-check").forEach(chk=>{
    const id=chk.dataset.id; chk.checked=!!estadoAnuncios[id];
    chk.addEventListener("change",()=>{estadoAnuncios[id]=chk.checked;salvarLS(STORAGE_KEYS.anuncios,estadoAnuncios);});
  });
}

function inicializarPortaisSeVazio(){
  if(!estadoPortais||estadoPortais.length===0){
    estadoPortais=PORTAIS_PADRAO.map(n=>({id:n.toLowerCase().replace(/\s+/g,"-"),nome:n,custo:0,vencimento:"",leads:0,vendas:0}));
    salvarLS(STORAGE_KEYS.portais,estadoPortais);
  }
}

function renderPortaisTabela(){
  const tbody=document.getElementById("portais-body");
  const totalEl=document.getElementById("portais-total");
  if(!tbody)return; tbody.innerHTML=""; let totalCusto=0;
  const hoje = new Date();
  estadoPortais.forEach((p,idx)=>{
    if (typeof p.pago === "undefined") p.pago = false;

    const tr=document.createElement("tr");

    function cell(tipo,valor,campo,attrs={}){
      const td=document.createElement("td"); const inp=document.createElement("input");
      inp.type=tipo; inp.value=valor??""; Object.assign(inp,attrs);
      inp.addEventListener("change",()=>{
        let val=inp.value;
        if(["custo","leads","vendas"].includes(campo)) val=parseFloat(val.replace(",","."))||0;
        estadoPortais[idx][campo]=val; salvarLS(STORAGE_KEYS.portais,estadoPortais);
        renderPortaisTabela(); atualizarDashboard();
      });
      td.appendChild(inp); return td;
    }

    tr.appendChild(cell("text",p.nome,"nome"));
    tr.appendChild(cell("number",p.custo,"custo",{step:"0.01",min:"0"}));
    tr.appendChild(cell("date",p.vencimento,"vencimento"));
    tr.appendChild(cell("number",p.leads,"leads",{step:"1",min:"0"}));
    tr.appendChild(cell("number",p.vendas,"vendas",{step:"1",min:"0"}));

    const tdC=document.createElement("td");
    let cpv=0; if(p.vendas>0 && p.custo>0) cpv=p.custo/p.vendas;
    tdC.textContent=cpv?formatarMoeda(cpv):"-"; tr.appendChild(tdC);

    // Status + botão pagar
    const tdStatus = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "status-pill";

    let dias = null;
    if (p.vencimento) {
      dias = (new Date(p.vencimento) - hoje) / (1000*60*60*24);
    }

    let status = "OK";
    let statusClass = "status-ok";

    if (p.pago) {
      status = "Pago";
      statusClass = "status-pago";
    } else if (p.vencimento) {
      if (dias < 0) { status = "Vencido"; statusClass = "status-vencido"; }
      else if (dias <= 3) { status = "Urgente"; statusClass = "status-urgente"; }
      else if (dias <= 10) { status = "Atenção"; statusClass = "status-atencao"; }
      else { status = "OK"; statusClass = "status-ok"; }
    }

    btn.textContent = status;
    btn.classList.add(statusClass);
    btn.addEventListener("click",()=>{
      estadoPortais[idx].pago = !estadoPortais[idx].pago;
      salvarLS(STORAGE_KEYS.portais, estadoPortais);
      renderPortaisTabela();
      atualizarDashboard();
    });

    tdStatus.appendChild(btn);
    tr.appendChild(tdStatus);

    tbody.appendChild(tr); totalCusto+=p.custo||0;
  });
  if(totalEl)totalEl.textContent=formatarMoeda(totalCusto);
}

function setupPortais(){
  inicializarPortaisSeVazio(); renderPortaisTabela();
  const btn=document.getElementById("btn-add-portal");
  if(btn)btn.addEventListener("click",()=>{
    estadoPortais.push({id:"portal-"+(estadoPortais.length+1),nome:"Novo portal",custo:0,vencimento:"",leads:0,vendas:0});
    salvarLS(STORAGE_KEYS.portais,estadoPortais); renderPortaisTabela();
  });
}

function inicializarEquipeSeVazio(){
  if(!estadoEquipe||Object.keys(estadoEquipe).length===0){
    estadoEquipe={}; VENDEDORES_INICIAIS.forEach(v=>{estadoEquipe[v.id]={nome:v.nome,leads:0,visitas:0,vendas:0};});
    salvarLS(STORAGE_KEYS.equipe,estadoEquipe);
  }
}
function calcularConversao(leads,vendas){if(!leads||leads<=0)return 0; return vendas/leads*100;}
function renderEquipeCards(){
  const c=document.getElementById("equipe-cards"); if(!c)return; c.innerHTML="";
  Object.entries(estadoEquipe).forEach(([id,d])=>{
    const card=document.createElement("div"); card.className="equipe-card";
    const conv=calcularConversao(d.leads,d.vendas).toFixed(1);
    const h=document.createElement("div"); h.className="equipe-card-header";
    h.innerHTML=`<span>${d.nome}</span><span>${conv}% conv.</span>`; card.appendChild(h);
    const m1=document.createElement("div"); m1.className="equipe-metric"; m1.innerHTML=`<span>Leads:</span><strong>${d.leads}</strong>`; card.appendChild(m1);
    const m2=document.createElement("div"); m2.className="equipe-metric"; m2.innerHTML=`<span>Visitas:</span><strong>${d.visitas}</strong>`; card.appendChild(m2);
    const m3=document.createElement("div"); m3.className="equipe-metric"; m3.innerHTML=`<span>Vendas:</span><strong>${d.vendas}</strong>`; card.appendChild(m3);
    const actions=document.createElement("div"); actions.className="equipe-actions";
    function botao(lbl,tipo){const b=document.createElement("button");b.className="btn-sm";b.textContent=lbl;
      b.addEventListener("click",()=>{if(tipo==="lead")estadoEquipe[id].leads++;else if(tipo==="visita")estadoEquipe[id].visitas++;else if(tipo==="venda"){abrirModalOrigemVenda(id);return;}
        salvarLS(STORAGE_KEYS.equipe,estadoEquipe);renderEquipeCards();atualizarDashboard();});return b;}
    actions.appendChild(botao("+ Lead","lead"));
    actions.appendChild(botao("+ Visita","visita"));
    actions.appendChild(botao("+ Venda","venda"));
    card.appendChild(actions); c.appendChild(card);
  });
}

let vendedorAtualParaVenda=null;
function abrirModalOrigemVenda(id){
  vendedorAtualParaVenda=id;
  document.getElementById("modal-backdrop").classList.remove("hidden");
  document.getElementById("modal-origem-select").value="";
  document.getElementById("modal-origem-outro").classList.add("hidden");
}
function fecharModal(){
  document.getElementById("modal-backdrop").classList.add("hidden");
  vendedorAtualParaVenda=null;
}
function setupModalVenda(){
  const select=document.getElementById("modal-origem-select");
  const outro=document.getElementById("modal-origem-outro");
  document.getElementById("modal-cancelar").addEventListener("click",fecharModal);
  select.addEventListener("change",()=>{if(select.value==="outro")outro.classList.remove("hidden");else outro.classList.add("hidden");});
  document.getElementById("modal-confirmar").addEventListener("click",()=>{
    if(!vendedorAtualParaVenda)return fecharModal();
    let origem=select.value; if(!origem){alert("Selecione uma origem.");return;}
    if(origem==="outro"){if(!outro.value.trim()){alert("Digite a origem.");return;} origem=outro.value.trim();}
    estadoEquipe[vendedorAtualParaVenda].vendas++; salvarLS(STORAGE_KEYS.equipe,estadoEquipe);
    if(!estadoVendasOrigem[origem])estadoVendasOrigem[origem]=0; estadoVendasOrigem[origem]++; salvarLS(STORAGE_KEYS.vendasPorOrigem,estadoVendasOrigem);
    fecharModal(); renderEquipeCards(); atualizarDashboard();
  });
}

function aplicarSettingsNaUI(){
  const meta=document.getElementById("config-meta");
  const mes=document.getElementById("config-mes");
  if(meta)meta.value=estadoSettings.metaMensal||50;
  if(mes)mes.value=estadoSettings.mesReferencia;
}
function setupConfig(){
  const meta=document.getElementById("config-meta");
  const mes=document.getElementById("config-mes");
  const btnSalvar=document.getElementById("btn-salvar-config");
  const btnResetDia=document.getElementById("btn-reset-dia");
  const btnResetEquipe=document.getElementById("btn-reset-equipe");
  if(btnSalvar)btnSalvar.addEventListener("click",()=>{
    const m=parseInt(meta.value||"50",10); const mr=mes.value||new Date().toISOString().slice(0,7);
    estadoSettings.metaMensal=m>0?m:50; estadoSettings.mesReferencia=mr; salvarLS(STORAGE_KEYS.settings,estadoSettings);
    atualizarDashboard(); alert("Configurações salvas.");
  });
  if(btnResetDia)btnResetDia.addEventListener("click",()=>{
    if(!confirm("Resetar rotina de hoje?"))return;
    estadoRotina={}; salvarLS(STORAGE_KEYS.rotina,estadoRotina); inicializarRotinaDOM(); atualizarDashboard();
  });
  if(btnResetEquipe)btnResetEquipe.addEventListener("click",()=>{
    if(!confirm("Resetar números da equipe?"))return;
    estadoEquipe={}; VENDEDORES_INICIAIS.forEach(v=>{estadoEquipe[v.id]={nome:v.nome,leads:0,visitas:0,vendas:0};});
    estadoVendasOrigem={}; salvarLS(STORAGE_KEYS.equipe,estadoEquipe); salvarLS(STORAGE_KEYS.vendasPorOrigem,estadoVendasOrigem);
    renderEquipeCards(); atualizarDashboard();
  });
}

function atualizarDashboard(){
  const s=calcularStatusRotina();
  const pend=document.getElementById("status-dia-pendentes");
  const conc=document.getElementById("status-dia-concluidas");
  const tot=document.getElementById("status-dia-total");
  const perc=document.getElementById("status-dia-percent");
  const bar=document.getElementById("status-dia-bar");
  if(pend)pend.textContent=s.pendentes;
  if(conc)conc.textContent=s.concluidas;
  if(tot)tot.textContent=s.total;
  if(perc)perc.textContent=s.percent+"%";
  if(bar)bar.style.width=s.percent+"%";

  let totalVendas=0; Object.values(estadoEquipe).forEach(d=>{totalVendas+=d.vendas||0;});
  const meta=estadoSettings.metaMensal||50; const faltam=Math.max(meta-totalVendas,0);
  const metaPercent=meta?Math.round(totalVendas/meta*100):0;
  const metaTotalEl=document.getElementById("meta-total");
  const metaVendEl=document.getElementById("meta-vendidos");
  const metaFalEl=document.getElementById("meta-faltam");
  const metaPercEl=document.getElementById("meta-percent");
  const metaBar=document.getElementById("meta-bar-fill");
  if(metaTotalEl)metaTotalEl.textContent=meta;
  if(metaVendEl)metaVendEl.textContent=totalVendas;
  if(metaFalEl)metaFalEl.textContent=faltam;
  if(metaPercEl)metaPercEl.textContent=metaPercent+"%";
  if(metaBar)metaBar.style.width=Math.min(metaPercent,100)+"%";
  const metaLabel=document.getElementById("status-meta-mes-label");
  if(metaLabel)metaLabel.textContent=`Mês: ${estadoSettings.mesReferencia} · Meta: ${meta} carros`;

  const rank=document.getElementById("dash-ranking");
  if(rank){
    const arr=Object.values(estadoEquipe).slice().sort((a,b)=>(b.vendas||0)-(a.vendas||0));
    rank.innerHTML=""; arr.slice(0,4).forEach((d,i)=>{
      const li=document.createElement("li");
      const emoji=i===0?"🥇":i===1?"🥈":i===2?"🥉":"🏅";
      const conv=calcularConversao(d.leads,d.vendas).toFixed(1);
      li.innerHTML=`<span>${emoji} ${d.nome}</span><span>${d.vendas} vendas • ${conv}%</span>`;
      rank.appendChild(li);
    });
  }


  const dashPort=document.getElementById("dash-portais");
  const dashTotal=document.getElementById("dash-portais-total");
  if(dashPort){
    dashPort.innerHTML="";
    const agora=new Date();
    const cps=estadoPortais.slice().filter(p=>p.vencimento).sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento));
    cps.slice(0,3).forEach(p=>{
      if (typeof p.pago === "undefined") p.pago = false;
      const li=document.createElement("li");
      const dias=(new Date(p.vencimento)-agora)/(1000*60*60*24);
      let status="OK";
      if (p.pago) status="Pago";
      else if(dias<0)status="Vencido";
      else if(dias<=3)status="Urgente";
      else if(dias<=10)status="Atenção";
      li.innerHTML=`<span>${p.nome}</span><strong>${status} · ${p.vencimento||"-"}</strong>`;
      dashPort.appendChild(li);
    });
    let total=0; estadoPortais.forEach(p=>total+=p.custo||0);
    if(dashTotal)dashTotal.textContent=formatarMoeda(total);
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  atualizarHeader();
  if(!estadoRotina||typeof estadoRotina!=="object")estadoRotina={};
  inicializarPortaisSeVazio();
  inicializarEquipeSeVazio();
  inicializarRotinaDOM();
  setupVideos();
  setupAnuncios();
  setupPortais();
  renderEquipeCards();
  aplicarSettingsNaUI();
  setupConfig();
  setupNav();
  setupModalVenda();
  atualizarDashboard();
  mostrarView("dashboard");
});

document.addEventListener("DOMContentLoaded",()=>{

   const rows=document.querySelectorAll("#"+tableId+" tr");
   let csv=[];
   rows.forEach(r=>{
     let cols=r.querySelectorAll("th,td");
     let line=[];
     cols.forEach(c=>line.push(c.innerText));
     csv.push(line.join(","));
   });
   const blob=new Blob([csv.join("\n")],{type:"text/csv"});
   const a=document.createElement("a");
   a.href=URL.createObjectURL(blob);
   a.download=filename;
   a.click();
 }






});

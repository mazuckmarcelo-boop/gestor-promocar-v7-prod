import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// MESMO config do seu projeto gestor-promocar
const firebaseConfig = {
  apiKey: "AIzaSyB3lg9bGROqCtrrKK3Oz18fNre2J0WiKPQ",
  authDomain: "gestor-promocar.firebaseapp.com",
  projectId: "gestor-promocar",
  storageBucket: "gestor-promocar.firebasestorage.app",
  messagingSenderId: "275169819326",
  appId: "1:275169819326:web:5f977576f8cc8edc057cef"
};

// Inicializa app Firebase próprio deste módulo (independente do login)
const appFB = initializeApp(firebaseConfig, "rotina-app");
const db = getFirestore(appFB);

// Helper para gerar ID do documento do dia no formato AAAA-MM-DD
function getIdDiaHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Lê os números que hoje estão na tela (DOM)
function lerContadoresDoDOM() {
  const pegaNumero = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = parseInt((el.innerText || "0").replace(/\D+/g, "")) || 0;
    return v;
  };

  return {
    pendentes: pegaNumero("status-dia-pendentes"),
    concluidas: pegaNumero("status-dia-concluidas"),
    total: pegaNumero("status-dia-total"),
  };
}

// Atualiza os elementos da tela a partir de um objeto de dados
function aplicarNoDOMRotina(data) {
  const pendEl = document.getElementById("status-dia-pendentes");
  const concEl = document.getElementById("status-dia-concluidas");
  const totEl  = document.getElementById("status-dia-total");

  if (pendEl) pendEl.innerText = data.pendentes ?? 0;
  if (concEl) concEl.innerText = data.concluidas ?? 0;
  if (totEl)  totEl.innerText  = data.total ?? 0;
}

// Carrega rotina do dia a partir do Firestore
async function loadRotinaDia() {
  try {
    const idDia = getIdDiaHoje();
    const ref = doc(db, "rotina", idDia);
    const snap = await getDoc(ref);
    let data;
    if (!snap.exists()) {
      data = { pendentes: 0, concluidas: 0, total: 0 };
      await setDoc(ref, data);
    } else {
      data = snap.data();
      // Garante campos numéricos
      data.pendentes = data.pendentes ?? 0;
      data.concluidas = data.concluidas ?? 0;
      data.total = data.total ?? 0;
    }

    // Joga para o painel (dashboard)
    aplicarNoDOMRotina(data);
  } catch (e) {
    console.error("Erro ao carregar rotina do dia no Firestore:", e);
  }
}

// Salva APENAS os números (pendentes, concluidas, total) no Firestore
async function salvarRotinaDia() {
  try {
    const idDia = getIdDiaHoje();
    const ref = doc(db, "rotina", idDia);
    const contadores = lerContadoresDoDOM();
    await setDoc(ref, contadores, { merge: true });
    // console.log("Rotina do dia salva no Firestore:", contadores);
  } catch (e) {
    console.error("Erro ao salvar rotina do dia no Firestore:", e);
  }
}

// Inicializa integração Rotina x Firestore
function iniciarIntegracaoRotina() {
  // 1) Carrega ao abrir
  loadRotinaDia();

  // 2) A cada 5 segundos, envia os números atuais para o Firestore
  //    Isso garante sincronização entre dispositivos mesmo se o app.js
  //    cuidar sozinho da lógica dos checkboxes.
  setInterval(() => {
    salvarRotinaDia();
  }, 5000);
}

window.addEventListener("load", iniciarIntegracaoRotina);

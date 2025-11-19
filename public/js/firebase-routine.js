import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Mesmo config do seu projeto gestor-promocar
const firebaseConfig = {
  apiKey: "AIzaSyB3lg9bGROqCtrrKK3Oz18fNre2J0WiKPQ",
  authDomain: "gestor-promocar.firebaseapp.com",
  projectId: "gestor-promocar",
  storageBucket: "gestor-promocar.firebasestorage.app",
  messagingSenderId: "275169819326",
  appId: "1:275169819326:web:5f977576f8cc8edc057cef"
};

// Inicializa um app Firebase só para a rotina (não mexe no login)
const rotinaApp = initializeApp(firebaseConfig, "rotina-app");
const db = getFirestore(rotinaApp);

// ID do documento do dia: AAAA-MM-DD
function getIdDiaHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Carrega o estado da rotina do Firestore e "injeta" no app.js
async function carregarEstadoRotina() {
  try {
    const idDia = getIdDiaHoje();
    const ref = doc(db, "rotina", idDia);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      const estado = data.estado || {};
      if (window.__gpSetEstadoRotina) {
        window.__gpSetEstadoRotina(estado);
      }
    } else {
      // Se não existir, pega o estado atual (localStorage / padrão) e cria
      let estadoInicial = {};
      if (window.__gpGetEstadoRotina) {
        estadoInicial = window.__gpGetEstadoRotina();
      }
      await setDoc(ref, { estado: estadoInicial });
    }
  } catch (e) {
    console.error("Erro ao carregar rotina do dia no Firestore:", e);
  }
}

// Salva o estado atual da rotina no Firestore
async function salvarEstadoRotina() {
  try {
    if (!window.__gpGetEstadoRotina) return;

    const estadoAtual = window.__gpGetEstadoRotina();
    const idDia = getIdDiaHoje();
    const ref = doc(db, "rotina", idDia);

    await setDoc(ref, { estado: estadoAtual }, { merge: true });
    // console.log("Rotina do dia salva no Firestore");
  } catch (e) {
    console.error("Erro ao salvar rotina do dia no Firestore:", e);
  }
}

function iniciarSincronizacaoRotina() {
  // 1) Ao carregar a página, busca o estado do dia no Firestore
  carregarEstadoRotina();

  // 2) A cada 5s, envia o estado atual da rotina
  setInterval(() => {
    salvarEstadoRotina();
  }, 5000);
}

window.addEventListener("load", iniciarSincronizacaoRotina);

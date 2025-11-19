// =========================
// 🔥 IMPORTS DO FIREBASE
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// =========================
// 🔥 CONFIGURAÇÃO DO FIREBASE
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyB3lg9bGROqCtrrKK3Oz18fNre2J0WiKPQ",
  authDomain: "gestor-promocar.firebaseapp.com",
  projectId: "gestor-promocar",
  storageBucket: "gestor-promocar.firebasestorage.app",
  messagingSenderId: "275169819326",
  appId: "1:275169819326:web:5f977576f8cc8edc057cef"
};

// =========================
// 🔥 INICIALIZA APENAS 1 APP
// =========================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================
// 🗓️ FUNÇÃO: PEGAR ID DO DIA (AAAA-MM-DD)
// =========================
function getIdDiaHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// =========================
// 📥 CARREGAR ESTADO DA ROTINA
// =========================
async function carregarEstadoRotina() {
  try {
    const idDia = getIdDiaHoje();
    const ref = doc(db, "rotina", idDia);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      // Se existe no Firestore → injeta no app.js
      const data = snap.data();
      const estado = data.estado || {};

      if (window.__gpSetEstadoRotina) {
        window.__gpSetEstadoRotina(estado);
      }
    } else {
      // Cria documento novo
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

// =========================
// 💾 SALVAR ESTADO DA ROTINA
// =========================
async function salvarEstadoRotina() {
  try {
    if (!window.__gpGetEstadoRotina) return;

    const estadoAtual = window.__gpGetEstadoRotina();
    const idDia = getIdDiaHoje();
    const ref = doc(db, "rotina", idDia);

    await setDoc(ref, { estado: estadoAtual }, { merge: true });
  } catch (e) {
    console.error("Erro ao salvar rotina do dia no Firestore:", e);
  }
}

// =========================
// 🔄 SINCRONIZAÇÃO AUTOMÁTICA
// =========================
function iniciarSincronizacaoRotina() {
  carregarEstadoRotina();

  setInterval(() => {
    salvarEstadoRotina();
  }, 5000);
}

window.addEventListener("load", iniciarSincronizacaoRotina);

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Configuração do Firebase - Gestor Promocar
const firebaseConfig = {
  apiKey: "AIzaSyB3lg9bGROqCtrrKK3Oz18fNre2J0WiKPQ",
  authDomain: "gestor-promocar.firebaseapp.com",
  projectId: "gestor-promocar",
  storageBucket: "gestor-promocar.firebasestorage.app",
  messagingSenderId: "275169819326",
  appId: "1:275169819326:web:5f977576f8cc8edc057cef"
};

// Inicializa o app Firebase (apenas nesta página)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gera ID do documento do dia no formato AAAA-MM-DD
function getIdDiaHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Carrega o estado da rotina do Firestore e injeta no app.js
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
  } catch (e) {
    console.error("Erro ao salvar rotina do dia no Firestore:", e);
  }
}

// Inicializa sincronização
function iniciarSincronizacaoRotina() {
  carregarEstadoRotina();
  setInterval(salvarEstadoRotina, 5000);
}

window.addEventListener("load", iniciarSincronizacaoRotina);

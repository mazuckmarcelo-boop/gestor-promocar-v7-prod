
import { getApp, initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3lg9bGROqCtrrKK3Oz18fNre2J0WiKPQ",
  authDomain: "gestor-promocar.firebaseapp.com",
  projectId: "gestor-promocar",
  storageBucket: "gestor-promocar.firebasestorage.app",
  messagingSenderId: "275169819326",
  appId: "1:275169819326:web:5f977576f8cc8edc057cef"
};

let app;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}
const db = getFirestore(app);

function mapLocalToRemotePortais(estadoLocal) {
  const resultado = {};
  (estadoLocal || []).forEach((p) => {
    if (!p || !p.id) return;
    resultado[p.id] = {
      nome: p.nome || p.id,
      custo: Number(p.custo || 0),
      vencimento: p.vencimento || "",
      leads: Number(p.leads || 0),
      vendas: Number(p.vendas || 0),
      pago: !!p.pago,
    };
  });
  return resultado;
}

async function carregarPortaisDoFirestore() {
  try {
    const snap = await getDocs(collection(db, "portais"));

    if (snap.empty) {
      // Primeira vez: deixa o estado local criar os portais padrão
      return;
    }

    const estadoAtual = window.__gpGetPortaisEstado ? window.__gpGetPortaisEstado() : [];
    const porIdAtual = {};
    (estadoAtual || []).forEach((p) => {
      if (p && p.id) porIdAtual[p.id] = p;
    });

    const novos = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const id = docSnap.id;
      const base = porIdAtual[id] || {};
      novos.push({
        id,
        nome: data.nome || base.nome || id,
        custo: Number(data.custo ?? base.custo ?? 0),
        vencimento: data.vencimento || base.vencimento || "",
        leads: Number(data.leads ?? base.leads ?? 0),
        vendas: Number(data.vendas ?? base.vendas ?? 0),
        pago: typeof data.pago === "boolean" ? data.pago : !!base.pago,
      });
    });

    if (window.__gpSetPortaisEstado) {
      window.__gpSetPortaisEstado(novos);
    }
  } catch (e) {
    console.error("Erro ao carregar portais do Firestore:", e);
  }
}

async function salvarPortaisNoFirestore() {
  try {
    if (!window.__gpGetPortaisEstado) return;
    const estado = window.__gpGetPortaisEstado() || [];
    const remoto = mapLocalToRemotePortais(estado);

    const ops = Object.entries(remoto).map(([id, dados]) => {
      const ref = doc(db, "portais", id);
      return setDoc(ref, dados, { merge: true });
    });

    await Promise.all(ops);
  } catch (e) {
    console.error("Erro ao salvar portais no Firestore:", e);
  }
}

function iniciarSincronizacaoPortais() {
  carregarPortaisDoFirestore();
  setInterval(salvarPortaisNoFirestore, 15000);
}

window.addEventListener("load", iniciarSincronizacaoPortais);

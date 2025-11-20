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

function mapLocalToRemoteEstado(estadoLocal) {
  const resultado = {};
  Object.entries(estadoLocal || {}).forEach(([id, dados]) => {
    resultado[id] = {
      nome: dados.nome || id,
      vendas: Number(dados.vendas || 0),
      leads: Number(dados.leads || 0),
      ativo: true,
    };
  });
  return resultado;
}

async function carregarEquipeDoFirestore() {
  try {
    const snap = await getDocs(collection(db, "equipe"));
    const estadoAtual = window.__gpGetEquipeEstado ? window.__gpGetEquipeEstado() : {};
    const novoEstado = { ...estadoAtual };

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const id = docSnap.id;
      novoEstado[id] = {
        nome: data.nome || id,
        leads: Number(data.leads || 0),
        visitas: (estadoAtual[id] && estadoAtual[id].visitas) || 0,
        vendas: Number(data.vendas || 0),
      };
    });

    if (window.__gpSetEquipeEstado) {
      window.__gpSetEquipeEstado(novoEstado);
    }
  } catch (e) {
    console.error("Erro ao carregar equipe do Firestore:", e);
  }
}

async function salvarEquipeNoFirestore() {
  try {
    if (!window.__gpGetEquipeEstado) return;
    const estado = window.__gpGetEquipeEstado();
    const remoto = mapLocalToRemoteEstado(estado);

    const ops = Object.entries(remoto).map(([id, dados]) => {
      const ref = doc(db, "equipe", id);
      return setDoc(ref, dados, { merge: true });
    });

    await Promise.all(ops);
  } catch (e) {
    console.error("Erro ao salvar equipe no Firestore:", e);
  }
}

function iniciarSincronizacaoEquipe() {
  carregarEquipeDoFirestore();
  setInterval(salvarEquipeNoFirestore, 10000);
}

window.addEventListener("load", iniciarSincronizacaoEquipe);

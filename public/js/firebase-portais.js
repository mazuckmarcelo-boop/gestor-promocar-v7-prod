import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3lg9bGROqCtrrKK3Oz18fNre2J0WiKPQ",
  authDomain: "gestor-promocar.firebaseapp.com",
  projectId: "gestor-promocar",
  storageBucket: "gestor-promocar.firebasestorage.app",
  messagingSenderId: "275169819326",
  appId: "1:275169819326:web:5f977576f8cc8edc057cef"
};

function getFirebaseDb() {
  let app;
  const apps = getApps();
  if (apps.length) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  return getFirestore(app);
}

const db = getFirebaseDb();

// Mapa de IDs do Firestore para nomes bonitos exibidos no painel
const PORTAIS_ID_TO_NOME = {
  chaves_na_mao: "Chaves na Mão",
  facebook_instagram_ads: "Facebook e Instagram Ads",
  google_ads_trafego_pago: "Google Ads / Tráfego Pago",
  marketplace: "Marketplace",
  mercado_livre: "Mercado Livre",
  mobiauto: "Mobiauto",
  olx: "OLX",
  usadosbr: "UsadosBR",
  webmotors: "Webmotors",
  icarros: "iCarros"
};

// Mapa inverso: nome bonito -> ID do documento no Firestore
const PORTAIS_NOME_TO_ID = {};
for (const [id, nome] of Object.entries(PORTAIS_ID_TO_NOME)) {
  PORTAIS_NOME_TO_ID[nome] = id;
}

async function carregarPortaisDoFirestore() {
  try {
    if (typeof window.__gpGetPortais !== "function" || typeof window.__gpSetPortais !== "function") {
      return;
    }

    const snapshot = await getDocs(collection(db, "portais"));
    const dadosPorId = {};
    snapshot.forEach(docSnap => {
      dadosPorId[docSnap.id] = docSnap.data();
    });

    const atuais = window.__gpGetPortais();
    const atualizados = atuais.map(p => {
      const id = PORTAIS_NOME_TO_ID[p.nome];
      if (id && dadosPorId[id]) {
        const d = dadosPorId[id];
        return {
          ...p,
          custo: d.custo ?? 0,
          leads: d.leads ?? 0,
          vendas: d.vendas ?? 0
        };
      }
      return p;
    });

    window.__gpSetPortais(atualizados);
  } catch (e) {
    console.error("Erro ao carregar portais do Firestore:", e);
  }
}

async function salvarPortaisNoFirestore() {
  try {
    if (typeof window.__gpGetPortais !== "function") return;

    const lista = window.__gpGetPortais();
    const promessas = [];

    for (const p of lista) {
      const id = PORTAIS_NOME_TO_ID[p.nome];
      if (!id) continue;

      const ref = doc(db, "portais", id);
      const payload = {
        custo: Number(p.custo) || 0,
        leads: Number(p.leads) || 0,
        vendas: Number(p.vendas) || 0
      };
      promessas.push(setDoc(ref, payload, { merge: true }));
    }

    await Promise.all(promessas);
  } catch (e) {
    console.error("Erro ao salvar portais no Firestore:", e);
  }
}

function iniciarSincronizacaoPortais() {
  // Carrega do Firestore assim que possível
  carregarPortaisDoFirestore();

  // Expõe helper global para salvar imediatamente quando algo mudar
  window.__gpSyncPortaisNow = function () {
    salvarPortaisNoFirestore();
  };

  // Além disso, sincroniza periodicamente
  setInterval(() => {
    salvarPortaisNoFirestore();
  }, 10000);
}

window.addEventListener("load", iniciarSincronizacaoPortais);

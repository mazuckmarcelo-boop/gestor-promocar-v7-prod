import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3lg9bGROqCtrrKK3Oz18fNre2J0WiKPQ",
  authDomain: "gestor-promocar.firebaseapp.com",
  projectId: "gestor-promocar",
  storageBucket: "gestor-promocar.firebasestorage.app",
  messagingSenderId: "275169819326",
  appId: "1:275169819326:web:5f977576f8cc8edc057cef"
};

const appFB = initializeApp(firebaseConfig);
const db = getFirestore(appFB);

async function loadRotinaDia() {
  try {
    const hoje = new Date().toISOString().slice(0,10); // AAAA-MM-DD
    const ref = doc(db, "rotina", hoje);
    const snap = await getDoc(ref);
    let data;
    if (!snap.exists()) {
      data = { pendentes: 0, concluidas: 0, total: 0 };
      await setDoc(ref, data);
    } else {
      data = snap.data();
    }

    const pendEl = document.getElementById("status-dia-pendentes");
    const concEl = document.getElementById("status-dia-concluidas");
    const totEl  = document.getElementById("status-dia-total");

    if (pendEl) pendEl.innerText = data.pendentes ?? 0;
    if (concEl) concEl.innerText = data.concluidas ?? 0;
    if (totEl)  totEl.innerText  = data.total ?? 0;
  } catch (e) {
    console.error("Erro ao carregar rotina do dia no Firestore:", e);
  }
}

window.addEventListener("load", loadRotinaDia);

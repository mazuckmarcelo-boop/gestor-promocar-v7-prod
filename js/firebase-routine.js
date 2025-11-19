
import { getFirestore, doc, getDoc, setDoc } 
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";

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
  const hoje = new Date().toISOString().slice(0,10);
  const ref = doc(db, "rotina", hoje);
  const snap = await getDoc(ref);
  let data;
  if(!snap.exists()) {
    data = {pendentes:0, concluidas:0, total:0};
    await setDoc(ref, data);
  } else {
    data = snap.data();
  }
  if(document.getElementById("status-dia-pendentes"))
    document.getElementById("status-dia-pendentes").innerText = data.pendentes;
  if(document.getElementById("status-dia-concluidas"))
    document.getElementById("status-dia-concluidas").innerText = data.concluidas;
  if(document.getElementById("status-dia-total"))
    document.getElementById("status-dia-total").innerText = data.total;
}

window.addEventListener("load", loadRotinaDia);

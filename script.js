import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAt9aLIwKkxm1SeXlwXJ5tBXlvjMuIAR2M",
  authDomain: "weapp-af9e9.firebaseapp.com",
  projectId: "weapp-af9e9",
  storageBucket: "weapp-af9e9.firebasestorage.app",
  messagingSenderId: "985218671037",
  appId: "1:985218671037:web:12d49094139dca0dc272d4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

// --- 1. GESTION DES ÉCOUTEURS (EVENTS) ---
document.addEventListener('DOMContentLoaded', () => {
    // Boutons de navigation entre formulaires
    document.getElementById('go-register')?.addEventListener('click', () => basculerVue('inscription'));
    document.getElementById('go-login')?.addEventListener('click', () => basculerVue('connexion'));

    // Boutons d'action
    document.getElementById('btn-connexion')?.addEventListener('click', connexionEtudiant);
    document.getElementById('btn-inscription')?.addEventListener('click', inscriptionEtudiant);
    document.getElementById('btnPost')?.addEventListener('click', publierPost);
});

// --- 2. SURVEILLANCE DE L'ÉTAT DE CONNEXION ---
onAuthStateChanged(auth, (user) => {
    const loginSec = document.getElementById('login-section');
    const authSec = document.getElementById('auth-section');
    const mainNav = document.getElementById('nav-principale');
    const mainContent = document.getElementById('main-content');

    if (user) {
        loginSec.classList.add('hidden');
        authSec.classList.add('hidden');
        mainNav.classList.remove('hidden');
        mainContent.classList.remove('hidden');
        chargerProfilHaut(user.uid);
        chargerFilActualite();
    } else {
        loginSec.classList.remove('hidden');
        mainNav.classList.add('hidden');
        mainContent.classList.add('hidden');
    }
});

// --- 3. FONCTIONS D'AUTHENTIFICATION ---
async function connexionEtudiant() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    if (!email || !pass) return alert("Champs vides !");

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Erreur : Identifiants incorrects.");
    }
}

async function inscriptionEtudiant() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const nom = document.getElementById('nom').value;
    const classe = document.getElementById('classe').value;
    const filiere = document.getElementById('filiere').value;
    const bio = document.getElementById('bio').value;

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "etudiants", res.user.uid), {
            uid: res.user.uid,
            nom_complet: nom,
            classe: classe,
            filiere: filiere,
            bio: bio,
            photo_url: "" 
        });
    } catch (error) {
        alert("Erreur d'inscription : " + error.message);
    }
}

// --- 4. CŒUR DE L'APPLICATION (POSTS & PROFIL) ---
async function publierPost() {
    const texte = document.getElementById('postInput').value;
    const file = document.getElementById('fileInput').files[0];
    const user = auth.currentUser;

    if (!texte && !file) return;

    let mediaUrl = "";
    try {
        if (file) {
            const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
            const snap = await uploadBytes(storageRef, file);
            mediaUrl = await getDownloadURL(snap.ref);
        }

        const userDoc = await getDoc(doc(db, "etudiants", user.uid));
        const userData = userDoc.data();

        await addDoc(collection(db, "posts"), {
            auteur: userData.nom_complet,
            photo_auteur: userData.photo_url || DEFAULT_AVATAR,
            contenu: texte,
            media: mediaUrl,
            type: file ? file.type.split('/')[0] : 'texte',
            timestamp: new Date()
        });

        document.getElementById('postInput').value = "";
        document.getElementById('fileInput').value = "";
    } catch (e) {
        console.error(e);
    }
}

function chargerFilActualite() {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        const feed = document.getElementById('newsfeed');
        feed.innerHTML = "";
        snapshot.forEach((doc) => {
            const p = doc.data();
            const media = p.media ? (p.type === 'image' ? `<img src="${p.media}">` : `<video src="${p.media}" controls></video>`) : "";
            
            feed.innerHTML += `
                <div class="card post-card">
                    <div class="post-header">
                        <img src="${p.photo_auteur}" onerror="this.src='${DEFAULT_AVATAR}'" class="avatar">
                        <div class="post-meta">
                            <strong>${p.auteur}</strong>
                            <span>${p.timestamp?.toDate().toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="post-body">${p.contenu}</div>
                    ${media}
                </div>
            `;
        });
    });
}

async function chargerProfilHaut(uid) {
    const snap = await getDoc(doc(db, "etudiants", uid));
    const header = document.getElementById('user-header-profile');
    if (snap.exists() && header) {
        const d = snap.data();
        header.innerHTML = `
            <div class="profile-summary card">
                <img src="${d.photo_url || DEFAULT_AVATAR}" onerror="this.src='${DEFAULT_AVATAR}'" class="avatar-lg">
                <div class="profile-info">
                    <h2>${d.nom_complet}</h2>
                    <p>${d.classe} | ${d.filiere}</p>
                </div>
            </div>
        `;
    }
}

function basculerVue(vue) {
    document.getElementById('login-section').classList.toggle('hidden', vue === 'inscription');
    document.getElementById('auth-section').classList.toggle('hidden', vue === 'connexion');
}

// ===============================
// 🔥 CONFIG FIREBASE
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "weapp-af9e9.firebaseapp.com",
    projectId: "weapp-af9e9",
    storageBucket: "weapp-af9e9.appspot.com",
    messagingSenderId: "985218671037",
    appId: "1:985218671037:web:..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

// ===============================
// 🧠 UTILITAIRES
// ===============================
const $ = (id) => document.getElementById(id);

const toggle = (el, show) => {
    if (!el) return;
    el.style.display = show ? "block" : "none";
};

const showAlert = (msg) => alert(msg);

// ===============================
// 🔐 AUTH STATE
// ===============================
onAuthStateChanged(auth, async (user) => {
    toggle($('login-section'), !user);
    toggle($('auth-section'), false);
    toggle($('nav-principale'), !!user);
    toggle($('main-content'), !!user);

    if (user) {
        await loadUserProfile(user.uid);
        loadFeed();
    }
});

// ===============================
// 🔑 AUTHENTIFICATION
// ===============================
async function login(email, password) {
    if (!email || !password) {
        return showAlert("Remplis tous les champs.");
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        console.error(err);
        showAlert("Connexion échouée.");
    }
}

async function register(data) {
    const { email, password, nom, classe, filiere, bio } = data;

    if (!email || !password || !nom) {
        return showAlert("Champs obligatoires manquants.");
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "etudiants", cred.user.uid), {
            uid: cred.user.uid,
            nom_complet: nom,
            classe,
            filiere,
            bio,
            email,
            photo_url: "",
            createdAt: serverTimestamp()
        });

        showAlert("Compte créé !");
    } catch (err) {
        console.error(err);
        showAlert("Erreur inscription.");
    }
}

// ===============================
// 👤 PROFIL
// ===============================
async function loadUserProfile(uid) {
    try {
        const snap = await getDoc(doc(db, "etudiants", uid));
        if (!snap.exists()) return;

        const user = snap.data();
        const container = $('user-header-profile');

        container.innerHTML = `
            <div class="user-bar">
                <img src="${user.photo_url || DEFAULT_AVATAR}" 
                     onerror="this.src='${DEFAULT_AVATAR}'" />

                <div>
                    <strong>${user.nom_complet}</strong>
                    <small>${user.classe || ""} - ${user.filiere || ""}</small>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Profil error:", err);
    }
}

// ===============================
// 📝 PUBLICATION
// ===============================
async function createPost() {
    const user = auth.currentUser;
    if (!user) return;

    const text = $('postInput').value.trim();
    const file = $('fileInput').files[0];

    if (!text && !file) return;

    try {
        let mediaUrl = "";
        let type = "texte";

        if (file) {
            const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
            const snap = await uploadBytes(storageRef, file);
            mediaUrl = await getDownloadURL(snap.ref);
            type = file.type.startsWith("image") ? "image" : "video";
        }

        const userSnap = await getDoc(doc(db, "etudiants", user.uid));
        const userData = userSnap.data();

        await addDoc(collection(db, "posts"), {
            auteur: userData.nom_complet,
            photo_auteur: userData.photo_url || DEFAULT_AVATAR,
            contenu: text,
            media: mediaUrl,
            type,
            uid: user.uid,
            createdAt: serverTimestamp()
        });

        $('postInput').value = "";
        $('fileInput').value = "";

    } catch (err) {
        console.error("Post error:", err);
        showAlert("Erreur publication.");
    }
}

// ===============================
// 📰 FIL D’ACTUALITÉ
// ===============================
function loadFeed() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snap) => {
        const container = $('newsfeed');
        container.innerHTML = "";

        snap.forEach(docSnap => {
            const p = docSnap.data();

            const media = p.media
                ? (p.type === "image"
                    ? `<img src="${p.media}" />`
                    : `<video src="${p.media}" controls></video>`)
                : "";

            const date = p.createdAt?.toDate()?.toLocaleString() || "";

            container.innerHTML += `
                <div class="post-card">
                    <div class="post-header">
                        <img src="${p.photo_auteur}" 
                             onerror="this.src='${DEFAULT_AVATAR}'"/>
                        <div>
                            <strong>${p.auteur}</strong>
                            <small>${date}</small>
                        </div>
                    </div>

                    <p>${p.contenu}</p>
                    ${media}
                </div>
            `;
        });
    });
}

// ===============================
// 🎯 EVENTS (PROPRE)
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    $('login-form')?.addEventListener("submit", (e) => {
        e.preventDefault();
        login($('loginEmail').value, $('loginPass').value);
    });

    $('register-form')?.addEventListener("submit", (e) => {
        e.preventDefault();
        register({
            nom: $('nom').value,
            classe: $('classe').value,
            filiere: $('filiere').value,
            bio: $('bio').value,
            email: $('email').value,
            password: $('password').value
        });
    });

    $('btnPost')?.addEventListener("click", createPost);

    $('go-register')?.addEventListener("click", () => {
        toggle($('login-section'), false);
        toggle($('auth-section'), true);
    });

    $('go-login')?.addEventListener("click", () => {
        toggle($('login-section'), true);
        toggle($('auth-section'), false);
    });

});

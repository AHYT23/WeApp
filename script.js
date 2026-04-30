import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

// --- 1. GESTION DE L'ÉTAT DE CONNEXION ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Utilisateur connecté : On affiche l'interface intérieure
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('user-profile-area').style.display = 'block';
        document.getElementById('main-feed').style.display = 'block';
        document.getElementById('nav-search').style.display = 'block';
        
        chargerProfilUtilisateur(user.uid);
        chargerStories();
    } else {
        // Déconnecté : On affiche la connexion par défaut
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('user-profile-area').style.display = 'none';
        document.getElementById('main-feed').style.display = 'none';
    }
});

// --- 2. INSCRIPTION & CONNEXION ---
window.basculerVue = function(vue) {
    if (vue === 'connexion') {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('login-section').style.display = 'none';
    }
};

window.inscriptionEtudiant = async function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const nom = document.getElementById('nom').value;
    const classe = document.getElementById('classe').value;
    const filiere = document.getElementById('filiere').value;
    const bio = document.getElementById('bio').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        // Création du profil dans Firestore
        await setDoc(doc(db, "etudiants", user.uid), {
            uid: user.uid,
            nom_complet: nom,
            classe: classe,
            filiere: filiere,
            bio: bio,
            email: email,
            photo_url: "https://via.placeholder.com/150",
            dateCreation: new Date()
        });

        alert("Bienvenue sur weApp !");
    } catch (error) {
        alert("Erreur d'inscription : " + error.message);
    }
};

window.connexionEtudiant = async function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // Le onAuthStateChanged s'occupe du reste
    } catch (error) {
        alert("Erreur : " + error.message);
    }
};

// --- 3. PROFIL ET PERSONNALISATION ---
async function chargerProfilUtilisateur(uid) {
    const docRef = doc(db, "etudiants", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const resultsDiv = document.getElementById('results');
        
        resultsDiv.innerHTML = `
            <div class="card profile-main-card">
                <div class="profile-banner" style="height:80px; background:linear-gradient(to right, #FF0000, #b30000); border-radius:12px 12px 0 0;"></div>
                <img src="${data.photo_url}" style="width:100px; height:100px; border-radius:50%; border:4px solid white; margin-top:-50px; background:white; object-fit:cover;">
                <div style="padding:15px;">
                    <h2 style="margin:5px 0;">${data.nom_complet}</h2>
                    <p style="color:#666; font-weight:600;">${data.classe} - ${data.filiere}</p>
                    <p style="font-style:italic; margin:10px 0;">"${data.bio || ''}"</p>
                </div>
            </div>
        `;
        // Pré-remplir le formulaire de modification
        document.getElementById('editBio').value = data.bio || "";
    }
}

window.enregistrerModifsProfil = async function() {
    const user = auth.currentUser;
    const nouvelleBio = document.getElementById('editBio').value;
    const file = document.getElementById('profilePicInput').files[0];
    let photoUrl = null;

    try {
        if (file) {
            const storageRef = ref(storage, `profils/${user.uid}`);
            const snapshot = await uploadBytes(storageRef, file);
            photoUrl = await getDownloadURL(snapshot.ref);
        }

        const updates = { bio: nouvelleBio };
        if (photoUrl) updates.photo_url = photoUrl;

        await setDoc(doc(db, "etudiants", user.uid), updates, { merge: true });
        alert("Profil mis à jour !");
        document.getElementById('edit-profile-section').style.display = 'none';
        chargerProfilUtilisateur(user.uid);
    } catch (error) {
        alert("Erreur de mise à jour : " + error.message);
    }
};

// --- 4. SYSTÈME DE STORIES ---
window.publierStory = async function() {
    const texte = document.getElementById('storyInput').value;
    const user = auth.currentUser;
    if (!texte) return;

    const userDoc = await getDoc(doc(db, "etudiants", user.uid));
    const userData = userDoc.data();

    await addDoc(collection(db, "stories"), {
        auteur: userData.nom_complet,
        photo_auteur: userData.photo_url,
        contenu: texte,
        timestamp: new Date(),
        uid: user.uid
    });

    document.getElementById('storyInput').value = "";
};

function chargerStories() {
    const q = query(collection(db, "stories"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('stories-container');
        container.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            container.innerHTML += `
                <div class="story-card card" style="margin-top:15px; padding:15px; border-radius:12px;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                        <img src="${data.photo_auteur}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                        <div>
                            <div style="font-weight:bold; color:#FF0000;">${data.auteur}</div>
                            <small style="color:#999;">${data.timestamp?.toDate().toLocaleString()}</small>
                        </div>
                    </div>
                    <div style="line-height:1.5;">${data.contenu}</div>
                </div>
            `;
        });
    });
}

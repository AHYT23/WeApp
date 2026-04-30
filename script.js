import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, query, where, getDocs, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAt9aLIwKkxm1SeXlwXJ5tBXlvjMuIAR2M",
  authDomain: "weapp-af9e9.firebaseapp.com",
  projectId: "weapp-af9e9",
  storageBucket: "weapp-af9e9.firebasestorage.app",
  messagingSenderId: "985218671037",
  appId: "1:985218671037:web:12d49094139dca0dc272d4",
  measurementId: "G-4N05PMLSVT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- 1. GESTION DES VUES ---
window.basculerVue = function(vue) {
    const authSection = document.getElementById('auth-section');
    const loginSection = document.getElementById('login-section');
    if (vue === 'connexion') {
        authSection.style.display = 'none';
        loginSection.style.display = 'block';
    } else {
        authSection.style.display = 'block';
        loginSection.style.display = 'none';
    }
};

// --- 2. INSCRIPTION ---
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
        await sendEmailVerification(user);
        await setDoc(doc(db, "etudiants", user.uid), {
            uid: user.uid,
            nom_complet: nom,
            classe: classe,
            filiere: filiere,
            bio: bio,
            email: email,
            abonnes: 0,
            photo_url: "https://via.placeholder.com/150"
        });
        alert("Compte créé ! On a ignoré la validation pour ce test.");
    } catch (error) {
        alert("Erreur : " + error.message);
    }
};

// --- 3. CONNEXION INSTANTANÉE (RÉGLE LE PROBLÈME DE LENTEUR) ---
window.connexionEtudiant = async function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // On ignore la vérification emailVerified pour que tu puisses entrer direct !
        if (user) { 
            alert("Connexion réussie ! Bienvenue sur ton espace weApp.");
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('auth-section').style.display = 'none';
            // Ici tu peux lancer une fonction pour charger ton profil
        }
    } catch (error) {
        alert("Erreur de connexion : " + error.message);
    }
};

// --- 4. ENVOI DE MÉDIAS HD ET ÉMOTIONS ---
window.envoyerMessageAvecEmotion = async function(texte, emotion = "") {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "messages"), {
        expediteur: user.uid,
        texte: texte,
        emotion: emotion,
        timestamp: new Date()
    });
};

window.envoyerFichierHD = async function(file) {
    const user = auth.currentUser;
    if (!user) return;

    const storageRef = ref(storage, `uploads/${user.uid}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, "messages"), {
        expediteur: user.uid,
        mediaUrl: url,
        type: file.type.startsWith('image') ? 'image' : 'video',
        timestamp: new Date()
    });
    alert("Fichier HD envoyé !");
};

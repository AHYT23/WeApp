import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

// --- 1. GESTION DES VUES (INSCRIPTION / CONNEXION) ---
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

    if (!email || !pass || !nom) return alert("Remplis les champs obligatoires !");

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
            abonnes: 0,
            abonnements: 0,
            email: email,
            photo_url: "https://via.placeholder.com/150"
        });

        alert("Compte créé ! Vérifie tes mails (Spams) pour valider.");
    } catch (error) {
        alert("Erreur : " + error.message);
    }
};

// --- 3. CONNEXION ---
window.connexionEtudiant = async function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        if (user.emailVerified) {
            alert("Bienvenue sur weApp !");
            document.getElementById('login-section').style.display = 'none';
            // Ici tu peux charger le profil de l'utilisateur
        } else {
            alert("Ton mail n'est pas encore validé. Regarde tes messages !");
        }
    } catch (error) {
        alert("Erreur : " + error.message);
    }
};

// --- 4. RECHERCHE D'ÉTUDIANTS ---
window.chercherEtudiant = async function() {
    const term = document.getElementById('searchInp').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "Recherche en cours...";

    const q = query(collection(db, "etudiants"), where("nom_complet", "==", term));
    const querySnapshot = await getDocs(q);
    
    resultsDiv.innerHTML = "";
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        resultsDiv.innerHTML += `
            <div class="user-card card">
                <h3>${data.nom_complet}</h3>
                <p><strong>${data.classe}</strong> - ${data.filiere}</p>
                <p>${data.bio}</p>
                <div class="stats">
                    <span>${data.abonnes} Abonnés</span> | <span>${data.abonnements} Abonnements</span>
                </div>
                <button class="btn-main" onclick="ouvrirChat('${data.uid}')">Discuter</button>
            </div>
        `;
    });
};

// --- 5. ENVOI MÉDIAS HD ---
window.envoyerMedia = async function(file) {
    const user = auth.currentUser;
    if (!user) return;

    const storageRef = ref(storage, `medias/${user.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "messages"), {
        expediteur: user.uid,
        url: url,
        type: file.type.startsWith('image') ? 'image' : 'video',
        timestamp: new Date()
    });
};

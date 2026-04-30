import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Ta configuration Firebase (issue de tes captures d'écran)
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

// --- 1. INSCRIPTION AVEC VALIDATION AUTOMATIQUE ---
window.inscriptionEtudiant = async function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const nom = document.getElementById('nom').value;
    const classe = document.getElementById('classe').value;
    const filiere = document.getElementById('filiere').value;
    const naissance = document.getElementById('dateNaissance').value;
    const bio = document.getElementById('bio').value;

    if (!email || !pass || !nom) return alert("Veuillez remplir les champs obligatoires.");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Envoi du lien de validation automatique
        await sendEmailVerification(user);

        // Création du profil (Données publiques + compteurs)
        await setDoc(doc(db, "etudiants", user.uid), {
            uid: user.uid,
            nom_complet: nom,
            classe: classe,
            filiere: filiere,
            bio: bio,
            date_naissance: naissance, // Information gardée en base mais non affichée
            abonnes: 0,
            abonnements: 0,
            email: email,
            photo_url: "https://via.placeholder.com/150"
        });

        alert("Inscription réussie ! Un lien de validation a été envoyé à : " + email);
    } catch (error) {
        alert("Erreur : " + error.message);
    }
};

// --- 2. ENVOI DE MÉDIAS HD (Photos, Vidéos, Vocaux) ---
window.envoyerMedia = async function(file, typeChat) {
    const user = auth.currentUser;
    if (!user) return alert("Connectez-vous pour envoyer un fichier.");

    try {
        const storageRef = ref(storage, `chats/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        // Enregistre le lien du média dans la messagerie
        await addDoc(collection(db, "messages"), {
            expediteur: user.uid,
            type: typeChat, // 'image', 'video', ou 'audio'
            media_url: url,
            timestamp: new Date()
        });
    } catch (e) {
        console.error("Erreur d'envoi média :", e);
    }
};

// --- 3. SUPPRESSION DE MESSAGE ---
window.supprimerMessage = async function(messageId) {
    if (confirm("Voulez-vous vraiment supprimer ce message ?")) {
        try {
            await deleteDoc(doc(db, "messages", messageId));
            alert("Message supprimé.");
        } catch (e) {
            alert("Erreur lors de la suppression.");
        }
    }
};

// --- 4. RECHERCHE D'ÉTUDIANTS ---
window.chercherEtudiant = async function() {
    const term = document.getElementById('searchInp').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "Recherche...";

    const q = query(collection(db, "etudiants"), where("nom_complet", "==", term));
    const querySnapshot = await getDocs(q);
    
    resultsDiv.innerHTML = "";
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        resultsDiv.innerHTML += `
            <div class="user-card card">
                <h3>${data.nom_complet}</h3>
                <p><strong>Classe :</strong> ${data.classe} | <strong>Filière :</strong> ${data.filiere}</p>
                <p><em>${data.bio}</em></p>
                <div class="stats">
                    <span>👥 ${data.abonnes} Abonnés</span> | <span>👤 ${data.abonnements} Abonnements</span>
                </div>
                <button onclick="ouvrirChat('${data.uid}')">Envoyer un message</button>
            </div>
        `;
    });
};

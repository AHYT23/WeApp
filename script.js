<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>weApp - Campus IIPEA</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>

    <!-- 1. HAUT DE PAGE (TOP BAR) -->
    <nav class="top-bar">
        <div class="logo-weapp">weApp</div>
        <div class="search-box">
            <input type="text" id="searchInp" placeholder="Rechercher un étudiant...">
        </div>
        <div class="nav-icons-top">
            <button class="btn-icon" title="Messages Privés">💬</button>
        </div>
    </nav>

    <!-- 2. BARRE DE NAVIGATION (ICONES) -->
    <nav class="main-nav" id="nav-principale" style="display:none;">
        <div class="nav-item active" onclick="changerOnglet('accueil')">
            <span class="icon">🏠</span>
            <span class="label">Accueil</span>
        </div>
        <div class="nav-item" onclick="changerOnglet('amis')">
            <span class="icon">👥</span>
            <span class="label">Amis</span>
        </div>
        <div class="nav-item" onclick="changerOnglet('notifs')">
            <span class="icon">🔔</span>
            <span class="label">Notifications</span>
        </div>
    </nav>

    <main class="container">

        <!-- ÉCRAN DE CONNEXION (S'affiche en premier) -->
        <section id="login-section" class="card">
            <div class="card-header">
                <h2>Connexion</h2>
                <p>Accédez au réseau de l'IIPEA</p>
            </div>
            <div class="input-group">
                <input type="email" id="loginEmail" placeholder="Email (ex: henoc201@outlook.fr)">
            </div>
            <div class="input-group">
                <input type="password" id="loginPass" placeholder="Mot de passe">
            </div>
            <button class="btn-main" onclick="connexionEtudiant()">Se connecter</button>
            <p class="switch-auth">Pas de compte ? <span onclick="basculerVue('inscription')">S'inscrire</span></p>
        </section>

        <!-- ÉCRAN D'INSCRIPTION (Caché par défaut) -->
        <section id="auth-section" class="card" style="display:none;">
            <h2>Rejoindre weApp</h2>
            <input type="text" id="nom" placeholder="Nom Complet">
            <input type="text" id="classe" placeholder="Classe (ex: L2 SEG)">
            <input type="text" id="filiere" placeholder="Filière (ex: Économie)">
            <textarea id="bio" placeholder="Ta bio..."></textarea>
            <input type="email" id="email" placeholder="Email">
            <input type="password" id="password" placeholder="Mot de passe">
            <button class="btn-main" onclick="inscriptionEtudiant()">Créer mon compte</button>
            <p class="switch-auth">Déjà inscrit ? <span onclick="basculerVue('connexion')">Se connecter</span></p>
        </section>

        <!-- ZONE DE PUBLICATION (Visible une fois connecté) -->
        <div id="main-content" style="display:none;">
            
            <!-- PROFIL RAPIDE (Fix pour la photo qui ne passe pas) -->
            <div id="user-header-profile"></div>

            <section id="publication-area" class="card">
                <div class="post-input-container">
                    <textarea id="postInput" placeholder="Quoi de neuf sur le campus ?"></textarea>
                </div>
                <div class="post-actions">
                    <!-- Remplacement de la partie story par l'icône image -->
                    <label for="fileInput" class="icon-upload">
                        <span class="icon-pic">🖼️</span> Ajouter une Photo/Vidéo
                    </label>
                    <input type="file" id="fileInput" style="display:none" accept="image/*,video/*">
                    <button class="btn-post" onclick="publierPost()">Publier</button>
                </div>
            </section>

            <!-- FIL D'ACTUALITÉ -->
            <div id="newsfeed"></div>
        </div>

    </main>

    <script type="module" src="script.js"></script>
</body>
</html>

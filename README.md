# 🎥 JustStreamIt

## 📄 Description

JustStreamIt est une application web qui permet de consulter des informations sur des films. Cette application utilise une API REST locale (OCMovies-API) pour fournir des informations cinématographiques.

## 🛠️ Installation et Lancement

### Prérequis

- 🐍 Python 3.x
- 📦 Node.js et npm
- 🐙 Git

### Installation du Backend (OCMovies-API)

1. **Cloner le dépôt du backend**

    
    git clone https://github.com/OpenClassrooms-Student-Center/OCMovies-API-EN-FR.git

    cd OCMovies-API-EN-FR
    

2. **Créer un environnement virtuel**

    Sous Windows :

    
    python -m venv env

    env\Scripts\activate
    

    Sous MacOS/Linux :

    
    python3 -m venv env

    source env/bin/activate
   

3. **Installer les dépendances**

    
    pip install -r requirements.txt
    

4. **Créer et alimenter la base de données**

    
    python manage.py create_db
   

5. **Démarrer le serveur**

    
    python manage.py runserver
    

    L'API sera disponible à l'adresse : `http://localhost:8000/api/v1/`.

### Installation du Frontend (JustStreamIt)

1. **Cloner le dépôt du frontend**

    
    git clone https://github.com/VincentDesmouceaux/projet6.git

    cd projet6
    

2. **Installer les dépendances Node.js**

    
    npm install
    

3. **Lancer le serveur SCSS pour le développement**

    Si vous souhaitez développer avec SCSS, vous pouvez lancer la commande suivante pour surveiller les changements SCSS et les compiler automatiquement en CSS :

    
    npm run scss
    

4. **Utiliser Live Server**

    Pour un développement plus fluide, vous pouvez utiliser l'extension Live Server de Visual Studio Code pour lancer un serveur de développement local qui actualisera automatiquement les modifications. Installez l'extension et cliquez sur "Go Live" dans le coin inférieur droit de Visual Studio Code.

### 🗂️ Structure du Projet

```
.
├── css
│   ├── app.css
│   ├── app.scss
│   └── ...
├── img
│   └── juststreamiy.png
├── js
│   └── app.js
├── index.html
├── package.json
└── README.md
```


## 🌟 Fonctionnalités

- 🎬 Affichage du meilleur film.
- ⭐ Affichage des films les mieux notés.
- 🎭 Affichage des films par catégories (Action, Comédie, etc.).
- 🎚️ Sélection de films par genre via un menu déroulant.
- 🔍 Boutons "Voir plus" pour afficher plus de films dans chaque section.
- 📝 Détails des films affichés dans une modal (désactivé sur les écrans de 480px de largeur ou moins).

## 📡 API

L'API OCMovies fournit des points d'entrée en lecture seule pour consulter des informations sur les films. Voici quelques exemples d'URL :

- Obtenir les films les mieux notés : `http://localhost:8000/api/v1/titles?sort_by=-imdb_score`
- Obtenir les films par genre : `http://localhost:8000/api/v1/titles?genre=Action`
- Obtenir les détails d'un film : `http://localhost:8000/api/v1/titles/{id}`

Consultez la documentation de l'API pour plus de détails.

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour signaler un problème ou proposer une amélioration, veuillez créer une issue ou une pull request sur le dépôt GitHub.

---

Merci d'utiliser JustStreamIt ! Pour toute question ou assistance, n'hésitez pas à contacter les mainteneurs du projet. 🎉

/**
 * Script principal pour l'application JustStreamIt.
 * Ce script gère l'affichage des films, des catégories et des détails des films via des requêtes API.
 */
document.addEventListener('DOMContentLoaded', () => {
    const apiBaseURL = 'http://127.0.0.1:8000/api/v1/titles/';
    const genresURL = 'http://127.0.0.1:8000/api/v1/genres/';
    const defaultImageUrl = 'img/icon-image-not-found-free-vector.jpg';

    const state = {
        'top-rated-movies-list': { page1: 1, page2: 2 },
        'category-1-list': { page1: 1, page2: 2 },
        'category-2-list': { page1: 1, page2: 2 },
        'custom-category-list': { page1: 1, page2: 2 },
        'genres': { page: 1 }
    };

    const container = document.querySelector('.container');

    // Récupérer et afficher le meilleur film
    const bestFilmsUrl = `${apiBaseURL}?sort_by=-imdb_score&limit=1`;
    fetchAndDisplayBestMovie(bestFilmsUrl);

    // Initialiser les films les mieux notés
    initMoviesWithPagination(`${apiBaseURL}?sort_by=-imdb_score&limit=5`, 'top-rated-movies-list', 6);

    // Initialiser les films de la catégorie 1 (Action)
    initMoviesWithPagination(`${apiBaseURL}?genre=Action&sort_by=-imdb_score&limit=5`, 'category-1-list', 6);

    // Initialiser les films de la catégorie 2 (Comédie)
    initMoviesWithPagination(`${apiBaseURL}?genre=Comedy&sort_by=-imdb_score&limit=5`, 'category-2-list', 6);

    // Récupérer et afficher les genres dans la liste déroulante
    fetchGenres(genresURL);

    // Récupérer et afficher les films de la catégorie personnalisée en fonction de la sélection de l'utilisateur
    document.getElementById('category-select').addEventListener('change', async (event) => {
        const selectedGenre = event.target.value;
        state['custom-category-list'] = { page1: 1, page2: 2 };  // Réinitialiser l'état de la page pour la catégorie personnalisée
        await initMoviesWithPagination(`${apiBaseURL}?genre=${selectedGenre}&sort_by=-imdb_score&limit=5`, 'custom-category-list', 6);
        updateShowCustomButtonVisibility('custom-category-list');
    });

    /**
     * Récupérer et afficher le meilleur film.
     * @param {string} url - L'URL pour récupérer le meilleur film.
     */
    async function fetchAndDisplayBestMovie(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const movie = data.results[0];
            const theBestFilmDetailUrl = `${apiBaseURL}${movie.id}`;
            const detailResponse = await fetch(theBestFilmDetailUrl);
            const detailData = await detailResponse.json();
            const imageUrl = await getValidImageUrl(movie.image_url, defaultImageUrl);
            document.getElementById('best-movie-img').src = imageUrl;
            document.getElementById('best-movie-title').textContent = movie.title;
            document.getElementById('best-movie-summary').textContent = detailData.long_description;
            document.getElementById('best-movie-details-btn').dataset.id = movie.id;
        } catch (error) {
            // Gestion silencieuse des erreurs
        }
    }

    /**
     * Initialiser les films avec pagination.
     * @param {string} url - L'URL pour récupérer les films.
     * @param {string} elementId - L'ID de l'élément pour afficher les films.
     * @param {number} limit - Le nombre de films à afficher.
     */
    async function initMoviesWithPagination(url, elementId, limit) {
        const container = document.getElementById(elementId);
        const showMoreBtn = document.querySelector(`.show-more[data-target="${elementId}"]`);

        async function fetchMovies(reset = false) {
            if (reset) {
                state[elementId] = { page1: 1, page2: 2 };
            }

            let { page1, page2 } = state[elementId];

            let displayedMovies = 0;
            try {
                container.innerHTML = '';  // Vider le conteneur avant de récupérer de nouveaux films

                for (const page of [page1, page2]) {
                    const response = await fetch(`${url}&page=${page}`);
                    const data = await response.json();

                    const moviesWithValidatedImages = await Promise.all(data.results.map(async (movie) => {
                        const imageUrl = await getValidImageUrl(movie.image_url, defaultImageUrl);
                        movie.image_url = imageUrl;
                        return movie;
                    }));

                    for (const movie of moviesWithValidatedImages) {
                        if (displayedMovies >= limit) break;
                        displayMovie(movie, elementId);
                        displayedMovies++;
                    }

                    if (!data.next) break; // Sortir si il n'y a plus de pages
                }
                state[elementId].page1 += 2;
                state[elementId].page2 += 2; // Mettre à jour l'état des pages

                // Afficher ou masquer le bouton "Voir plus" en fonction du nombre de films affichés
                await updateShowMoreButtonVisibility(elementId, showMoreBtn);
            } catch (error) {
                // Gestion silencieuse des erreurs
            }
        }

        // Récupération initiale
        await fetchMovies(true);

        // Ajouter un écouteur d'événements pour le bouton "Voir plus"
        showMoreBtn.addEventListener('click', () => {
            if (showMoreBtn.textContent === "Voir plus") {
                container.classList.add('show-all');
                showMoreBtn.textContent = "Voir moins";
            } else {
                container.classList.remove('show-all');
                showMoreBtn.textContent = "Voir plus";
            }
        });
    }

    /**
     * Récupérer les genres et remplir la liste déroulante.
     * @param {string} url - L'URL pour récupérer les genres.
     */
    async function fetchGenres(url) {
        const categorySelect = document.getElementById('category-select');
        categorySelect.innerHTML = '';  // Vider les options existantes

        async function fetchAllGenres(page = 1) {
            try {
                const response = await fetch(`${url}?page=${page}`);
                const data = await response.json();
                data.results.forEach(genre => {
                    const option = document.createElement('option');
                    option.value = genre.name;
                    option.textContent = genre.name;
                    categorySelect.appendChild(option);
                });

                if (data.next) {
                    await fetchAllGenres(page + 1);
                }
            } catch (error) {
                // Gestion silencieuse des erreurs
            }
        }

        fetchAllGenres();
    }

    /**
     * Valider et retourner une URL d'image valide.
     * @param {string} url - L'URL de l'image.
     * @param {string} defaultImageUrl - L'URL de l'image par défaut à utiliser si l'URL d'origine est invalide.
     * @returns {Promise<string>} - Une promesse qui se résout en une URL d'image valide.
     */
    async function getValidImageUrl(url, defaultImageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => resolve(defaultImageUrl);
            img.src = url;
        });
    }

    /**
     * Afficher un film dans l'élément spécifié.
     * @param {Object} movie - L'objet film à afficher.
     * @param {string} elementId - L'ID de l'élément pour afficher le film.
     */
    function displayMovie(movie, elementId) {
        const container = document.getElementById(elementId);
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie-item');
        movieElement.innerHTML = `
            <img src="${movie.image_url}" alt="${movie.title}">
            <div class="movie-overlay">
                <h3>${movie.title}</h3>
                <button data-id="${movie.id}" class="details-btn">Détails</button>
            </div>
        `;

        const imgElement = movieElement.querySelector('img');
        imgElement.onerror = function() {
            this.src = defaultImageUrl;
        };

        container.appendChild(movieElement);
    }

    /**
     * Mettre à jour la visibilité du bouton "Voir plus" en fonction du nombre de films affichés.
     * @param {string} elementId - L'ID de l'élément contenant les films.
     * @param {HTMLElement} showMoreBtn - L'élément du bouton "Voir plus".
     */
    async function updateShowMoreButtonVisibility(elementId, showMoreBtn) {
        const container = document.getElementById(elementId);
        const movieItems = container.querySelectorAll('.movie-item');
        if (movieItems.length > 0) {
            showMoreBtn.style.display = 'block';
        } else {
            showMoreBtn.style.display = 'none';
        }
    }

    /**
     * Mettre à jour la visibilité du bouton "Voir plus" personnalisé en fonction du nombre de films de la catégorie personnalisée affichés.
     * @param {string} elementId - L'ID de l'élément contenant les films de la catégorie personnalisée.
     */
    async function updateShowCustomButtonVisibility(elementId) {
        const container = document.getElementById(elementId);
        const movieItems = container.querySelectorAll('.movie-item');
        const showCustomButton = document.getElementById('show-custom-button');
        if (movieItems.length > 0) {
            showCustomButton.style.display = 'block';
        } else {
            showCustomButton.style.display = 'none';
        }
    }

    /**
     * Extraire l'année d'une chaîne de date.
     * @param {string} dateString - La chaîne de date pour extraire l'année.
     * @returns {number} - L'année extraite.
     */
    function getYearFromDate(dateString) {
        return new Date(dateString).getFullYear();
    }

    // Écouteur d'événements pour les boutons "Détails" pour ouvrir la modal avec les détails du film
    document.addEventListener('click', async event => {
        if (event.target.classList.contains('details-btn') || event.target.id === 'best-movie-details-btn') {
            // Empêcher l'ouverture de la modal sur les appareils mobiles (max-width: 480px)
            if (window.innerWidth <= 480) return;

            const movieId = event.target.dataset.id;
            try {
                const response = await fetch(`${apiBaseURL}${movieId}`);
                const movie = await response.json();

                // Supprimer la modal existante si elle existe
                const existingModal = document.querySelector('.modal-wrapper');
                if (existingModal) {
                    existingModal.remove();
                }

                // Créer et afficher la modal
                let modalContent = `
                    <div class="modal-wrapper" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.5); z-index: 2000;">
                        <div class="modal" style="background: #fff; border: 6px solid #333; padding: 20px; width: 778px; height: 939px; overflow-y: auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); position: relative; display: flex; flex-direction: column;">
                            <div class="modal-content" style="display: flex; flex-direction: column; gap: 10px;">
                                <div class="modal-header" style="display: flex; flex-direction: row; gap: 20px;">
                                    <div class="modal-title-container" style="flex: 1;">
                                        <h3 class="modal-title" style="font-family: Oswald, sans-serif; font-size: 48px; font-weight: 600; line-height: 71.14px; text-align: left; margin: 0;">${movie.title}</h3>
                                        <h2 style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin: 10px 0;">${getYearFromDate(movie.date_published)} - ${movie.genres.join(', ')}</h2>
                                        <h2 style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin: 10px 0;">${movie.duration} minutes (${movie.countries.join(', ')})</h2>
                                        <h2 style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin: 10px 0;">IMDB score: ${movie.imdb_score}</h2>
                                        <div style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin-top: 10px;">Réalisé par:</div>
                                        <div style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 400; line-height: 35.57px; text-align: left; margin-top: 5px;">${movie.directors.join(', ')}</div>
                                    </div>
                                    <img class="modal-img" src="${movie.image_url}" alt="${movie.title}" style="width: 227px; height: 334px; margin-left: 20px;" onerror="this.src='${defaultImageUrl}'">
                                </div>
                                <div class="modal-description">
                                    <div style="font-family: Oswald, sans-serif; font-size: 19px; font-weight: 200; line-height: 28px; color: #000; margin: 10px 0;">${movie.long_description}</div>
                                </div>
                                <div class="modal-actors">
                                    <div style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin: 10px 0;">Avec:</div>
                                    <div style="font-family: Oswald, sans-serif; font-size: 19px; font-weight: 200; line-height: 28px; color: #000; margin: 10px 0;">${movie.actors.join(', ')}</div>
                                </div>
                            </div>
                            <div style="margin-top: auto; display: flex; justify-content: center;">
                                <button class="close-btn" style="background-color: red; color: white; padding: 8px 60px; border: none; border-radius: 25px; cursor: pointer; font-size: 18px;">Fermer</button>
                            </div>
                        </div>
                    </div>
                `;

                // Appliquer les styles réactifs pour la modal
                if (window.innerWidth <= 768) {
                    modalContent = `
                        <div class="modal-wrapper" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.5); z-index: 2000;">
                            <div class="modal" style="background: #fff; border: 6px solid #333; padding: 20px; width: 506px; height: auto; max-height: 90%; overflow-y: auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); position: relative; display: flex; flex-direction: column;">
                                <button class="close-btn" style="background-color: transparent; color: red; border: none; font-size: 32px; font-weight: bold; position: absolute; top: 10px; right: 10px; cursor: pointer;">&times;</button>
                                <div class="modal-content" style="display: flex; flex-direction: column; gap: 0px;">
                                    <div class="modal-header" style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                                        <div class="modal-title-container" style="flex: 1; margin-left: 10px;">
                                            <h3 class="modal-title" style="font-family: Oswald, sans-serif; font-size: 48px; font-weight: 600; line-height: 71.14px; text-align: left; margin: 0;">${movie.title}</h3>
                                            <h2 style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align left; margin: 10px 0;">${getYearFromDate(movie.date_published)} - ${movie.genres.join(', ')}</h2>
                                            <h2 style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align left; margin: 10px 0;">${movie.duration} minutes (${movie.countries.join(', ')})</h2>
                                            <h2 style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin: 10px 0;">IMDB score: ${movie.imdb_score}</h2>
                                            <div style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin-top: 10px;">Réalisé par:</div>
                                            <div style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 400; line-height: 35.57px; text-align: left; margin-top: 5px;">${movie.directors.join(', ')}</div>
                                        </div>
                                    </div>
                                    <div class="modal-description">
                                        <div style="font-family: Oswald, sans-serif; font-size: 19px; font-weight: 200; line-height: 28px; color: #000; margin: 10px 0;">${movie.long_description}</div>
                                    </div>
                                    <img class="modal-img" src="${movie.image_url}" alt="${movie.title}" style="width: 480px; height: 702px; margin: 20px 0;" onerror="this.src='${defaultImageUrl}'">
                                    <div class="modal-actors">
                                        <div style="font-family: Oswald, sans-serif; font-size: 24px; font-weight: 600; line-height: 35.57px; text-align: left; margin: 10px 0;">Avec:</div>
                                        <div style="font-family: Oswald, sans-serif; font-size: 19px; font-weight: 200; line-height: 28px; color: #000; margin: 10px 0;">${movie.actors.join(', ')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                const modalWrapper = document.createElement('div');
                modalWrapper.innerHTML = modalContent;

                document.body.appendChild(modalWrapper); // Ajouter la modal au corps du document
                document.body.classList.add('modal-open'); // Empêcher le défilement du corps du document

                // Événement de fermeture de la modal
                modalWrapper.querySelector('.close-btn').addEventListener('click', () => {
                    modalWrapper.remove();
                    document.body.classList.remove('modal-open'); // Autoriser le défilement du corps du document
                });

                // Gérer l'erreur pour l'image de la modal
                const modalImg = modalWrapper.querySelector('.modal-img');
                modalImg.addEventListener('error', () => {
                    modalImg.src = defaultImageUrl; // Définir l'image par défaut si l'image ne se charge pas
                });
            } catch (error) {
                // Gestion silencieuse des erreurs
            }
        }
    });
});

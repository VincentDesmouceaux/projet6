/**
 * Main script for JustStreamIt application.
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

    // Fetch and display the best movie
    const bestFilmsUrl = `${apiBaseURL}?sort_by=-imdb_score&limit=1`;
    fetchAndDisplayBestMovie(bestFilmsUrl);

    // Initialize top-rated movies
    initMoviesWithPagination(`${apiBaseURL}?sort_by=-imdb_score&limit=5`, 'top-rated-movies-list', 6);

    // Initialize category 1 movies (Action)
    initMoviesWithPagination(`${apiBaseURL}?genre=Action&sort_by=-imdb_score&limit=5`, 'category-1-list', 6);

    // Initialize category 2 movies (Comedy)
    initMoviesWithPagination(`${apiBaseURL}?genre=Comedy&sort_by=-imdb_score&limit=5`, 'category-2-list', 6);

    // Fetch and display genres in the select dropdown
    fetchGenres(genresURL);

    // Fetch and display custom category movies based on user selection
    document.getElementById('category-select').addEventListener('change', async (event) => {
        const selectedGenre = event.target.value;
        state['custom-category-list'] = { page1: 1, page2: 2 };  // Reset page state for custom category
        await initMoviesWithPagination(`${apiBaseURL}?genre=${selectedGenre}&sort_by=-imdb_score&limit=5`, 'custom-category-list', 6);
        updateShowCustomButtonVisibility('custom-category-list');
    });

    /**
     * Fetch and display the best movie.
     * @param {string} url - The URL to fetch the best movie.
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
            // Error handling (silent)
        }
    }

    /**
     * Initialize movies with pagination.
     * @param {string} url - The URL to fetch movies.
     * @param {string} elementId - The ID of the element to display the movies.
     * @param {number} limit - The number of movies to display.
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
                container.innerHTML = '';  // Clear the container before fetching new movies

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

                    if (!data.next) break; // Exit if there are no more pages
                }
                state[elementId].page1 += 2;
                state[elementId].page2 += 2; // Update the page state

                // Show or hide the "Voir plus" button based on the number of displayed movies
                await updateShowMoreButtonVisibility(elementId, showMoreBtn);
            } catch (error) {
                // Error handling (silent)
            }
        }

        // Initial fetch
        await fetchMovies(true);

        // Add event listener for the "Voir plus" button
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
     * Fetch genres and populate the select dropdown.
     * @param {string} url - The URL to fetch genres.
     */
    async function fetchGenres(url) {
        const categorySelect = document.getElementById('category-select');
        categorySelect.innerHTML = '';  // Clear existing options

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
                // Error handling (silent)
            }
        }

        fetchAllGenres();
    }

    /**
     * Validate and return a valid image URL.
     * @param {string} url - The URL of the image.
     * @param {string} defaultImageUrl - The default image URL to use if the original URL is invalid.
     * @returns {Promise<string>} - A promise that resolves to a valid image URL.
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
     * Display a movie in the specified element.
     * @param {Object} movie - The movie object to display.
     * @param {string} elementId - The ID of the element to display the movie in.
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
     * Update the visibility of the "Voir plus" button based on the number of displayed movies.
     * @param {string} elementId - The ID of the element containing the movies.
     * @param {HTMLElement} showMoreBtn - The "Voir plus" button element.
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
     * Update the visibility of the "Show Custom" button based on the number of displayed custom category movies.
     * @param {string} elementId - The ID of the element containing the custom category movies.
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
     * Extract the year from a date string.
     * @param {string} dateString - The date string to extract the year from.
     * @returns {number} - The extracted year.
     */
    function getYearFromDate(dateString) {
        return new Date(dateString).getFullYear();
    }

    // Event listener for "Détails" buttons to open modal with movie details
    document.addEventListener('click', async event => {
        if (event.target.classList.contains('details-btn') || event.target.id === 'best-movie-details-btn') {
            // Prevent opening the modal on mobile devices (max-width: 480px)
            if (window.innerWidth <= 480) return;

            const movieId = event.target.dataset.id;
            try {
                const response = await fetch(`${apiBaseURL}${movieId}`);
                const movie = await response.json();

                // Remove existing modal if it exists
                const existingModal = document.querySelector('.modal-wrapper');
                if (existingModal) {
                    existingModal.remove();
                }

                // Create and display the modal
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

                // Apply responsive styles for modal
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

                document.body.appendChild(modalWrapper); // Append the modal to the body
                document.body.classList.add('modal-open'); // Prevent body scroll

                // Close modal event
                modalWrapper.querySelector('.close-btn').addEventListener('click', () => {
                    modalWrapper.remove();
                    document.body.classList.remove('modal-open'); // Allow body scroll
                });

                // Handle error for modal image
                const modalImg = modalWrapper.querySelector('.modal-img');
                modalImg.addEventListener('error', () => {
                    modalImg.src = defaultImageUrl; // Set default image if the image fails to load
                });
            } catch (error) {
                // Error handling (silent)
            }
        }
    });
});

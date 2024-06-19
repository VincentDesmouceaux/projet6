document.addEventListener('DOMContentLoaded', () => {
    const apiBaseURL = 'http://127.0.0.1:8000/api/v1/titles/';
    const genresURL = 'http://127.0.0.1:8000/api/v1/genres/';

    const state = {
        'top-rated-movies-list': { page1: 1, page2: 2 },
        'category-1-list': { page1: 1, page2: 2 },
        'category-2-list': { page1: 1, page2: 2 },
        'custom-category-list': { page1: 1, page2: 2 },
        'genres': { page: 1 }
    };

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
    document.getElementById('category-select').addEventListener('change', (event) => {
        const selectedGenre = event.target.value;
        state['custom-category-list'] = { page1: 1, page2: 2 };  // Reset page state for custom category
        initMoviesWithPagination(`${apiBaseURL}?genre=${selectedGenre}&sort_by=-imdb_score&limit=5`, 'custom-category-list', 6);
    });

    async function fetchAndDisplayBestMovie(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const movie = data.results[0];
            const theBestFilmDetailUrl = `${apiBaseURL}${movie.id}`;
            const detailResponse = await fetch(theBestFilmDetailUrl);
            const detailData = await detailResponse.json();
            const isValid = await validateImage(movie.image_url);
            if (isValid) {
                document.getElementById('best-movie-img').src = movie.image_url;
                document.getElementById('best-movie-title').textContent = movie.title;
                document.getElementById('best-movie-summary').textContent = detailData.description;
                document.getElementById('best-movie-details-btn').dataset.id = movie.id;
            }
        } catch (error) {
            console.error('Error fetching the best movie:', error);
        }
    }

    function initMoviesWithPagination(url, elementId, limit) {
        const container = document.getElementById(elementId);

        async function fetchMovies(reset = false) {
            if (reset) {
                state[elementId] = { page1: 1, page2: 2 };
            }

            let { page1, page2 } = state[elementId];
            console.log(`Backend page numbers: ${page1}, ${page2}`); // Log the page numbers

            let displayedMovies = 0;
            try {
                container.innerHTML = '';  // Clear the container before fetching new movies

                for (const page of [page1, page2]) {
                    const response = await fetch(`${url}&page=${page}`);
                    const data = await response.json();

                    for (const movie of data.results) {
                        if (displayedMovies >= limit) break;

                        const isValid = await validateImage(movie.image_url);
                        if (isValid) {
                            displayMovie(movie, elementId);
                            displayedMovies++;
                        }
                    }

                    if (!data.next) break; // Exit if there are no more pages
                }
                state[elementId].page1 += 2;
                state[elementId].page2 += 2; // Update the page state
            } catch (error) {
                console.error(`Error fetching movies for ${elementId}:`, error);
            }
        }

        // Initial fetch
        fetchMovies(true);

        // Add event listener for the "Voir plus" button
        const showMoreBtn = document.querySelector(`#${elementId}`).nextElementSibling;
        showMoreBtn.addEventListener('click', async () => {
            console.log(`"Voir plus" clicked for ${elementId}`);
            await fetchMovies(); // Reset container before fetching new movies
        });
    }

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
                console.error('Error fetching genres:', error);
            }
        }

        fetchAllGenres();
    }

    async function validateImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

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
        container.appendChild(movieElement);
    }

    // Event listener for "Détails" buttons to open modal with movie details
    document.addEventListener('click', async event => {
        if (event.target.classList.contains('details-btn')) {
            const movieId = event.target.dataset.id;
            try {
                const response = await fetch(`${apiBaseURL}${movieId}`);
                const movie = await response.json();
                // Display movie details in a modal
                const modalContent = `
                    <div class="modal">
                        <span class="close-btn">&times;</span>
                        <img src="${movie.image_url}" alt="${movie.title}">
                        <h3>${movie.title}</h3>
                        <p>Genres: ${movie.genres.join(', ')}</p>
                        <p>Date de sortie: ${movie.date_published}</p>
                        <p>Classification: ${movie.rated}</p>
                        <p>Score IMDB: ${movie.imdb_score}</p>
                        <p>Réalisateur: ${movie.directors.join(', ')}</p>
                        <p>Acteurs: ${movie.actors.join(', ')}</p>
                        <p>Durée: ${movie.duration} minutes</p>
                        <p>Pays: ${movie.countries.join(', ')}</p>
                        <p>Recettes: ${movie.worldwide_gross_income}</p>
                        <p>Résumé: ${movie.description}</p>
                    </div>
                `;
                const modalContainer = document.createElement('div');
                modalContainer.classList.add('modal-container');
                modalContainer.innerHTML = modalContent;
                document.body.appendChild(modalContainer);

                // Close modal event
                document.querySelector('.close-btn').addEventListener('click', () => {
                    document.body.removeChild(modalContainer);
                });

                // Handle error for modal image
                const modalImg = modalContainer.querySelector('img');
                modalImg.addEventListener('error', () => {
                    modalImg.style.display = 'none'; // Hide the image element if it fails to load
                });
            } catch (error) {
                console.error(`Error fetching movie details for ${movieId}:`, error);
            }
        }
    });

    // Intercept image errors to prevent them from appearing in the console
    window.addEventListener('error', function (event) {
        if (event.target.tagName === 'IMG') {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
});

document.addEventListener('DOMContentLoaded', () => {
    const apiBaseURL = 'http://127.0.0.1:8000/api/v1/titles/';
    const genresURL = 'http://127.0.0.1:8000/api/v1/genres/';

    // Fetch and display the best movie
    const bestFilmsUrl = `${apiBaseURL}?sort_by=-imdb_score&limit=1`;
    fetch(bestFilmsUrl)
        .then(response => response.json())
        .then(data => {
            const movie = data.results[0];
            const theBestFilmDetailUrl = `${apiBaseURL}${movie.id}`;
            fetch(theBestFilmDetailUrl)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('best-movie-img').src = movie.image_url;
                    document.getElementById('best-movie-title').textContent = movie.title;
                    document.getElementById('best-movie-summary').textContent = data.description;
                    document.getElementById('best-movie-details-btn').dataset.id = movie.id;
                });
        });

    // Fetch and display top-rated movies
    fetchMoviesWithPagination(`${apiBaseURL}?sort_by=-imdb_score&limit=6`, 'top-rated-movies-list', 6);

    // Fetch and display category 1 movies (Action)
    fetchMoviesWithPagination(`${apiBaseURL}?genre=Action&sort_by=-imdb_score&limit=5`, 'category-1-list', 6);

    // Fetch and display category 2 movies (Comedy)
    fetchMoviesWithPagination(`${apiBaseURL}?genre=Comedy&sort_by=-imdb_score&limit=5`, 'category-2-list', 6);

    // Fetch and display genres in the select dropdown
    fetch(genresURL)
        .then(response => response.json())
        .then(data => {
            const categorySelect = document.getElementById('category-select');
            data.results.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.name;
                option.textContent = genre.name;
                categorySelect.appendChild(option);
            });
        });

    // Fetch and display custom category movies based on user selection
    document.getElementById('category-select').addEventListener('change', (event) => {
        const selectedGenre = event.target.value;
        fetchMoviesWithPagination(`${apiBaseURL}?genre=${selectedGenre}&sort_by=-imdb_score&limit=5`, 'custom-category-list', 6);
    });

    async function fetchMoviesWithPagination(url, elementId, limit) {
        let page = 1;
        let displayedMovies = 0;

        while (displayedMovies < limit) {
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
            page++;
        }
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
    document.addEventListener('click', event => {
        if (event.target.classList.contains('details-btn')) {
            const movieId = event.target.dataset.id;
            fetch(`${apiBaseURL}${movieId}`)
                .then(response => response.json())
                .then(movie => {
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
                });
        }
    });
});

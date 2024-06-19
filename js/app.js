document.addEventListener('DOMContentLoaded', () => {
    const apiBaseURL = 'http://127.0.0.1:8000/api/v1/titles/';
    const genresURL = 'http://127.0.0.1:8000/api/v1/genres/';

    let pages = {
        topRated: 1,
        action: 1,
        comedy: 1,
        custom: 1
    };

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
    async function fetchTopRatedMovies() {
        const movies = await fetchMoviesWithPagination(`${apiBaseURL}?sort_by=-imdb_score`, 6, pages.topRated);
        displayMovies(movies, 'top-rated-movies-list');
    }
    fetchTopRatedMovies();

    // Fetch and display category 1 movies (Action)
    async function fetchActionMovies() {
        const movies = await fetchMoviesWithPagination(`${apiBaseURL}?genre=Action&sort_by=-imdb_score`, 6, pages.action);
        displayMovies(movies, 'category-1-list');
    }
    fetchActionMovies();

    // Fetch and display category 2 movies (Comedy)
    async function fetchComedyMovies() {
        const movies = await fetchMoviesWithPagination(`${apiBaseURL}?genre=Comedy&sort_by=-imdb_score`, 6, pages.comedy);
        displayMovies(movies, 'category-2-list');
    }
    fetchComedyMovies();

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
    document.getElementById('category-select').addEventListener('change', async (event) => {
        const selectedGenre = event.target.value;
        pages.custom = 1; // Reset custom category page
        const movies = await fetchMoviesWithPagination(`${apiBaseURL}?genre=${selectedGenre}&sort_by=-imdb_score`, 6, pages.custom);
        const customCategoryList = document.getElementById('custom-category-list');
        customCategoryList.innerHTML = ''; // Clear previous movies
        displayMovies(movies, 'custom-category-list');
    });

    async function fetchMoviesWithPagination(url, limit, page) {
        let movies = [];
        let remaining = limit;
        let currentPage = page;

        while (remaining > 0) {
            const response = await fetch(`${url}&limit=5&page=${currentPage}`);
            const data = await response.json();
            const moviesToAdd = data.results.slice(0, remaining);
            movies = movies.concat(moviesToAdd);
            remaining -= moviesToAdd.length;
            if (moviesToAdd.length < 5) break; // No more movies to fetch
            currentPage++;
        }

        return movies;
    }

    function displayMovies(movies, elementId) {
        const container = document.getElementById(elementId);
        container.innerHTML = ''; // Clear previous movies
        movies.forEach(movie => {
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
        });
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

    // Event listener for "Voir plus" buttons
    document.querySelectorAll('.show-more').forEach(button => {
        button.addEventListener('click', async (event) => {
            const sectionId = event.target.closest('section').id;
            if (sectionId === 'top-rated-movies') {
                pages.topRated++;
                await fetchTopRatedMovies();
            } else if (sectionId === 'category-1') {
                pages.action++;
                await fetchActionMovies();
            } else if (sectionId === 'category-2') {
                pages.comedy++;
                await fetchComedyMovies();
            } else if (sectionId === 'custom-category') {
                pages.custom++;
                const selectedGenre = document.getElementById('category-select').value;
                const movies = await fetchMoviesWithPagination(`${apiBaseURL}?genre=${selectedGenre}&sort_by=-imdb_score`, 6, pages.custom);
                displayMovies(movies, 'custom-category-list');
            }
        });
    });
});

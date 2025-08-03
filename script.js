// Sélection des éléments DOM
const form = document.getElementById("addForm");
const titleInput = document.getElementById("title");
const artistInput = document.getElementById("artist");
const lyricsInput = document.getElementById("lyrics");
const tagsInput = document.getElementById("tags");
const mediaFileInput = document.getElementById("mediaFile");
const fileNameDisplay = document.getElementById("fileName");
const audioPreview = document.getElementById("audioPreview");
const songList = document.getElementById("songList");
const favoritesList = document.getElementById("favoritesList");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sortSelect");
const toggleThemeBtn = document.getElementById("toggleTheme");
const karaokeControls = document.getElementById("karaokeControls");
const playPauseBtn = document.getElementById("playPauseBtn");
const playPauseIcon = document.getElementById("playPauseIcon");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");
const speedDownBtn = document.getElementById("speedDownBtn");
const speedUpBtn = document.getElementById("speedUpBtn");
const speedValue = document.getElementById("speedValue");
const progressBar = document.querySelector(".progress-bar");
const currentLineSpan = document.getElementById("currentLine");
const totalLinesSpan = document.getElementById("totalLines");
const karaokeSongSelect = document.getElementById("karaokeSongSelect");
const karaokeLyricsContainer = document.getElementById("karaokeLyricsContainer");
const karaokeLyricsContent = document.getElementById("karaokeLyricsContent");
const karaokeSongTitle = document.getElementById("karaokeSongTitle");
const songCountSpan = document.getElementById("songCount");
const mediaPlayerContainer = document.getElementById("mediaPlayerContainer");
const mediaPlayer = document.getElementById("mediaPlayer");
const syncMediaBtn = document.getElementById("syncMediaBtn");
const mediaTimeSpan = document.getElementById("mediaTime");
const equalizer = document.getElementById("equalizer");
const submitBtn = document.getElementById("submitBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFile");
const clearFiltersBtn = document.getElementById("clearFilters");
const tagFilterInput = document.getElementById("tagFilter");
const filterChips = document.querySelectorAll(".filter-chip");

// Navigation
const navTabs = document.querySelectorAll(".nav-tab");
const tabContents = document.querySelectorAll(".tab-content");

// Variables d'état
let sortCriteria = "recent";
let karaokeInterval = null;
let karaokeCurrentIndex = -1;
let karaokeLinesElems = [];
let isKaraokePlaying = false;
let currentSongCard = null;
let karaokeSpeed = 1;
let lineDuration = 2000; // 2 secondes par ligne par défaut
let isMediaSynced = false;
let mediaUpdateInterval = null;
let mediaFileObjectUrl = null;
let activeFilters = new Set();

// --- PARTICULES DE FOND ---
function createParticles() {
  const particlesContainer = document.getElementById("particles");
  if (!particlesContainer) return;

  const particleCount = window.innerWidth < 768 ? 30 : 50;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    // Taille aléatoire entre 2px et 6px
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Position aléatoire
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;

    // Opacité aléatoire
    particle.style.opacity = Math.random() * 0.6 + 0.1;

    // Animation de flottement
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;

    particlesContainer.appendChild(particle);
  }
}

// --- GESTION DE LA NAVIGATION ---
function setupNavigation() {
  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Désactiver tous les onglets
      navTabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      // Activer l'onglet sélectionné
      tab.classList.add("active");
      const tabId = tab.getAttribute("data-tab");
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) tabContent.classList.add("active");

      // Charger le contenu approprié
      switch (tabId) {
        case "library":
          displaySongs(searchInput.value);
          break;
        case "favorites":
          displayFavorites();
          break;
        case "karaoke":
          populateKaraokeSongs();
          break;
        case "stats":
          displayStats();
          break;
      }
    });
  });
}

// --- GESTION DU THÈME ---
function loadTheme() {
  const theme = localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  // Animation du bouton
  toggleThemeBtn.classList.add("animate-spin");
  setTimeout(() => {
    toggleThemeBtn.classList.remove("animate-spin");
  }, 500);
}

if (toggleThemeBtn) {
  toggleThemeBtn.addEventListener("click", toggleTheme);
}
loadTheme();

// --- NOTIFICATIONS ---
function setupNotifications() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

function notify(title, message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "/favicon.ico"
    });
  }
}

// --- GESTION DES CHANSONS ---
function loadSongs() {
  try {
    const songs = JSON.parse(localStorage.getItem("songs") || "[]");
    // Migration pour les anciennes chansons sans tags
    return songs.map(song => {
      if (!song.tags) song.tags = [];
      if (!song.artist) song.artist = "";
      return song;
    });
  } catch (error) {
    console.error("Erreur de chargement des chansons:", error);
    return [];
  }
}

function saveSongs(songs) {
  try {
    localStorage.setItem("songs", JSON.stringify(songs));
    updateSongCount();
    // Sauvegarde automatique dans le stockage cloud si disponible
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) console.log("Stockage persistant activé");
      });
    }
  } catch (error) {
    console.error("Erreur de sauvegarde des chansons:", error);
    alert("Le stockage local est plein. Essayez de supprimer des chansons ou d'exporter vos données.");
  }
}

function sortSongs(songs, criteria) {
  const sorted = [...songs];
  switch (criteria) {
    case "alpha":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "fav":
      return sorted.sort((a, b) => (b.favorite === a.favorite ? 0 : b.favorite ? 1 : -1));
    case "artist":
      return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
    default: // recent
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function filterSongs(songs, searchTerm = "", filters = new Set(), tagFilter = "") {
  return songs.filter(song => {
    // Filtre de recherche
    const matchesSearch =
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.lyrics.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtres actifs
    let matchesFilters = true;
    filters.forEach(filter => {
      switch (filter) {
        case "favorite":
          matchesFilters = matchesFilters && song.favorite;
          break;
        case "withMedia":
          matchesFilters = matchesFilters && song.mediaFile;
          break;
        case "recent":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesFilters = matchesFilters && new Date(song.createdAt) > weekAgo;
          break;
      }
    });

    // Filtre par tag
    let matchesTag = true;
    if (tagFilter) {
      const tagsToMatch = tagFilter.split(",").map(t => t.trim().toLowerCase());
      matchesTag = tagsToMatch.some(tag =>
        song.tags.some(songTag => songTag.toLowerCase().includes(tag))
      );
    }

    return matchesSearch && matchesFilters && matchesTag;
  });
}

function updateSongCount() {
  const songs = loadSongs();
  if (songCountSpan) {
    songCountSpan.textContent = `${songs.length} ${songs.length > 1 ? 'chansons' : 'chanson'}`;
  }
}

function clearKaraoke() {
  if (karaokeInterval) {
    clearInterval(karaokeInterval);
    karaokeInterval = null;
  }

  if (mediaUpdateInterval) {
    clearInterval(mediaUpdateInterval);
    mediaUpdateInterval = null;
  }

  if (mediaPlayer) {
    mediaPlayer.pause();
  }

  if (mediaPlayerContainer) {
    mediaPlayerContainer.classList.add("hidden");
  }

  isMediaSynced = false;

  if (syncMediaBtn) {
    syncMediaBtn.innerHTML = '<i class="fas fa-link mr-1"></i>Synchroniser avec le média';
  }

  karaokeCurrentIndex = -1;
  isKaraokePlaying = false;

  if (playPauseIcon) {
    playPauseIcon.classList.remove("fa-pause");
    playPauseIcon.classList.add("fa-play");
  }

  if (progressBar) {
    progressBar.style.width = "0%";
  }

  karaokeLinesElems.forEach(line => {
    line.classList.remove("karaoke-active");
  });

  karaokeLinesElems = [];

  // Libérer l'URL de l'objet média précédent
  if (mediaFileObjectUrl) {
    URL.revokeObjectURL(mediaFileObjectUrl);
    mediaFileObjectUrl = null;
  }
}

function createSongCard(song, index, container) {
  if (!container) return;

  const card = document.createElement("div");
  card.className = "song-card cyber-glass p-6 rounded-2xl border border-gray-200/30 dark:border-gray-700/30 space-y-5 transition-3d hover:shadow-xl";

  const header = document.createElement("div");
  header.className = "flex justify-between items-start gap-4";

  const title = document.createElement("h3");
  title.className = "text-lg md:text-xl font-semibold truncate";
  title.textContent = song.title;
  title.title = song.title;

  const actions = document.createElement("div");
  actions.className = "flex items-center gap-3";

  const favBtn = document.createElement("button");
  favBtn.className = `favorite-btn text-2xl ${song.favorite ? "text-yellow-400 fas fa-star" : "far fa-star text-gray-400 hover:text-yellow-400"} transition-3d hover:scale-110`;
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(index);
  });

  const editBtn = document.createElement("button");
  editBtn.className = "text-blue-500 hover:text-blue-600 text-xl fas fa-edit transition-3d hover:scale-110";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    editSong(index);
  });

  const delBtn = document.createElement("button");
  delBtn.className = "text-red-500 hover:text-red-600 text-xl fas fa-trash-alt transition-3d hover:scale-110";
  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm(`Supprimer "${song.title}" ?`)) {
      deleteSong(index);
    }
  });

  const shareBtn = document.createElement("button");
  shareBtn.className = "text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xl fas fa-share-alt transition-3d hover:scale-110";
  shareBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    shareSong(song);
  });

  actions.appendChild(favBtn);
  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  actions.appendChild(shareBtn);
  header.appendChild(title);
  header.appendChild(actions);

  // Métadonnées (artiste et tags)
  const metadata = document.createElement("div");
  metadata.className = "flex flex-wrap items-center gap-2 text-sm";

  if (song.artist) {
    const artistSpan = document.createElement("span");
    artistSpan.className = "flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full";
    artistSpan.innerHTML = `<i class="fas fa-user text-indigo-500"></i> ${song.artist}`;
    metadata.appendChild(artistSpan);
  }

  song.tags.forEach(tag => {
    const tagSpan = document.createElement("span");
    tagSpan.className = "tag";
    tagSpan.textContent = tag;
    metadata.appendChild(tagSpan);
  });

  // Container paroles
  const lyricsContainer = document.createElement("div");
  lyricsContainer.className = "lyrics-container bg-white/30 dark:bg-gray-700/30 rounded-xl p-5 overflow-auto";

  // Pré-formatage des paroles
  const lyricsContent = document.createElement("pre");
  lyricsContent.className = "whitespace-pre-wrap font-sans leading-relaxed";

  const lines = song.lyrics.split("\n");
  lines.forEach((line) => {
    const span = document.createElement("span");
    span.className = "karaoke-line block";
    span.textContent = line || " "; // Garde les lignes vides
    lyricsContent.appendChild(span);
  });

  lyricsContainer.appendChild(lyricsContent);

  // Bouton pour voir les paroles
  const toggleLyricsBtn = createToggleLyricsButton(lyricsContainer);

  // Bouton karaoké
  const karaokeBtn = document.createElement("button");
  karaokeBtn.className = "cyber-button flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-3d group hover:shadow-lg";
  karaokeBtn.innerHTML = `<i class="fas fa-microphone-alt group-hover:animate-pulse"></i> <span>KARAOKÉ</span>`;
  karaokeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!lyricsContainer.classList.contains("expanded")) {
      lyricsContainer.classList.add("expanded");
      const toggleBtn = card.querySelector(".toggle-lyrics-btn");
      if (toggleBtn) {
        const icon = toggleBtn.querySelector("i");
        icon.classList.remove("fa-chevron-down");
        icon.classList.add("fa-chevron-up");
        toggleBtn.querySelector("span").textContent = "Masquer les paroles";
      }
    }

    // Créer une URL objet pour le fichier média
    let mediaUrl = null;
    if (song.mediaFile) {
      try {
        const blob = dataURItoBlob(song.mediaFile);
        mediaUrl = URL.createObjectURL(blob);
      } catch (error) {
        console.error("Erreur lors de la création de l'URL média:", error);
      }
    }

    startKaraoke(lyricsContent, card, mediaUrl);
  });

  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "flex flex-wrap gap-3";
  buttonsContainer.appendChild(toggleLyricsBtn);
  buttonsContainer.appendChild(karaokeBtn);

  card.appendChild(header);
  card.appendChild(metadata);
  card.appendChild(buttonsContainer);
  card.appendChild(lyricsContainer);
  container.appendChild(card);
}

function dataURItoBlob(dataURI) {
  // Convertit une data URI en Blob
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
}

function createToggleLyricsButton(container) {
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "cyber-button toggle-lyrics-btn flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-3d group hover:shadow-lg";
  toggleBtn.innerHTML = `<i class="fas fa-chevron-down transition-transform group-hover:translate-y-0.5"></i> <span>VOIR LES PAROLES</span>`;

  toggleBtn.addEventListener("click", () => {
    container.classList.toggle("expanded");
    const icon = toggleBtn.querySelector("i");
    icon.classList.toggle("fa-chevron-down");
    icon.classList.toggle("fa-chevron-up");
    toggleBtn.querySelector("span").textContent =
      container.classList.contains("expanded") ? "MASQUER LES PAROLES" : "VOIR LES PAROLES";
  });

  return toggleBtn;
}

function displaySongs(filter = "") {
  clearKaraoke();
  let songs = loadSongs();
  songs = sortSongs(songs, sortCriteria);
  songs = filterSongs(songs, filter, activeFilters, tagFilterInput?.value || "");

  if (songList) {
    songList.innerHTML = "";

    if (songs.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "text-center py-16 text-gray-500 dark:text-gray-400 col-span-full";
      emptyState.innerHTML = `
        <i class="fas fa-music text-5xl mb-4 opacity-30 animate-pulse-slow"></i>
        <p class="text-xl font-light">Aucune chanson trouvée</p>
        <p class="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
      `;
      songList.appendChild(emptyState);
      return;
    }

    songs.forEach((song, index) => {
      createSongCard(song, index, songList);
    });
  }
}

function displayFavorites() {
  const songs = loadSongs();
  const favorites = songs.filter(song => song.favorite);

  if (favoritesList) {
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "text-center py-16 text-gray-500 dark:text-gray-400";
      emptyState.innerHTML = `
        <i class="fas fa-star text-5xl mb-4 opacity-30 animate-pulse-slow"></i>
        <p class="text-xl font-light">Aucune chanson favorite</p>
        <p class="text-sm mt-2">Ajoutez des favoris depuis votre bibliothèque</p>
      `;
      favoritesList.appendChild(emptyState);
      return;
    }

    favorites.forEach((song, index) => {
      const originalIndex = songs.findIndex(s => s.title === song.title);
      createSongCard(song, originalIndex, favoritesList);
    });
  }
}

function displayStats() {
  const songs = loadSongs();
  const statsTab = document.getElementById("stats-tab");
  if (!statsTab) return;

  const totalSongs = songs.length;
  const totalFavorites = songs.filter(s => s.favorite).length;
  const totalWithMedia = songs.filter(s => s.mediaFile).length;

  // Calcul des tags les plus utilisés
  const tagCounts = {};
  songs.forEach(song => {
    song.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  statsTab.innerHTML = `
    <div class="cyber-glass rounded-2xl p-6">
      <h2 class="text-2xl font-bold mb-6 gradient-text">
        <i class="fas fa-chart-bar mr-3"></i>VOS STATISTIQUES
      </h2>
      
      <div class="stats-grid mb-6">
        <div class="stat-card">
          <div class="stat-value">${totalSongs}</div>
          <div class="stat-label">Chansons</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalFavorites}</div>
          <div class="stat-label">Favoris</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalWithMedia}</div>
          <div class="stat-label">Avec média</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${new Set(songs.map(s => s.artist)).size}</div>
          <div class="stat-label">Artistes</div>
        </div>
      </div>
      
      <h3 class="text-xl font-semibold mb-4">Tags les plus utilisés</h3>
      <div class="flex flex-wrap gap-2">
        ${sortedTags.map(([tag, count]) => `
          <span class="tag text-sm">
            ${tag} <span class="font-bold">(${count})</span>
          </span>
        `).join("")}
      </div>
      
      <h3 class="text-xl font-semibold mt-6 mb-4">Activité récente</h3>
      <div class="space-y-2">
        ${songs.slice(0, 5).map(song => `
          <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span class="truncate">${song.title}</span>
            <span class="text-sm text-gray-500">${new Date(song.createdAt).toLocaleDateString()}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function populateKaraokeSongs() {
  const songs = loadSongs();
  if (!karaokeSongSelect) return;

  karaokeSongSelect.innerHTML = '<option value="">-- Choisir une chanson --</option>';

  songs.forEach((song, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = song.title;
    karaokeSongSelect.appendChild(option);
  });

  karaokeSongSelect.addEventListener("change", (e) => {
    const index = e.target.value;
    if (index === "") {
      if (karaokeLyricsContainer) karaokeLyricsContainer.classList.add("hidden");
      if (mediaPlayerContainer) mediaPlayerContainer.classList.add("hidden");
      return;
    }

    const song = songs[index];
    if (karaokeSongTitle) karaokeSongTitle.textContent = song.title;
    if (karaokeLyricsContent) karaokeLyricsContent.innerHTML = "";

    const lines = song.lyrics.split("\n");
    lines.forEach((line) => {
      const span = document.createElement("span");
      span.className = "karaoke-line block";
      span.textContent = line || " ";
      if (karaokeLyricsContent) karaokeLyricsContent.appendChild(span);
    });

    if (karaokeLyricsContainer) karaokeLyricsContainer.classList.remove("hidden");

    // Configurer le lecteur multimédia si un fichier est disponible
    if (song.mediaFile && mediaPlayer) {
      try {
        const blob = dataURItoBlob(song.mediaFile);
        mediaFileObjectUrl = URL.createObjectURL(blob);
        mediaPlayer.src = mediaFileObjectUrl;
        if (mediaPlayerContainer) mediaPlayerContainer.classList.remove("hidden");
        mediaPlayer.onloadedmetadata = () => {
          updateMediaTime();
        };
      } catch (error) {
        console.error("Erreur lors du chargement du média:", error);
      }
    } else {
      if (mediaPlayerContainer) mediaPlayerContainer.classList.add("hidden");
    }

    startKaraoke(karaokeLyricsContent, null, mediaFileObjectUrl);
  });
}

function deleteSong(index) {
  clearKaraoke();
  const songs = loadSongs();
  const songToDelete = songs[index];
  songs.splice(index, 1);
  saveSongs(songs);
  displaySongs(searchInput?.value || "");
  displayFavorites();
  populateKaraokeSongs();
  notify("Chanson supprimée", `"${songToDelete.title}" a été supprimée`);
}

function editSong(index) {
  const songs = loadSongs();
  const song = songs[index];

  // Créer un formulaire d'édition modal
  const editForm = document.createElement("div");
  editForm.className = "edit-form";
  editForm.innerHTML = `
    <div class="edit-form-content cyber-glass">
      <h2 class="text-2xl font-bold mb-4 gradient-text">Modifier la chanson</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block font-medium mb-1">Titre</label>
          <input type="text" id="editTitle" value="${song.title}" class="cyber-input w-full p-3 rounded-lg text-gray-900 dark:text-black-100">
        </div>
        
        <div>
          <label class="block font-medium mb-1">Artiste</label>
          <input type="text" id="editArtist" value="${song.artist || ''}" class="cyber-input w-full p-3 rounded-lg text-gray-900 dark:text-black-100">
        </div>
        
        <div>
          <label class="block font-medium mb-1">Paroles</label>
          <textarea id="editLyrics" class="cyber-input w-full p-3 rounded-lg h-40 text-gray-900 dark:text-black-100">${song.lyrics}</textarea>
        </div>
        
        <div>
          <label class="block font-medium mb-1">Tags (séparés par des virgules)</label>
          <input type="text" id="editTags" value="${song.tags.join(', ')}" class="cyber-input w-full p-3 rounded-lg text-gray-900 dark:text-black-100">
        </div>
        
        <div class="flex justify-end gap-3 pt-4">
          <button id="cancelEdit" class="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">Annuler</button>
          <button id="saveEdit" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">Enregistrer</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(editForm);

  // Gestion des événements
  document.getElementById("cancelEdit").addEventListener("click", () => {
    editForm.remove();
  });

  document.getElementById("saveEdit").addEventListener("click", () => {
    const updatedSong = {
      ...song,
      title: document.getElementById("editTitle").value.trim(),
      artist: document.getElementById("editArtist").value.trim(),
      lyrics: document.getElementById("editLyrics").value.trim(),
      tags: document.getElementById("editTags").value.split(',').map(t => t.trim()).filter(t => t)
    };

    songs[index] = updatedSong;
    saveSongs(songs);
    displaySongs(searchInput?.value || "");
    displayFavorites();
    populateKaraokeSongs();
    editForm.remove();

    notify("Chanson modifiée", `"${updatedSong.title}" a été mise à jour`);
  });
}

function toggleFavorite(index) {
  const songs = loadSongs();
  songs[index].favorite = !songs[index].favorite;
  saveSongs(songs);

  // Animation du bouton favori
  const favBtns = document.querySelectorAll(".favorite-btn");
  if (favBtns[index]) {
    const favBtn = favBtns[index];
    favBtn.classList.toggle("far");
    favBtn.classList.toggle("fas");
    favBtn.classList.toggle("text-gray-400");
    favBtn.classList.toggle("text-yellow-400");
    favBtn.classList.add("active");

    setTimeout(() => {
      favBtn.classList.remove("active");
    }, 500);
  }

  if (sortCriteria === "fav") {
    displaySongs(searchInput?.value || "");
  }

  displayFavorites();

  const message = songs[index].favorite
    ? `"${songs[index].title}" ajoutée aux favoris`
    : `"${songs[index].title}" retirée des favoris`;
  notify("Favoris mis à jour", message);
}

function shareSong(song) {
  if (navigator.share) {
    navigator.share({
      title: song.title,
      text: `${song.artist ? `Par ${song.artist}\n\n` : ''}${song.lyrics}`,
      url: window.location.href,
    }).catch(err => {
      console.log("Erreur de partage:", err);
    });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = `${song.title}${song.artist ? ` - ${song.artist}` : ''}\n\n${song.lyrics}\n\nPartagé via Fredz Lyrics`;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    alert("Les paroles ont été copiées dans le presse-papiers !");
  }
}

// --- IMPORT/EXPORT ---
function exportData() {
  const songs = loadSongs();
  const dataStr = JSON.stringify(songs, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const exportFileDefaultName = `fredz-lyrics-export-${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  notify("Export réussi", "Vos chansons ont été exportées");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedSongs = JSON.parse(e.target.result);
      if (!Array.isArray(importedSongs)) {
        throw new Error("Format de fichier invalide");
      }

      // Fusionner avec les chansons existantes (éviter les doublons)
      const existingSongs = loadSongs();
      const newSongs = importedSongs.filter(imported =>
        !existingSongs.some(existing =>
          existing.title === imported.title &&
          existing.lyrics === imported.lyrics
        )
      );

      if (newSongs.length === 0) {
        alert("Aucune nouvelle chanson à importer (doublons détectés)");
        return;
      }

      if (confirm(`Importer ${newSongs.length} nouvelle(s) chanson(s) ?`)) {
        const updatedSongs = [...newSongs, ...existingSongs];
        saveSongs(updatedSongs);
        displaySongs();
        displayFavorites();
        populateKaraokeSongs();
        notify("Import réussi", `${newSongs.length} chansons importées`);
      }
    } catch (error) {
      console.error("Erreur d'import:", error);
      alert("Erreur lors de l'import : fichier JSON invalide");
    }
  };
  reader.readAsText(file);
}

// --- KARAOKÉ ---
function startKaraoke(container, card = null, mediaUrl = null) {
  clearKaraoke();

  if (karaokeControls) karaokeControls.classList.remove("hidden");
  currentSongCard = card;

  if (!container) return;

  karaokeLinesElems = Array.from(container.querySelectorAll("span"));
  if (karaokeLinesElems.length === 0) return;

  if (totalLinesSpan) totalLinesSpan.textContent = karaokeLinesElems.length;

  // Configurer le lecteur multimédia si une URL est disponible
  if (mediaUrl && mediaPlayer) {
    mediaPlayer.src = mediaUrl;
    if (mediaPlayerContainer) mediaPlayerContainer.classList.remove("hidden");
    mediaPlayer.onloadedmetadata = () => {
      updateMediaTime();
    };
  }

  karaokeCurrentIndex = 0;
  isKaraokePlaying = true;

  if (playPauseIcon) {
    playPauseIcon.classList.remove("fa-play");
    playPauseIcon.classList.add("fa-pause");
  }

  highlightLine(karaokeCurrentIndex);
  updateProgressBar();

  karaokeInterval = setInterval(() => {
    if (!isKaraokePlaying) return;

    unhighlightLine(karaokeCurrentIndex);
    karaokeCurrentIndex++;

    if (karaokeCurrentIndex >= karaokeLinesElems.length) {
      clearKaraoke();
      return;
    }

    highlightLine(karaokeCurrentIndex);
    updateProgressBar();
  }, lineDuration);
}

function highlightLine(i) {
  if (karaokeLinesElems[i]) {
    karaokeLinesElems[i].classList.add("karaoke-active");
    if (currentLineSpan) currentLineSpan.textContent = i + 1;

    karaokeLinesElems[i].scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  }
}

function unhighlightLine(i) {
  if (karaokeLinesElems[i]) {
    karaokeLinesElems[i].classList.remove("karaoke-active");
  }
}

function updateProgressBar() {
  if (!progressBar || karaokeLinesElems.length === 0) return;

  const progress = ((karaokeCurrentIndex + 1) / karaokeLinesElems.length) * 100;
  progressBar.style.width = `${progress}%`;
}

function togglePlayPause() {
  isKaraokePlaying = !isKaraokePlaying;

  if (playPauseIcon) {
    if (isKaraokePlaying) {
      playPauseIcon.classList.remove("fa-play");
      playPauseIcon.classList.add("fa-pause");

      if (karaokeCurrentIndex >= karaokeLinesElems.length - 1) {
        karaokeCurrentIndex = 0;
        highlightLine(karaokeCurrentIndex);
      }

      if (isMediaSynced && mediaPlayer) {
        mediaPlayer.play();
      }
    } else {
      playPauseIcon.classList.remove("fa-pause");
      playPauseIcon.classList.add("fa-play");

      if (isMediaSynced && mediaPlayer) {
        mediaPlayer.pause();
      }
    }
  }
}

function restartKaraoke() {
  if (karaokeLinesElems.length === 0) return;

  unhighlightLine(karaokeCurrentIndex);
  karaokeCurrentIndex = 0;
  highlightLine(karaokeCurrentIndex);
  updateProgressBar();

  if (isMediaSynced && mediaPlayer) {
    mediaPlayer.currentTime = 0;
    if (isKaraokePlaying) {
      mediaPlayer.play();
    }
  }
}

function adjustSpeed(change) {
  karaokeSpeed = Math.max(0.5, Math.min(3, karaokeSpeed + change));
  lineDuration = 2000 / karaokeSpeed;

  if (speedValue) speedValue.textContent = `${karaokeSpeed.toFixed(1)}x`;

  if (karaokeInterval) {
    clearInterval(karaokeInterval);
    if (isKaraokePlaying) {
      karaokeInterval = setInterval(advanceKaraoke, lineDuration);
    }
  }
}

function advanceKaraoke() {
  if (!isKaraokePlaying) return;

  unhighlightLine(karaokeCurrentIndex);
  karaokeCurrentIndex++;

  if (karaokeCurrentIndex >= karaokeLinesElems.length) {
    clearKaraoke();
    return;
  }

  highlightLine(karaokeCurrentIndex);
  updateProgressBar();
}

function syncMediaWithKaraoke() {
  if (!mediaPlayer || !mediaPlayer.src) return;

  isMediaSynced = !isMediaSynced;

  if (syncMediaBtn) {
    if (isMediaSynced) {
      syncMediaBtn.innerHTML = '<i class="fas fa-unlink mr-1"></i>Désynchroniser';

      // Mettre à jour le temps média en continu
      mediaUpdateInterval = setInterval(updateMediaTime, 1000);

      // Synchroniser le karaoké avec le média
      mediaPlayer.ontimeupdate = () => {
        if (!isKaraokePlaying) return;

        const currentTime = mediaPlayer.currentTime;
        const duration = mediaPlayer.duration;
        const progress = currentTime / duration;
        const lineIndex = Math.floor(progress * karaokeLinesElems.length);
        if (lineIndex !== karaokeCurrentIndex && lineIndex < karaokeLinesElems.length) {
          unhighlightLine(karaokeCurrentIndex);
          karaokeCurrentIndex = lineIndex;
          highlightLine(karaokeCurrentIndex);
          updateProgressBar();
        }
      };
    } else {
      syncMediaBtn.innerHTML = '<i class="fas fa-link mr-1"></i>Synchroniser avec le média';
      clearInterval(mediaUpdateInterval);
      mediaPlayer.ontimeupdate = null;
    }
  }
}

function updateMediaTime() {
  if (!mediaPlayer || !mediaPlayer.src || !mediaTimeSpan) return;

  const currentTime = formatTime(mediaPlayer.currentTime);
  const duration = formatTime(mediaPlayer.duration);
  mediaTimeSpan.textContent = `${currentTime} / ${duration}`;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// --- GESTION DU FORMULAIRE ---
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (fileNameDisplay) fileNameDisplay.textContent = file.name;

  // Aperçu audio si c'est un fichier audio
  if (file.type.startsWith('audio/') && audioPreview) {
    const audioURL = URL.createObjectURL(file);
    audioPreview.src = audioURL;
    audioPreview.classList.remove('hidden');
  } else if (audioPreview) {
    audioPreview.classList.add('hidden');
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const artist = artistInput.value.trim();
  const lyrics = lyricsInput.value.trim();
  const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);

  if (!title || !lyrics) {
    alert('Le titre et les paroles sont obligatoires');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AJOUT EN COURS...';
  }

  try {
    let mediaFile = null;
    if (mediaFileInput.files[0]) {
      try {
        mediaFile = await readFileAsDataURL(mediaFileInput.files[0]);
      } catch (error) {
        console.error("Erreur lors de la lecture du fichier média:", error);
        alert("Erreur lors du chargement du fichier média. Le fichier est peut-être trop volumineux.");
        return;
      }
    }

    const newSong = {
      title,
      artist,
      lyrics,
      tags,
      mediaFile,
      favorite: false,
      createdAt: new Date().toISOString()
    };

    const songs = loadSongs();
    songs.unshift(newSong); // Ajouter au début du tableau

    try {
      saveSongs(songs);
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      alert("Erreur lors de la sauvegarde. Le stockage local est peut-être plein.");
      return;
    }

    // Réinitialiser le formulaire
    form.reset();
    if (fileNameDisplay) fileNameDisplay.textContent = '';
    if (audioPreview) {
      audioPreview.classList.add('hidden');
      audioPreview.src = '';
    }

    // Afficher la notification et l'animation
    if (submitBtn) {
      submitBtn.classList.add('submit-success');
    }
    notify('Chanson ajoutée', `"${title}" a été ajoutée à votre bibliothèque`);

    // Mettre à jour les affichages
    displaySongs();
    displayFavorites();
    populateKaraokeSongs();

    // Basculer vers l'onglet Bibliothèque
    const libraryTab = document.querySelector('[data-tab="library"]');
    if (libraryTab) libraryTab.click();
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
    alert('Une erreur est survenue lors de l\'ajout de la chanson');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-plus-circle text-xl group-hover:rotate-90 transition-transform"></i><span class="group-hover:tracking-wide transition-all">AJOUTER LA CHANSON</span>';
      setTimeout(() => submitBtn.classList.remove('submit-success'), 1000);
    }
  }
}

// --- FILTRES AVANCÉS ---
function setupFilters() {
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const filter = chip.getAttribute('data-filter');

      if (chip.classList.contains('active')) {
        activeFilters.add(filter);
      } else {
        activeFilters.delete(filter);
      }

      displaySongs(searchInput?.value || "");
    });
  });

  if (tagFilterInput) {
    tagFilterInput.addEventListener('input', () => {
      displaySongs(searchInput?.value || "");
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      activeFilters.clear();
      if (tagFilterInput) tagFilterInput.value = '';
      filterChips.forEach(chip => chip.classList.remove('active'));
      displaySongs(searchInput?.value || "");
    });
  }
}

// --- ÉVÉNEMENTS ---
function setupEventListeners() {
  // Formulaire
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  if (mediaFileInput) {
    mediaFileInput.addEventListener('change', handleFileSelect);
  }

  // Recherche et tri
  if (searchInput) {
    searchInput.addEventListener('input', () => displaySongs(searchInput.value));
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortCriteria = sortSelect.value;
      displaySongs(searchInput?.value || "");
    });
  }

  // Karaoké
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', clearKaraoke);
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', restartKaraoke);
  }

  if (speedDownBtn) {
    speedDownBtn.addEventListener('click', () => adjustSpeed(-0.5));
  }

  if (speedUpBtn) {
    speedUpBtn.addEventListener('click', () => adjustSpeed(0.5));
  }

  if (syncMediaBtn) {
    syncMediaBtn.addEventListener('click', syncMediaWithKaraoke);
  }

  // Import/Export
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  if (importBtn) {
    importBtn.addEventListener('click', () => importFileInput.click());
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) importData(e.target.files[0]);
    });
  }

  // Égaliseur audio
  if (mediaPlayer && equalizer) {
    mediaPlayer.addEventListener('play', () => {
      equalizer.classList.remove('hidden');
    });

    mediaPlayer.addEventListener('pause', () => {
      equalizer.classList.add('hidden');
    });

    mediaPlayer.addEventListener('ended', () => {
      equalizer.classList.add('hidden');
    });
  }
}

// --- INITIALISATION ---
function init() {
  createParticles();
  setupNavigation();
  setupNotifications();
  setupEventListeners();
  setupFilters();

  // Charger les données initiales
  updateSongCount();
  displaySongs();
  populateKaraokeSongs();

  // Cacher les contrôles karaoké par défaut
  if (karaokeControls) {
    karaokeControls.classList.add('hidden');
  }
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', init);
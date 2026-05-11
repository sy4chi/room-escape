const API_URL = "https://room-escape.onrender.com";

const locationSelect = document.querySelector("#location");
const peopleSelect = document.querySelector("#people");
const genreSelect = document.querySelector("#genre");
const recommendButton = document.querySelector(".recommend-btn");
const resultBox = document.querySelector("#result");
const storeList = document.querySelector("#storeList");
const mapContainer = document.querySelector("#map");

let stores = [];
let themes = [];
let map = null;
let markers = [];
let infoWindows = [];

const searchBox = document.createElement("input");
searchBox.className = "store-search";
searchBox.placeholder = "매장명이나 지역을 검색해보세요";
storeList.parentElement.insertBefore(searchBox, storeList);

function startApp() {
  loadData();

  if (window.kakao && kakao.maps) {
    kakao.maps.load(() => {
      initMap();
    });
  } else {
    mapContainer.innerHTML = `
      <div style="padding:24px;color:#777;line-height:1.6;font-family:'Pretendard',sans-serif;">
        지도를 불러오지 못했습니다.
      </div>
    `;
  }
}

function initMap() {
  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(37.4979, 127.0276),
    level: 5
  });

  if (stores.length > 0) {
    renderMarkers(stores);
  }
}

async function loadData() {
  try {
    const storeResponse = await fetch(`${API_URL}/stores`);
    const themeResponse = await fetch(`${API_URL}/themes`);

    stores = await storeResponse.json();
    themes = await themeResponse.json();

    if (!Array.isArray(stores)) stores = [];
    if (!Array.isArray(themes)) themes = [];

    showAllStores(stores);
  } catch (error) {
    console.error(error);

    storeList.innerHTML = `
      <div class="store-item">
        <strong>데이터를 불러오지 못했습니다</strong>
      </div>
    `;
  }
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_.()/[\]{}'":,]/g, "")
    .trim();
}

function expandKeyword(keyword) {
  const normalizedKeyword = normalizeText(keyword);
  const result = new Set();

  result.add(normalizedKeyword);

  const synonyms = {
    "플": ["play", "플레이"],
    "플레": ["play", "플레이"],
    "플레이": ["play"],
    "play": ["플레이", "플"],
    "룸": ["room"],
    "room": ["룸"],
    "제로": ["zero"],
    "zero": ["제로"],
    "이스케이프": ["escape"],
    "방탈출": ["escape"],
    "escape": ["이스케이프", "방탈출"]
  };

  Object.entries(synonyms).forEach(([key, values]) => {
    const normalizedKey = normalizeText(key);

    if (normalizedKeyword.includes(normalizedKey)) {
      values.forEach((value) => {
        result.add(
          normalizedKeyword.replace(
            normalizedKey,
            normalizeText(value)
          )
        );
      });
    }
  });

  return [...result];
}

function getThemeStoreId(theme) {
  return theme.storeId || theme.store_id;
}

function getThemePeople(theme) {
  if (Array.isArray(theme.people)) {
    return theme.people;
  }

  return String(theme.people || "")
    .split(",")
    .map((person) => Number(person.trim()))
    .filter((person) => !Number.isNaN(person));
}

function getStoreThemes(storeId) {
  return themes.filter((theme) => {
    return Number(getThemeStoreId(theme)) === Number(storeId);
  });
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];

  infoWindows.forEach((infoWindow) => infoWindow.close());
  infoWindows = [];
}

function renderMarkers(filteredStores) {
  if (!map) return;

  clearMarkers();

  filteredStores.forEach((store) => {
    const lat = Number(store.lat);
    const lng = Number(store.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const position = new kakao.maps.LatLng(lat, lng);

    const marker = new kakao.maps.Marker({
      position
    });

    marker.setMap(map);
    markers.push(marker);

    const kakaoMapUrl =
      `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${lat},${lng}`;

    const infoWindow = new kakao.maps.InfoWindow({
      content: `
        <div class="map-info-card">
          <button class="map-info-close" onclick="window.closeKakaoInfoWindow()">
            ×
          </button>

          <div class="map-info-badge">방탈출 매장</div>

          <div class="map-info-title">
            ${store.name}
          </div>

          <div class="map-info-address">
            ${store.address}
          </div>

          <a
            href="${kakaoMapUrl}"
            target="_blank"
            class="map-info-button"
          >
            카카오맵 길찾기
          </a>
        </div>
      `
    });

    infoWindows.push(infoWindow);

    window.closeKakaoInfoWindow = function () {
      infoWindows.forEach((infoWindow) => infoWindow.close());
    };
    kakao.maps.event.addListener(marker, "click", () => {
      infoWindows.forEach((window) => window.close());

      infoWindow.open(map, marker);

      map.setCenter(position);
      map.setLevel(3);
    });
  });
}

function openStoreModal(store) {
  const storeThemes = getStoreThemes(store.id);

  const modal = document.createElement("div");
  modal.className = "store-modal";

  modal.innerHTML = `
    <div class="store-modal-box">
      <button class="store-modal-close">×</button>

      <h2>${store.name}</h2>
      <p class="modal-address">${store.address}</p>

      <div class="modal-info">
        <p><strong>지역</strong> ${store.area || "확인 필요"}</p>
        <p><strong>화장실</strong> ${store.restroom || "확인 필요"}</p>
        <p><strong>주차</strong> ${store.parking || "확인 필요"}</p>
      </div>

      <div class="modal-theme-list">
        <h3>보유 테마</h3>

        ${
          storeThemes.length > 0
            ? storeThemes.map((theme) => {
                const people = getThemePeople(theme);

                return `
                  <div class="modal-theme-card">
                    <img src="${theme.image || ""}" alt="${theme.title}" />

                    <div>
                      <strong>${theme.title}</strong>
                      <p>${theme.genre || "장르 확인 필요"}</p>
                      <p>${people.join(", ")}명 추천</p>
                      <p>${theme.play_time || "플레이타임 확인 필요"}</p>
                      <p>${theme.price || "가격 확인 필요"}</p>
                    </div>
                  </div>
                `;
              }).join("")
            : "<p>등록된 테마가 없습니다.</p>"
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".store-modal-close").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

function openThemeModal(theme) {
  const store = stores.find((store) => {
    return Number(store.id) === Number(getThemeStoreId(theme));
  });

  if (!store) {
    alert("매장 정보를 찾을 수 없습니다.");
    return;
  }

  const people = getThemePeople(theme);
  const mapId = `themeModalMap-${theme.id || Date.now()}`;

  const kakaoMapUrl =
    `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.lat},${store.lng}`;

  const modal = document.createElement("div");
  modal.className = "store-modal";

  modal.innerHTML = `
    <div class="store-modal-box">
      <button class="store-modal-close">×</button>

      <img class="theme-detail-image" src="${theme.image || ""}" alt="${theme.title}" />

      <h2>${theme.title}</h2>

      <div class="modal-info">
        <p><strong>장르</strong> ${theme.genre || "확인 필요"}</p>
        <p><strong>추천 인원</strong> ${people.join(", ")}명</p>
        <p><strong>플레이타임</strong> ${theme.play_time || "확인 필요"}</p>
        <p><strong>가격</strong> ${theme.price || "확인 필요"}</p>
        <p><strong>매장</strong> ${store.name}</p>
      </div>

      <p class="modal-address">${store.address}</p>

      <div class="theme-action-buttons">
        <a href="${kakaoMapUrl}" target="_blank" class="theme-action-btn kakao-route-btn">
          카카오맵 길찾기
        </a>

        ${
          theme.reservation
            ? `
              <a href="${theme.reservation}" target="_blank" class="theme-action-btn reservation-route-btn">
                예약 사이트 바로가기
              </a>
            `
            : ""
        }
      </div>

      <div id="${mapId}" class="theme-modal-map"></div>
    </div>
  `;

  document.body.appendChild(modal);
  const detailImage = modal.querySelector(".clickable-theme-image");

if (detailImage) {
  detailImage.addEventListener("click", () => {
    openImageViewer(theme.image);
  });
}

  modal.querySelector(".store-modal-close").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });

  if (window.kakao && kakao.maps) {
    setTimeout(() => {
      const lat = Number(store.lat);
      const lng = Number(store.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const position = new kakao.maps.LatLng(lat, lng);
      const modalMapContainer = document.getElementById(mapId);

      const modalMap = new kakao.maps.Map(modalMapContainer, {
        center: position,
        level: 3
      });

      const marker = new kakao.maps.Marker({
        position
      });

      marker.setMap(modalMap);
    }, 300);
  }
}

function renderStores(filteredStores) {
  storeList.innerHTML = "";

  if (filteredStores.length === 0) {
    storeList.innerHTML = `
      <div class="store-item">
        <strong>검색 결과가 없습니다</strong>
      </div>
    `;
    return;
  }

  filteredStores.forEach((store) => {
    const item = document.createElement("div");
    item.className = "store-item";

    item.innerHTML = `
      <strong class="store-name">${store.name}</strong>
      <p>${store.address}</p>
    `;

    item.addEventListener("click", () => {
      const lat = Number(store.lat);
      const lng = Number(store.lng);

      if (!Number.isNaN(lat) && !Number.isNaN(lng) && map) {
        map.setCenter(new kakao.maps.LatLng(lat, lng));
        map.setLevel(3);
      }

      openStoreModal(store);
    });

    storeList.appendChild(item);
  });
}

function showAllStores(filteredStores = stores) {
  renderStores(filteredStores);
  renderMarkers(filteredStores);
}

function searchStores() {
  const keyword = normalizeText(searchBox.value);

  if (!keyword) {
    showAllStores(stores);
    return;
  }

  const expandedKeywords = expandKeyword(keyword);

  const filteredStores = stores.filter((store) => {
    const searchableText = normalizeText(`
      ${store.name || ""}
      ${store.aliases || ""}
      ${store.area || ""}
      ${store.address || ""}
    `);

    return expandedKeywords.some((expandedKeyword) => {
      return searchableText.includes(expandedKeyword);
    });
  });

  showAllStores(filteredStores);
}

function recommendTheme() {
  const selectedArea = locationSelect.value;
  const selectedPeople = Number(peopleSelect.value);
  const selectedGenre = genreSelect.value;

  if (!selectedPeople) {
    resultBox.innerHTML = "인원을 선택해주세요.";
    return;
  }

  const matchedThemes = themes.filter((theme) => {
    const store = stores.find((store) => {
      return Number(store.id) === Number(getThemeStoreId(theme));
    });

    if (!store) return false;

    const people = getThemePeople(theme);

    const areaMatched = selectedArea
      ? normalizeText(store.area) === normalizeText(selectedArea)
      : true;

    const genreMatched = selectedGenre
      ? normalizeText(theme.genre).includes(normalizeText(selectedGenre))
      : true;

    return (
      areaMatched &&
      people.includes(selectedPeople) &&
      genreMatched
    );
  });

  if (matchedThemes.length === 0) {
    resultBox.innerHTML = `
      조건에 맞는 테마가 없습니다.
    `;
    return;
  }

  resultBox.innerHTML = "";

  matchedThemes.forEach((theme) => {
    const store = stores.find((store) => {
      return Number(store.id) === Number(getThemeStoreId(theme));
    });

    const item = document.createElement("div");
    item.className = "recommend-result-item";

    item.innerHTML = `
      <strong>${theme.title}</strong>
      <p>${store.name} · ${store.area} · ${theme.genre}</p>
    `;

    item.addEventListener("click", () => {
      openThemeModal(theme);
    });

    resultBox.appendChild(item);
  });
  function openImageViewer(imageUrl) {
  if (!imageUrl) return;

  const viewer = document.createElement("div");
  viewer.className = "store-modal";

  viewer.innerHTML = `
    <div class="image-modal-box">
      <button class="image-modal-close">×</button>

      <img
        src="${imageUrl}"
        alt="확대 이미지"
        class="image-modal-img"
      />
    </div>
  `;

  document.body.appendChild(viewer);

  viewer.querySelector(".image-modal-close")
    .addEventListener("click", () => {
      viewer.remove();
    });

  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      viewer.remove();
    }
  });
  
}
}

searchBox.addEventListener("input", searchStores);
recommendButton.addEventListener("click", recommendTheme);

startApp();
const API_URL = "https://room-escape.onrender.com";

const locationSelect = document.querySelector("#location");
const peopleSelect = document.querySelector("#people");
const genreSelect = document.querySelector("#genre");
const recommendButton = document.querySelector(".recommend-btn");
const resultBox = document.querySelector("#result");
const storeList = document.querySelector("#storeList");

let stores = [];
let themes = [];
let markers = [];

const map = L.map("map").setView([37.500223, 127.025402], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const searchBox = document.createElement("input");
searchBox.className = "store-search";
searchBox.placeholder = "매장명이나 지역을 검색해보세요";

storeList.parentElement.insertBefore(searchBox, storeList);

async function loadData() {
  try {
    const storeResponse = await fetch(`${API_URL}/stores`);
    const themeResponse = await fetch(`${API_URL}/themes`);

    stores = await storeResponse.json();
    themes = await themeResponse.json();

    showAllStores(stores);
  } catch (error) {
    console.error(error);
    storeList.innerHTML = `
      <div class="store-item">
        <strong>데이터를 불러오지 못했습니다</strong>
        <p>백엔드 서버가 켜져 있는지 확인해주세요.</p>
      </div>
    `;
  }
}

function clearMarkers() {
  markers.forEach((marker) => marker.remove());
  markers = [];
}

function getStoreThemes(storeId) {
  return themes.filter((theme) => theme.storeId === storeId);
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
        <p><strong>지역</strong> ${store.area}</p>
        <p><strong>화장실</strong> ${store.restroom}</p>
        <p><strong>주차</strong> ${store.parking}</p>
      </div>

      <div class="modal-theme-list">
        <h3>보유 테마</h3>

        ${
          storeThemes.length > 0
            ? storeThemes
                .map((theme) => {
                  return `
                    <div class="modal-theme-card">
                      <img src="${theme.image}" alt="${theme.title}" />

                      <div>
                        <strong>${theme.title}</strong>
                        <p>${theme.genre}</p>
                        <p>${theme.people.join(", ")}명 추천</p>
                      </div>
                    </div>
                  `;
                })
                .join("")
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

  map.setView([store.lat, store.lng], 16);
}

function renderStores(filteredStores) {
  storeList.innerHTML = "";

  if (filteredStores.length === 0) {
    storeList.innerHTML = `
      <div class="store-item">
        <strong>검색 결과가 없습니다</strong>
        <p>다른 검색어를 입력해주세요.</p>
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

    item.querySelector(".store-name").addEventListener("click", () => {
      openStoreModal(store);
    });

    storeList.appendChild(item);
  });
}

function renderMarkers(filteredStores) {
  clearMarkers();

  filteredStores.forEach((store) => {
    const marker = L.marker([store.lat, store.lng])
      .addTo(map)
      .bindPopup(`
        <strong>${store.name}</strong><br />
        ${store.address}
      `);

    markers.push(marker);
  });

  if (filteredStores.length === 1) {
    map.setView([filteredStores[0].lat, filteredStores[0].lng], 16);
  }

  if (filteredStores.length > 1) {
    const bounds = L.latLngBounds(
      filteredStores.map((store) => [store.lat, store.lng])
    );

    map.fitBounds(bounds, {
      padding: [40, 40]
    });
  }
}

function showAllStores(filteredStores = stores) {
  renderStores(filteredStores);
  renderMarkers(filteredStores);
}

function searchStores() {
  const keyword = searchBox.value.trim().toLowerCase();

  if (!keyword) {
    showAllStores(stores);
    return;
  }

  const filteredStores = stores.filter((store) => {
    return (
      store.name.toLowerCase().includes(keyword) ||
      store.area.toLowerCase().includes(keyword) ||
      store.address.toLowerCase().includes(keyword)
    );
  });

  showAllStores(filteredStores);
}

function recommendTheme() {
  const selectedArea = locationSelect.value;
  const selectedPeople = Number(peopleSelect.value);
  const selectedGenre = genreSelect.value;

  if (!selectedPeople || !selectedGenre) {
    resultBox.innerHTML = "인원과 장르를 선택해주세요.";
    return;
  }

  const matchedThemes = themes.filter((theme) => {
    const store = stores.find((store) => store.id === theme.storeId);

    const areaMatched = selectedArea ? store.area === selectedArea : true;

    return (
      areaMatched &&
      theme.people.includes(selectedPeople) &&
      theme.genre.includes(selectedGenre)
    );
  });

  if (matchedThemes.length === 0) {
    resultBox.innerHTML = `
      조건에 맞는 테마가 없습니다.<br />
      다른 조건으로 다시 검색해보세요.
    `;
    return;
  }

  resultBox.innerHTML = matchedThemes
    .map((theme) => {
      const store = stores.find((store) => store.id === theme.storeId);

      return `
        <strong>${theme.title}</strong><br />
        ${store.name} · ${store.area} · ${theme.genre}
      `;
    })
    .join("<br /><br />");
}

searchBox.addEventListener("input", searchStores);
recommendButton.addEventListener("click", recommendTheme);

loadData();
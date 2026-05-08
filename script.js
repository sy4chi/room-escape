const locationSelect = document.querySelector("#location");
const peopleSelect = document.querySelector("#people");
const fearSelect = document.querySelector("#fear");
const recommendButton = document.querySelector(".recommend-btn");
const resultBox = document.querySelector("#result");
const storeList = document.querySelector("#storeList");

const stores = [
  {
    id: 1,
    name: "후즈데어",
    area: "강남",
    address: "서울특별시 서초구 서초대로77길 27 지하 1층",
    lat: 37.500223,
    lng: 127.025402,
    restroom: "유",
    parking: "주차 불가"
  }
];

const themes = [
  {
    title: "아야코",
    storeId: 1,
    people: [2, 3],
    fear: "높음",
    genre: "드라마/스릴러",
    image: "images/ayako.jpeg"
  },

  {
    title: "투투 어드벤쳐",
    storeId: 1,
    people: [2, 3],
    fear: "높음",
    genre: "어드벤쳐",
    image: "images/tutu-adventure.jpeg"
  }
];

const map = L.map("map").setView(
  [37.500223, 127.025402],
  16
);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      "&copy; OpenStreetMap contributors"
  }
).addTo(map);

let markers = [];

function clearMarkers() {

  markers.forEach(marker => marker.remove());

  markers = [];
}

function getStoreThemes(storeId) {

  return themes.filter(
    theme => theme.storeId === storeId
  );
}

function openStoreModal(store) {

  const storeThemes =
    getStoreThemes(store.id);

  const modal =
    document.createElement("div");

  modal.className = "store-modal";

  modal.innerHTML = `
    <div class="store-modal-box">

      <button class="store-modal-close">
        ×
      </button>

      <h2>${store.name}</h2>

      <p class="modal-address">
        ${store.address}
      </p>

      <div class="modal-info">

        <p>
          <strong>화장실</strong>
          ${store.restroom}
        </p>

        <p>
          <strong>주차</strong>
          ${store.parking}
        </p>

      </div>

      <div class="modal-theme-list">

        <h3>보유 테마</h3>

        ${
          storeThemes.length > 0
            ? storeThemes.map(theme => `
                <div class="modal-theme-card">

                  <img
                    src="${theme.image}"
                    alt="${theme.title}"
                  />

                  <div>

                    <strong>
                      ${theme.title}
                    </strong>

                    <p>
                      ${theme.genre}
                    </p>

                    <p>
                      ${theme.people.join(", ")}명 추천 ·
                      ${theme.fear} 공포도
                    </p>

                  </div>

                </div>
              `).join("")
            : "<p>등록된 테마가 없습니다.</p>"
        }

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn =
    modal.querySelector(
      ".store-modal-close"
    );

  closeBtn.addEventListener(
    "click",
    () => {
      modal.remove();
    }
  );

  modal.addEventListener(
    "click",
    event => {

      if (event.target === modal) {
        modal.remove();
      }
    }
  );

  map.setView(
    [store.lat, store.lng],
    16
  );
}

function renderStores(filteredStores) {

  storeList.innerHTML = "";

  if (filteredStores.length === 0) {

    storeList.innerHTML = `
      <div class="store-item">

        <strong>
          표시할 매장이 없습니다
        </strong>

        <p>
          조건을 다시 선택해주세요.
        </p>

      </div>
    `;

    return;
  }

  filteredStores.forEach(store => {

    const item =
      document.createElement("div");

    item.className = "store-item";

    item.innerHTML = `
      <strong class="store-name">
        ${store.name}
      </strong>

      <p>
        ${store.address}
      </p>
    `;

    item.querySelector(
      ".store-name"
    ).addEventListener(
      "click",
      () => {
        openStoreModal(store);
      }
    );

    storeList.appendChild(item);
  });
}

function renderMarkers(filteredStores) {

  clearMarkers();

  filteredStores.forEach(store => {

    const marker =
      L.marker([
        store.lat,
        store.lng
      ])
      .addTo(map)
      .bindPopup(`
        <strong>${store.name}</strong><br />
        ${store.address}
      `);

    markers.push(marker);
  });

  if (filteredStores.length === 1) {

    map.setView(
      [
        filteredStores[0].lat,
        filteredStores[0].lng
      ],
      16
    );
  }
}

function showStores(filteredStores = stores) {

  renderStores(filteredStores);

  renderMarkers(filteredStores);
}

function recommendTheme() {

  const selectedArea =
    locationSelect.value;

  const selectedPeople =
    Number(peopleSelect.value);

  const selectedFear =
    fearSelect.value;

  if (
    !selectedPeople ||
    !selectedFear
  ) {

    resultBox.innerHTML =
      "인원과 공포도를 선택해주세요.";

    return;
  }

  const matchedThemes =
    themes.filter(theme => {

      const store =
        stores.find(
          store =>
            store.id === theme.storeId
        );

      const areaMatched =
        selectedArea
          ? store.area === selectedArea
          : true;

      return (
        areaMatched &&
        theme.people.includes(
          selectedPeople
        ) &&
        theme.fear === selectedFear
      );
    });

  const uniqueStores = [
    ...new Map(
      matchedThemes.map(theme => {

        const store =
          stores.find(
            store =>
              store.id === theme.storeId
          );

        return [
          store.id,
          store
        ];
      })
    ).values()
  ];

  showStores(uniqueStores);

  if (matchedThemes.length === 0) {

    resultBox.innerHTML = `
      조건에 맞는 테마가 없습니다.<br />
      다른 조건으로 다시 검색해보세요.
    `;

    return;
  }

  resultBox.innerHTML =
    matchedThemes.map(theme => {

      const store =
        stores.find(
          store =>
            store.id === theme.storeId
        );

      return `
        <strong>
          ${theme.title}
        </strong><br />

        ${store.name} ·
        ${theme.genre} ·
        ${theme.fear} 공포도
      `;
    }).join("<br /><br />");
}

locationSelect.addEventListener(
  "change",
  () => {

    const selectedArea =
      locationSelect.value;

    if (!selectedArea) {

      showStores(stores);

      return;
    }

    const filteredStores =
      stores.filter(
        store =>
          store.area === selectedArea
      );

    showStores(filteredStores);
  }
);

recommendButton.addEventListener(
  "click",
  recommendTheme
);

showStores();
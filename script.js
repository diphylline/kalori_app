document.addEventListener("DOMContentLoaded", async function () {
  // === BAGIAN 1: STATE APLIKASI & OTENTIKASI ===
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "/";
    return;
  }
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  let currentlyEditingItem = null;
  let totalKalori = 0;

  // Fungsi untuk membuat header otentikasi
  function getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // Cek sesi & tampilkan info user
  try {
    const sessionResponse = await fetch("/me", { headers: getAuthHeaders() });
    if (!sessionResponse.ok) throw new Error("Sesi tidak valid");
    const sessionData = await sessionResponse.json();
    currentUser = sessionData.user;
    document.getElementById("username-display").textContent =
      currentUser.username;
    document.getElementById("target-kalori").textContent =
      currentUser.target_kalori || "2000";
  } catch (error) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = "/";
    return;
  }

  // === BAGIAN 2: MENGAMBIL SEMUA ELEMEN HTML ===
  const kaloriMasukEl = document.getElementById("kalori-masuk");
  const daftarMakananElements = {
    sarapan: document.getElementById("daftar-sarapan"),
    "makan-siang": document.getElementById("daftar-makan-siang"),
    "makan-malam": document.getElementById("daftar-makan-malam"),
  };
  const modalTambah = document.getElementById("modal-tambah-makanan");
  const modalDetail = document.getElementById("modal-detail");
  const formTambahMakanan = document.getElementById("form-tambah-makanan");
  const tombolBukaModal = document.querySelectorAll(".tombol-tambah");
  const semuaTombolTutup = document.querySelectorAll(".tutup-modal");
  const tombolLogout = document.getElementById("tombol-logout");
  const tombolEdit = document.getElementById("tombol-edit-dari-detail");
  const tombolHapus = document.getElementById("tombol-hapus-dari-detail");
  const inputPencarian = document.getElementById("input-pencarian");
  const tombolCari = document.getElementById("tombol-cari");
  const wadahHasilPencarian = document.getElementById("wadah-hasil-pencarian");

  // === BAGIAN 3: FUNGSI-FUNGSI APLIKASI ===
  function perbaruiTotalKalori() {
    kaloriMasukEl.textContent = Math.round(totalKalori);
  }

  function tambahMakananKeUI(makanan) {
    const itemLi = document.createElement("li");
    itemLi.innerHTML = `<span>${makanan.nama}</span><span>${Math.round(
      makanan.kalori
    )} kkal</span>`;
    itemLi.style.cursor = "pointer";
    itemLi.addEventListener("click", () => bukaModalDetail(makanan));
    daftarMakananElements[makanan.waktu].appendChild(itemLi);
  }

  async function muatDataMakanan() {
    try {
      const response = await fetch("/semua-makanan", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      totalKalori = 0;
      Object.values(daftarMakananElements).forEach((ul) => (ul.innerHTML = ""));
      if (result.status === "sukses") {
        result.data.forEach((makanan) => {
          tambahMakananKeUI(makanan);
          totalKalori += makanan.kalori;
        });
      }
      perbaruiTotalKalori();
    } catch (error) {
      console.error("Gagal memuat data makanan:", error);
    }
  }

  function tampilkanHasilPencarian(foods) {
    wadahHasilPencarian.innerHTML = "";

    if (!foods || foods.length === 0) {
      wadahHasilPencarian.innerHTML = "<p>Makanan tidak ditemukan.</p>";
      return;
    }

    foods.forEach((food) => {
      const namaMakanan = food.food_name || "Nama tidak tersedia";
      const deskripsi = food.food_description || "Deskripsi tidak tersedia";

      // Extract kalori dari food_description (format: "Per 1 serving - Calories: 644kcal | Fat: 35g...")
      let kaloriInfo = "0";
      if (deskripsi) {
        const kaloriMatch = deskripsi.match(/Calories:\s*(\d+)/i);
        if (kaloriMatch) {
          kaloriInfo = kaloriMatch[1];
        }
      }

      // Extract serving info dari description
      let servingInfo = "porsi";
      const servingMatch = deskripsi.match(/Per\s+([^-]+)/i);
      if (servingMatch) {
        servingInfo = servingMatch[1].trim();
      }

      const itemDiv = document.createElement("div");
      itemDiv.className = "item-hasil-pencarian";
      itemDiv.innerHTML = `
            <div>
                <strong>${namaMakanan}</strong><br>
                <small>Per ${servingInfo} - ${kaloriInfo} kkal</small>
            </div>
            <button class="tombol-pilih-makanan" 
                    data-nama="${namaMakanan}" 
                    data-kalori="${kaloriInfo}"
                    data-food-id="${food.food_id}"
                    data-deskripsi="${deskripsi}">
                Pilih
            </button>
        `;
      wadahHasilPencarian.appendChild(itemDiv);
    });
  }

  function bukaModalDetail(makanan) {
    currentlyEditingItem = makanan;
    document.getElementById("detail-makanan-info").innerHTML = `<strong>${
      makanan.nama
    }</strong><br>${Math.round(makanan.kalori)} kkal`;
    modalDetail.style.display = "block";
  }

  async function hapusMakanan() {
    if (!currentlyEditingItem) return;
    if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
      try {
        const response = await fetch(`/makanan/${currentlyEditingItem.id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const result = await response.json();
        if (result.status === "sukses") {
          muatDataMakanan();
        } else {
          alert(result.pesan);
        }
      } catch (error) {
        alert("Gagal menghapus data.");
      }
      modalDetail.style.display = "none";
    }
  }

  function siapkanModeEdit() {
    if (!currentlyEditingItem) return;
    modalDetail.style.display = "none";
    document.getElementById("modal-tambah-judul").textContent = "Edit Makanan";
    formTambahMakanan.querySelector('button[type="submit"]').textContent =
      "Simpan Perubahan";
    document.getElementById("edit-id").value = currentlyEditingItem.id;
    document.getElementById("nama-makanan").value = currentlyEditingItem.nama;
    document.getElementById("jumlah-kalori").value =
      currentlyEditingItem.kalori;
    document.getElementById("waktu-makan").value = currentlyEditingItem.waktu;
    modalTambah.style.display = "block";
  }

  function resetModalTambah() {
    currentlyEditingItem = null;
    document.getElementById("modal-tambah-judul").textContent =
      "Tambah Makanan";
    formTambahMakanan.querySelector('button[type="submit"]').textContent =
      "Simpan ke Catatan";
    document.getElementById("edit-id").value = "";
    formTambahMakanan.reset();
    wadahHasilPencarian.innerHTML = "";
    inputPencarian.value = "";
  }

  // === BAGIAN 4: EVENT LISTENERS ===
  tombolLogout.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  });

  tombolEdit.addEventListener("click", siapkanModeEdit);
  tombolHapus.addEventListener("click", hapusMakanan);

  tombolCari.addEventListener("click", async () => {
    const keyword = inputPencarian.value.trim();
    if (!keyword) return;

    wadahHasilPencarian.innerHTML = "<p>Mencari...</p>";

    try {
      const response = await fetch(`/cari-makanan?keyword=${keyword}`, {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (result.status === "sukses" && result.data.foods_search) {
        // Sesuaikan dengan struktur response FatSecret
        const foods = result.data.foods_search.food || [];
        tampilkanHasilPencarian(foods);
      } else {
        wadahHasilPencarian.innerHTML = `<p>${
          result.pesan || "Gagal mencari makanan."
        }</p>`;
      }
    } catch (error) {
      console.error("Error:", error);
      wadahHasilPencarian.innerHTML = "<p>Tidak bisa terhubung ke server.</p>";
    }
  });

  wadahHasilPencarian.addEventListener("click", function (event) {
    if (event.target.classList.contains("tombol-pilih-makanan")) {
      document.getElementById("nama-makanan").value = event.target.dataset.nama;
      document.getElementById("jumlah-kalori").value = Math.round(
        parseFloat(event.target.dataset.kalori)
      );
      wadahHasilPencarian.innerHTML = "";
      inputPencarian.value = "";
    }
  });

  tombolBukaModal.forEach((tombol) => {
    tombol.addEventListener("click", () => {
      resetModalTambah();
      modalTambah.style.display = "block";
    });
  });

  semuaTombolTutup.forEach((tombol) => {
    tombol.addEventListener("click", () => {
      modalTambah.style.display = "none";
      modalDetail.style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target == modalTambah || e.target == modalDetail) {
      modalTambah.style.display = "none";
      modalDetail.style.display = "none";
    }
  });

  formTambahMakanan.addEventListener("submit", async function (e) {
    e.preventDefault();
    const editId = document.getElementById("edit-id").value;
    const data = {
      nama: document.getElementById("nama-makanan").value,
      kalori: parseInt(document.getElementById("jumlah-kalori").value),
      waktu: document.getElementById("waktu-makan").value,
    };
    const url = editId ? `/makanan/${editId}` : "/tambah-makanan";
    const method = editId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.status === "sukses") {
        muatDataMakanan();
        modalTambah.style.display = "none";
      } else {
        alert(result.pesan);
      }
    } catch (error) {
      alert("Gagal menyimpan data.");
    }
  });

  // === BAGIAN 5: INISIALISASI HALAMAN ===
  muatDataMakanan();
});

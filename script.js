document.addEventListener('DOMContentLoaded', async function() {
    // --- State Aplikasi ---
    let currentUser = null;
    let currentlyEditingItem = null;
    let totalKalori = 0;

    // --- Fungsi Otentikasi & Inisialisasi ---
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    function getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    try {
        const sessionResponse = await fetch('/me', { headers: getAuthHeaders() });
        if (!sessionResponse.ok) throw new Error('Sesi tidak valid');
        const sessionData = await sessionResponse.json();
        
        currentUser = sessionData.user;
        document.getElementById('username-display').textContent = currentUser.username;
        document.getElementById('target-kalori').textContent = currentUser.target_kalori || '2000';
    } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
        return;
    }
    
    // --- Mengambil Elemen HTML ---
    const kaloriMasukEl = document.getElementById('kalori-masuk');
    const daftarMakananElements = {
        sarapan: document.getElementById('daftar-sarapan'),
        'makan-siang': document.getElementById('daftar-makan-siang'),
        'makan-malam': document.getElementById('daftar-makan-malam')
    };
    const modalTambah = document.getElementById('modal-tambah-makanan');
    const modalDetail = document.getElementById('modal-detail');
    const formTambahMakanan = document.getElementById('form-tambah-makanan');
    const tombolBukaModal = document.querySelectorAll('.tombol-tambah');
    const semuaTombolTutup = document.querySelectorAll('.tutup-modal');
    const tombolLogout = document.getElementById('tombol-logout');
    const tombolEdit = document.getElementById('tombol-edit-dari-detail');
    const tombolHapus = document.getElementById('tombol-hapus-dari-detail');

    // --- Fungsi-Fungsi Aplikasi ---
    function perbaruiTotalKalori() { kaloriMasukEl.textContent = Math.round(totalKalori); }

    function tambahMakananKeUI(makanan) {
        const itemLi = document.createElement('li');
        itemLi.innerHTML = `<span>${makanan.nama}</span><span>${Math.round(makanan.kalori)} kkal</span>`;
        itemLi.style.cursor = 'pointer';
        itemLi.addEventListener('click', () => bukaModalDetail(makanan));
        daftarMakananElements[makanan.waktu].appendChild(itemLi);
    }

    async function muatDataMakanan() {
        try {
            const response = await fetch('/semua-makanan', { headers: getAuthHeaders() });
            const result = await response.json();
            totalKalori = 0;
            Object.values(daftarMakananElements).forEach(ul => ul.innerHTML = '');
            if (result.status === 'sukses') {
                result.data.forEach(makanan => {
                    tambahMakananKeUI(makanan);
                    totalKalori += makanan.kalori;
                });
            }
            perbaruiTotalKalori();
        } catch (error) { console.error('Gagal memuat data makanan:', error); }
    }
    
    function bukaModalDetail(makanan) {
        currentlyEditingItem = makanan;
        document.getElementById('detail-makanan-info').innerHTML = `<strong>${makanan.nama}</strong><br>${Math.round(makanan.kalori)} kkal`;
        modalDetail.style.display = 'block';
    }

    async function hapusMakanan() {
        if (!currentlyEditingItem) return;
        if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
            try {
                const response = await fetch(`/makanan/${currentlyEditingItem.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                const result = await response.json();
                if (result.status === 'sukses') {
                    muatDataMakanan();
                } else { alert(result.pesan); }
            } catch (error) { alert('Gagal menghapus data.'); }
            modalDetail.style.display = 'none';
        }
    }
    
    function siapkanModeEdit() {
        if (!currentlyEditingItem) return;
        modalDetail.style.display = 'none';
        document.getElementById('modal-tambah-judul').textContent = 'Edit Makanan';
        formTambahMakanan.querySelector('button[type="submit"]').textContent = 'Simpan Perubahan';
        document.getElementById('edit-id').value = currentlyEditingItem.id;
        document.getElementById('nama-makanan').value = currentlyEditingItem.nama;
        document.getElementById('jumlah-kalori').value = currentlyEditingItem.kalori;
        document.getElementById('waktu-makan').value = currentlyEditingItem.waktu;
        modalTambah.style.display = 'block';
    }

    function resetModalTambah() {
        currentlyEditingItem = null;
        document.getElementById('modal-tambah-judul').textContent = 'Tambah Makanan';
        formTambahMakanan.querySelector('button[type="submit"]').textContent = 'Simpan ke Catatan';
        document.getElementById('edit-id').value = '';
        formTambahMakanan.reset();
    }

    // --- Event Listeners ---
    tombolLogout.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    });
    
    tombolEdit.addEventListener('click', siapkanModeEdit);
    tombolHapus.addEventListener('click', hapusMakanan);

    tombolBukaModal.forEach(tombol => {
        tombol.addEventListener('click', () => {
            resetModalTambah();
            modalTambah.style.display = 'block';
        });
    });

    semuaTombolTutup.forEach(tombol => {
        tombol.addEventListener('click', () => {
            modalTambah.style.display = 'none';
            modalDetail.style.display = 'none';
        });
    });

    formTambahMakanan.addEventListener('submit', async function(e) {
        e.preventDefault();
        const editId = document.getElementById('edit-id').value;
        const data = {
            nama: document.getElementById('nama-makanan').value,
            kalori: parseInt(document.getElementById('jumlah-kalori').value),
            waktu: document.getElementById('waktu-makan').value
        };
        const url = editId ? `/makanan/${editId}` : '/tambah-makanan';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.status === 'sukses') {
                muatDataMakanan();
                modalTambah.style.display = 'none';
            } else { alert(result.pesan); }
        } catch (error) { alert('Gagal menyimpan data.'); }
    });

    // --- Inisialisasi Halaman ---
    muatDataMakanan();
});
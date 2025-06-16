document.addEventListener('DOMContentLoaded', function() {
    // Pastikan pengguna sudah login
    fetch('/check-session', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (!data.isLoggedIn) {
                window.location.href = '/';
            }
        });

    const tdeeForm = document.getElementById('tdee-form');
    const goalSection = document.getElementById('goal-section');
    const tdeeDisplay = document.getElementById('tdee-display');
    const goalForm = document.getElementById('goal-form');
    const hasilKalkulasiEl = document.getElementById('hasil-kalkulasi');
    let tdeeResult = 0;

    // Event listener untuk form TDEE
    tdeeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const gender = document.getElementById('gender').value;
        const age = parseInt(document.getElementById('age').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseInt(document.getElementById('height').value);
        const activityLevel = parseFloat(document.getElementById('activity-level').value);

        let bmr = (gender === 'male') 
            ? (10 * weight + 6.25 * height - 5 * age + 5)
            : (10 * weight + 6.25 * height - 5 * age - 161);

        tdeeResult = Math.round(bmr * activityLevel);

        tdeeDisplay.textContent = `${tdeeResult} kkal`;
        goalSection.classList.remove('hidden');
        hasilKalkulasiEl.textContent = '';
    });

    // Event listener untuk form tujuan
    goalForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const adjustment = parseInt(document.getElementById('goal-select').value);
        const targetKalori = tdeeResult + adjustment;
        const goalSelect = document.getElementById('goal-select');
        const goalText = goalSelect.options[goalSelect.selectedIndex].text;

        hasilKalkulasiEl.innerHTML = `
            Kebutuhan Kalori Dasar (TDEE): ${tdeeResult} kkal<br>
            Penyesuaian Target (${goalText}): ${adjustment >= 0 ? '+' : ''}${adjustment} kkal<br>
            <strong>Target Kalori Harian Baru Anda: ${targetKalori} kkal</strong>
        `;

        try {
            const response = await fetch('/update-target-kalori', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetKalori }),
                credentials: 'include'
            });
            const result = await response.json();
            if (result.status === 'sukses') {
                localStorage.setItem('targetKaloriBaru', targetKalori);
                alert('Target kalori berhasil diperbarui!');
            } else {
                alert('Gagal memperbarui target kalori.');
            }
        } catch (error) {
            alert('Tidak bisa terhubung ke server.');
        }
    });
});
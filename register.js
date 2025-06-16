document.getElementById('register-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessageEl = document.getElementById('error-message');

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (result.status === 'sukses') {
            alert('Registrasi berhasil! Silakan login dengan akun Anda.');
            window.location.href = '/';
        } else {
            errorMessageEl.textContent = result.pesan;
        }
    } catch (error) {
        errorMessageEl.textContent = 'Tidak bisa terhubung ke server. Coba lagi nanti.';
    }
});
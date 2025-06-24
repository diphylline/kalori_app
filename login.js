document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessageEl = document.getElementById('error-message');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.status === 'sukses') {
           
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            window.location.href = '/dashboard.html';
        } else {
            errorMessageEl.textContent = result.pesan;
        }
    } catch (error) {
        errorMessageEl.textContent = 'Tidak bisa terhubung ke server.';
    }
});
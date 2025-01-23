document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form[data-convertkit]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('input[type="email"]').value;
            
            try {
                const response = await fetch('https://api.convertkit.com/v3/forms/YOUR_FORM_ID/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_key: 'YOUR_API_KEY', // Move this to environment variables in production
                        email: email
                    })
                });
                
                if (response.ok) {
                    form.innerHTML = '<p>Thanks for subscribing!</p>';
                } else {
                    throw new Error('Subscription failed');
                }
            } catch (error) {
                console.error('Error:', error);
                form.innerHTML += '<p style="color: red;">Sorry, there was an error. Please try again.</p>';
            }
        });
    });
}); 
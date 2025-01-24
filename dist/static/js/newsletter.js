// Newsletter form functionality
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.newsletter-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = form.querySelector('input[type="email"]').value;
            const button = form.querySelector('button');
            const originalButtonText = button.textContent;
            
            try {
                button.textContent = 'Subscribing...';
                button.disabled = true;
                
                // Here you would typically send the email to your backend
                // For now, we'll just simulate a successful subscription
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                alert('Thanks for subscribing!');
                form.reset();
            } catch (error) {
                alert('Sorry, there was an error. Please try again.');
            } finally {
                button.textContent = originalButtonText;
                button.disabled = false;
            }
        });
    }
}); 
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const validateField = (field) => {
        const value = field.value.trim();
        const errorElement = form.querySelector(`[data-error="${field.id}"]`);
        
        if (!value) {
            errorElement.textContent = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required`;
            return false;
        }
        
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errorElement.textContent = 'Please enter a valid email address';
            return false;
        }
        
        errorElement.textContent = '';
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const fields = form.querySelectorAll('input, textarea');
        let isValid = true;
        fields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) return;

        // Show loading state
        const submitButton = form.querySelector('.submit-button');
        submitButton.classList.add('loading');
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                // Show success message
                form.innerHTML = `
                    <div class="success-message">
                        <h3>Thank you for your message!</h3>
                        <p>I'll get back to you as soon as possible.</p>
                    </div>
                `;
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            submitButton.classList.remove('loading');
            alert('Sorry, there was an error sending your message. Please try again.');
        }
    };

    // Add validation on blur
    form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
    });

    // Handle form submission
    form.addEventListener('submit', handleSubmit);
}); 
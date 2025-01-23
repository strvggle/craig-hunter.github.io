// Simple theme toggle with localStorage
function initTheme() {
    const toggle = document.querySelector('.theme-toggle');
    
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Toggle theme
    toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Save to localStorage and update theme
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initTheme); 
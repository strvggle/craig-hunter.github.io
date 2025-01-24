const { marked } = require('marked');
const fs = require('fs').promises;
const path = require('path');
const dayjs = require('dayjs');
const yaml = require('js-yaml');

// Configure marked
marked.use({
    headerIds: false,
    mangle: false
});

// Add reading time calculation
function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// Add date formatting
function formatDate(date) {
    return dayjs(date).format('MMMM D, YYYY');
}

// Parse front matter
function parseFrontMatter(content) {
    const match = content.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
    if (!match) return { data: {}, content, excerpt: '' };
    
    const [, frontmatter, markdown] = match;
    const data = yaml.load(frontmatter);
    const excerpt = markdown.trim().split('\n')[0];
    
    return { data, content: markdown, excerpt };
}

async function buildSite() {
    try {
        console.log('Starting build process...');
        
        // Read templates
        console.log('Reading templates...');
        const baseTemplate = await fs.readFile('src/templates/base.html', 'utf-8');

        // Create dist directory
        console.log('Creating dist directory...');
        await fs.mkdir('dist', { recursive: true });
        await fs.mkdir('dist/static/css', { recursive: true });
        await fs.mkdir('dist/static/js', { recursive: true });
        await fs.mkdir('dist/blog', { recursive: true });

        // Create a simple index page
        const indexHtml = baseTemplate
            .replace('{{title}}', 'Home')
            .replace('{{content}}', '<h1>Welcome to Craig Hunter\'s Website</h1><p>This site is under construction.</p>');
        
        await fs.writeFile('dist/index.html', indexHtml);

        // Copy static files
        console.log('Copying static files...');
        try {
            await fs.copyFile('src/static/css/style.css', 'dist/static/css/style.css');
            await fs.copyFile('src/static/js/newsletter.js', 'dist/static/js/newsletter.js');
            await fs.copyFile('src/static/js/contact.js', 'dist/static/js/contact.js');
            await fs.copyFile('src/static/js/theme.js', 'dist/static/js/theme.js');
        } catch (err) {
            console.warn('Some static files could not be copied:', err.message);
        }

        console.log('Build complete!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

buildSite(); 
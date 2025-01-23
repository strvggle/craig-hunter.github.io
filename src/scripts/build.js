process.on('SIGINT', () => {
    console.log('Gracefully shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Gracefully shutting down...');
    process.exit(0);
});

const { marked } = require('marked');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
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

// Add this function before buildSite
function parseFrontMatter(content) {
    const match = content.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
    if (!match) return { data: {}, content, excerpt: '' };
    
    const [, frontmatter, markdown] = match;
    const data = yaml.load(frontmatter);
    const excerpt = markdown.trim().split('\n')[0];
    
    return { data, content: markdown, excerpt };
}

async function generateNewsletter() {
    return `
        <form class="newsletter-form" data-convertkit>
            <h3>Subscribe to the Newsletter</h3>
            <p>Get the latest posts delivered right to your inbox.</p>
            <input type="email" name="email" placeholder="Your email address" required>
            <button type="submit">Subscribe</button>
        </form>
    `;
}

async function generateContactForm() {
    return await fs.readFile('src/templates/contact-form.html', 'utf-8');
}

async function buildSite() {
    try {
        console.log('Starting build process...');
        
        // Read templates
        console.log('Reading templates...');
        const baseTemplate = await fs.readFile('src/templates/base.html', 'utf-8')
            .catch(err => {
                console.error('Error reading base template:', err);
                throw err;
            });

        // Create dist directory
        console.log('Creating dist directory...');
        await fs.mkdir('dist', { recursive: true })
            .catch(err => {
                console.error('Error creating dist directory:', err);
                throw err;
            });

        // Process static pages (index, about, contact)
        const staticPages = ['index', 'about', 'contact'];
        for (const page of staticPages) {
            console.log(`Processing ${page}.md...`);
            const content = await fs.readFile(`src/content/${page}.md`, 'utf-8')
                .catch(err => {
                    console.error(`Error reading ${page}.md:`, err);
                    throw err;
                });
                
            let html = marked(content);
            
            // Add components for specific pages
            if (page === 'index') {
                const newsletterForm = await generateNewsletter();
                const latestPosts = await generateLatestPosts();
                html = html
                    .replace('{{newsletter_form}}', newsletterForm)
                    .replace('{{latest_posts}}', latestPosts);
            }
            if (page === 'contact') {
                const contactForm = await generateContactForm();
                html = html.replace('{{contact_form}}', contactForm);
            }
            
            const finalHtml = baseTemplate
                .replace('{{title}}', page.charAt(0).toUpperCase() + page.slice(1))
                .replace('{{content}}', html);
            
            await fs.writeFile(`dist/${page}.html`, finalHtml);
        }

        // Process blog posts
        console.log('Processing blog posts...');
        const blogDir = path.join('src/content/blog');
        const blogFiles = await fs.readdir(blogDir);
        const blogPosts = [];

        // Create blog directory
        await fs.mkdir('dist/blog', { recursive: true });

        // Create blog index file
        await fs.writeFile('dist/blog/index.html', `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta http-equiv="refresh" content="0;url=/blog.html">
                </head>
            </html>
        `);

        const blogPostTemplate = await fs.readFile('src/templates/blog-post.html', 'utf-8');

        for (const file of blogFiles) {
            if (file.endsWith('.md')) {
                const content = await fs.readFile(path.join(blogDir, file), 'utf-8');
                const { data, content: postContent, excerpt } = parseFrontMatter(content);
                
                // Extract just the content without the title
                const contentLines = postContent.split('\n');
                const contentWithoutTitle = contentLines
                    .filter(line => !line.startsWith('# ')) // Remove any H1 titles
                    .join('\n')
                    .trim();
                
                const postHtml = marked(contentWithoutTitle);
                
                const post = {
                    title: data.title || file.replace('.md', ''),
                    date: data.date || new Date(),
                    tags: data.tags || [],
                    url: `/blog/${file.replace('.md', '.html')}`,
                    excerpt: excerpt,
                    readingTime: calculateReadingTime(content)
                };
                
                blogPosts.push(post);

                // Generate individual blog post page
                const finalPostHtml = baseTemplate
                    .replace('{{title}}', post.title)
                    .replace('{{content}}', blogPostTemplate
                        .replace('{{title}}', post.title)
                        .replace('{{date}}', post.date)
                        .replace('{{formatDate}}', formatDate(post.date))
                        .replace('{{readingTime}}', post.readingTime)
                        .replace('{{content}}', postHtml)
                        .replace('{{#if tags}}', post.tags && post.tags.length ? '' : '<!--')
                        .replace('{{/if}}', post.tags && post.tags.length ? '' : '-->')
                        .replace('{{#each tags}}', '')
                        .replace('{{/each}}', '')
                        .replace('{{this}}', post.tags ? post.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '')
                    );

                await fs.writeFile(`dist/blog/${file.replace('.md', '.html')}`, finalPostHtml);
            }
        }

        // Build blog list page
        console.log('Building blog list...');
        const sortedPosts = blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        await buildBlogList(sortedPosts);

        // Create static directories and copy files
        await fs.mkdir('dist/static/css', { recursive: true });
        await fs.mkdir('dist/static/js', { recursive: true });
        
        console.log('Copying static files...');
        await fs.copyFile('src/static/css/style.css', 'dist/static/css/style.css');
        await fs.copyFile('src/static/js/newsletter.js', 'dist/static/js/newsletter.js');
        await fs.copyFile('src/static/js/contact.js', 'dist/static/js/contact.js');
        await fs.copyFile('src/static/js/theme.js', 'dist/static/js/theme.js');
        
        console.log('Build complete!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

async function generateLatestPosts() {
    const blogDir = path.join('src/content/blog');
    const blogFiles = await fs.readdir(blogDir);
    const posts = [];

    for (const file of blogFiles) {
        if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(blogDir, file), 'utf-8');
            const { data } = parseFrontMatter(content);
            posts.push({
                title: data.title,
                url: `blog/${file.replace('.md', '.html')}`
            });
        }
    }

    // Sort posts by date and take the latest 5
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestPosts = posts.slice(0, 5);

    return `
        <ul class="post-list">
            ${latestPosts.map(post => `
                <li><a href="${post.url}">${post.title}</a></li>
            `).join('')}
        </ul>
    `;
}

async function buildBlogList(posts) {
    console.log('Building blog list with posts:', posts.length);
    const baseTemplate = await fs.readFile('src/templates/base.html', 'utf-8');
    const blogListTemplate = await fs.readFile('src/templates/blog-list.html', 'utf-8');
    
    const postsWithFormatting = posts.map(post => {
        console.log('Processing post:', post.title);
        return {
            ...post,
            formatDate: formatDate(post.date)
        };
    });

    const postsHtml = generatePostsList(postsWithFormatting);
    console.log('Generated HTML length:', postsHtml.length);

    let blogListHtml = blogListTemplate
        .replace('{{posts}}', postsHtml);

    const finalHtml = baseTemplate
        .replace('{{title}}', 'Blog')
        .replace('{{content}}', blogListHtml);

    await fs.writeFile('dist/blog.html', finalHtml);
    console.log('Blog list page written to dist/blog.html');
}

function generatePostsList(posts) {
    console.log('Generating posts list for:', posts.map(p => p.title));
    return posts.map(post => {
        const tagsHtml = post.tags ? `
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        ` : '';

        return `
            <article class="post-card">
                <time datetime="${post.date}">${post.formatDate}</time>
                <h2><a href="${post.url}">${post.title}</a></h2>
                <p class="excerpt">${post.excerpt || ''}</p>
                <div class="post-meta">
                    <span class="reading-time">${post.readingTime} min read</span>
                    ${tagsHtml}
                </div>
            </article>
        `;
    }).join('\n');
}

buildSite().catch(console.error); 
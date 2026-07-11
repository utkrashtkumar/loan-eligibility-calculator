'use client';

import Link from 'next/link';
import DOMPurify from 'dompurify'; // Security (F1): Prevent stored XSS in blog content
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogDetailClient({ blog, readTime }) {
  return (
    <>
      <Header />
      
      <main className="main-content" style={{ minHeight: '80vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Back button */}
          <div style={{ marginBottom: '32px' }}>
            <Link 
              href="/blog" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Articles
            </Link>
          </div>

          {/* Article Header */}
          <header style={{ marginBottom: '40px' }}>
            <h1 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', 
              fontWeight: 800, 
              color: 'var(--color-text-primary)', 
              lineHeight: 1.25, 
              marginBottom: '16px',
              letterSpacing: '-0.5px'
            }}>
              {blog.title}
            </h1>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: '16px', 
              fontSize: 'var(--text-xs)', 
              color: 'var(--color-text-secondary)',
              borderBottom: 'var(--border-subtle)',
              paddingBottom: '20px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                👤 By <strong>{blog.author || 'Admin'}</strong>
              </span>
              <span>•</span>
              <span>📅 {new Date(blog.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
              <span>•</span>
              <span>⏱️ {readTime} min read</span>
            </div>
          </header>

          {/* Cover Image */}
          {blog.cover_image && (
            <div style={{ 
              borderRadius: 'var(--border-radius-lg)', 
              overflow: 'hidden', 
              marginBottom: '40px',
              border: 'var(--border-light)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <img 
                src={blog.cover_image} 
                alt={blog.title} 
                style={{ width: '100%', height: 'auto', maxHeight: '450px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          {/* Article Content — Sanitized with DOMPurify to prevent stored XSS. */}
          <article 
            className="blog-content-body"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content, {
              USE_PROFILES: { html: true },
              FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
              FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
            }) }}
            style={{
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              lineHeight: 1.8,
              letterSpacing: '-0.1px'
            }}
          />

          {/* Custom style helper for article typography */}
          <style jsx global>{`
            .blog-content-body p {
              margin-bottom: 24px;
            }
            .blog-content-body h2 {
              font-family: var(--font-heading);
              font-size: var(--text-xl);
              font-weight: 700;
              margin-top: 40px;
              margin-bottom: 16px;
              color: var(--color-text-primary);
              letter-spacing: -0.3px;
            }
            .blog-content-body h3 {
              font-family: var(--font-heading);
              font-size: var(--text-lg);
              font-weight: 600;
              margin-top: 32px;
              margin-bottom: 12px;
              color: var(--color-text-primary);
            }
            .blog-content-body ul, .blog-content-body ol {
              margin-bottom: 24px;
              padding-left: 24px;
            }
            .blog-content-body li {
              margin-bottom: 8px;
            }
            .blog-content-body strong {
              color: var(--color-text-primary);
              font-weight: 700;
            }
            .blog-content-body blockquote {
              border-left: 4px solid var(--color-primary);
              padding-left: 20px;
              font-style: italic;
              margin: 32px 0;
              color: var(--color-text-secondary);
            }
          `}</style>

          {/* Bottom Divider & Navigation */}
          <div style={{ marginTop: '56px', borderTop: 'var(--border-subtle)', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link 
              href="/blog" 
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 20px' }}
            >
              ← Back to Blogs
            </Link>
            
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: blog.title,
                    url: window.location.href
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Article link copied to clipboard!');
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }}
            >
              🔗 Share Link
            </button>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

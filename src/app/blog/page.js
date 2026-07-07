'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogIndexPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPublishedBlogs() {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });
        if (!error) {
          setBlogs(data || []);
        }
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPublishedBlogs();
  }, []);

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="main-content" style={{ minHeight: '80vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Header Title Section */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="light-tag" style={{ color: 'var(--color-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 16px', borderRadius: '20px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '1px' }}>
              OUR BLOG
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginTop: '16px', background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
              Financial Insights & Guides
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '600px', margin: '12px auto 0', lineHeight: 1.6 }}>
              Stay updated with the latest loan trends, financial policy updates, smart money tips, and professional growth strategies.
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '56px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              <input
                id="blog-search-input"
                type="text"
                className="input-field"
                placeholder="Search articles by title or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px 16px 48px',
                  borderRadius: '12px',
                  background: 'var(--color-bg-glass-heavy)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.3s ease'
                }}
              />
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Blog Cards Grid */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Fetching articles...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>No Articles Found</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                We couldn&apos;t find any articles matching &ldquo;{searchQuery}&rdquo;. Try another search term.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
              gap: '32px'
            }}>
              {filteredBlogs.map((blog) => {
                const readTime = Math.max(1, Math.ceil(blog.content.split(/\s+/).length / 200));
                return (
                  <article 
                    key={blog.id} 
                    className="feature-card"
                    style={{
                      background: 'var(--color-bg-glass-heavy)',
                      border: 'var(--border-light)',
                      borderRadius: 'var(--border-radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.location.href = `/blog/${blog.slug}`}
                  >
                    {/* Cover Image */}
                    <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                      {blog.cover_image ? (
                        <img 
                          src={blog.cover_image} 
                          alt={blog.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                          HandToHand Blog
                        </div>
                      )}
                      
                      {/* Floating Category/Date Tag */}
                      <span style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {new Date(blog.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        <span>By {blog.author || 'Admin'}</span>
                        <span>•</span>
                        <span>{readTime} min read</span>
                      </div>

                      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                        {blog.title}
                      </h2>

                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '20px', flexGrow: 1 }}>
                        {blog.excerpt}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', fontWeight: 700, marginTop: 'auto' }}>
                        Read Article 
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

import { supabase } from '@/lib/supabase';
import BlogDetailClient from './blog-detail-client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export async function generateStaticParams() {
  try {
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug')
      .eq('published', true);

    if (!blogs) return [];
    return blogs.map((b) => ({
      slug: b.slug,
    }));
  } catch (e) {
    console.error('Error generating static params for blogs:', e);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  try {
    const { data: blog } = await supabase
      .from('blogs')
      .select('title, excerpt')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (blog) {
      return {
        title: `${blog.title} | HandToHand Loans Blog`,
        description: blog.excerpt || 'Read the latest financial tips and lending policies on HandToHand Loans.',
      };
    }
  } catch (e) {
    console.error('Error generating blog details metadata:', e);
  }

  return {
    title: 'Financial Article | HandToHand Loans',
    description: 'Read the latest articles, guides, and loan comparison insights on the HandToHand Loans blog.',
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;

  let blog = null;
  try {
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
      
    blog = data;
  } catch (err) {
    console.error('Error fetching blog post:', err);
  }

  if (!blog) {
    return (
      <>
        <Header />
        <main className="main-content" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', color: '#fff' }}>
          <div style={{
            background: 'var(--color-bg-glass-heavy)',
            border: 'var(--border-error)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '48px 32px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            backdropFilter: 'blur(20px)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-error)', marginBottom: '16px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Article Not Found</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '12px 0 24px', lineHeight: 1.6 }}>
              The article you are trying to access does not exist or has been removed by the administrator.
            </p>
            <Link href="/blog" className="btn btn-secondary btn-sm" style={{ padding: '10px 24px', textDecoration: 'none' }}>
              ← Back to Blogs
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const readTime = Math.max(1, Math.ceil(blog.content.split(/\s+/).length / 200));

  // JSON-LD Structured Data Schema for Search Indexing
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "image": blog.cover_image || "",
    "datePublished": blog.created_at,
    "dateModified": blog.updated_at,
    "author": {
      "@type": "Person",
      "name": blog.author || "Admin"
    },
    "publisher": {
      "@type": "Organization",
      "name": "HandToHand Loans",
      "logo": {
        "@type": "ImageObject",
        "url": "https://handtohandloans.in/icon-512x512.png"
      }
    },
    "description": blog.excerpt
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BlogDetailClient blog={blog} readTime={readTime} />
    </>
  );
}

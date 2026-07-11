'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BankLogo from '@/components/BankLogo';

export default function CreditCardsClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [form, setForm] = useState({
    bank_name: '',
    apply_url: '',
    logo_url: '',
    pdf_url: ''
  });
  const [saving, setSaving] = useState(false);

  // Detect session and user role (No forced redirect to enable SEO indexing)
  useEffect(() => {
    async function getSessionData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const email = session.user.email;
          if (email === 'handtohandloans@gmail.com' || email === 'utkrashtkumar@gmail.com') {
            setIsAdmin(true);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    }
    getSessionData();
  }, [router]);

  // Fetch all credit cards
  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('bank_name', { ascending: true });
      if (error) {
        console.error('Error fetching credit cards:', error.message);
      } else {
        setCards(data || []);
      }
    } catch (err) {
      console.error('Error in fetchCards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCards();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // PDF Viewer helper
  const handleViewPdf = (pdfData, bankName) => {
    if (!pdfData) return;
    try {
      if (pdfData.startsWith('data:')) {
        const base64Parts = pdfData.split(';base64,');
        const contentType = base64Parts[0].split(':')[1] || 'application/pdf';
        const raw = window.atob(base64Parts[1] || pdfData);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(pdfData, '_blank');
      }
    } catch (e) {
      console.error('Error opening PDF:', e);
      alert('Failed to view PDF details. Opening in a new window instead.');
      window.open(pdfData, '_blank');
    }
  };

  // Convert files to base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, logo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('PDF file must be under 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, pdf_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Admin CRUD Actions
  const handleOpenAdd = () => {
    setSelectedCard(null);
    setForm({
      bank_name: '',
      apply_url: '',
      logo_url: '',
      pdf_url: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card) => {
    setSelectedCard(card);
    setForm({
      bank_name: card.bank_name,
      apply_url: card.apply_url || '',
      logo_url: card.logo_url || '',
      pdf_url: card.pdf_url || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.bank_name.trim()) {
      alert('Bank Name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        bank_name: form.bank_name.trim(),
        apply_url: form.apply_url.trim(),
        logo_url: form.logo_url,
        pdf_url: form.pdf_url
      };

      if (selectedCard) {
        const { error } = await supabase
          .from('credit_cards')
          .update(payload)
          .eq('id', selectedCard.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('credit_cards')
          .insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchCards();
    } catch (err) {
      console.error('Error saving card:', err);
      alert('Failed to save credit card: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the credit card for ${name}?`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchCards();
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('Failed to delete card: ' + err.message);
    }
  };

  return (
    <>
      <Header />
      <main className="main-content" style={{ minHeight: '80vh', padding: '120px 20px 60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Hero Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '40px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '24px'
          }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 800,
                background: 'var(--gradient-brand)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                Partner Credit Cards
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '15px' }}>
                Browse premium credit cards from our verified banking partners and apply instantly.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="btn btn-primary"
                style={{
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                ➕ Add Credit Card
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading credit card partners...</p>
            </div>
          ) : cards.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--color-bg-glass)',
              borderRadius: 'var(--border-radius-lg)',
              border: 'var(--border-subtle)',
              backdropFilter: 'blur(20px)'
            }}>
              <span style={{ fontSize: '48px' }}>💳</span>
              <h3 style={{ color: 'var(--color-text-primary)', marginTop: '16px' }}>No Credit Cards Available</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                Please check back later or contact admin to list credit cards.
              </p>
            </div>
          ) : (
            /* Cards Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: 'var(--color-bg-glass)',
                    borderRadius: 'var(--border-radius-lg)',
                    border: 'var(--border-subtle)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    backdropFilter: 'blur(12px)',
                    minHeight: '260px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                >
                  {/* Admin controls inside the card */}
                  {isAdmin && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      display: 'flex',
                      gap: '8px',
                      zIndex: 2
                    }}>
                      <button
                        onClick={() => handleOpenEdit(card)}
                        title="Edit Card"
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          color: '#60a5fa',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(card.id, card.bank_name)}
                        title="Delete Card"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}

                  {/* Logo */}
                  <div style={{ marginTop: isAdmin ? '20px' : '10px', marginBottom: '16px' }}>
                    <BankLogo bankName={card.bank_name} logoUrl={card.logo_url} size={64} />
                  </div>

                  {/* Bank Name */}
                  <h3 style={{
                    color: 'var(--color-text-primary)',
                    fontSize: '18px',
                    fontWeight: 700,
                    textAlign: 'center',
                    marginBottom: '24px',
                    lineHeight: '1.4'
                  }}>
                    {card.bank_name}
                  </h3>

                  {/* Action Buttons Only */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    width: '100%',
                    marginTop: 'auto'
                  }}>
                    {card.apply_url && (
                      <a
                        href={card.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '14px',
                          display: 'block',
                          textDecoration: 'none'
                        }}
                      >
                        Apply Now
                      </a>
                    )}
                    {card.pdf_url && (
                      <button
                        onClick={() => handleViewPdf(card.pdf_url, card.bank_name)}
                        className="btn"
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '14px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.borderColor = 'var(--border-default)';
                        }}
                      >
                        📄 View PDF Details
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Admin Add/Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: 'var(--border-subtle)',
            width: '100%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {selectedCard ? '✏️ Edit Credit Card' : '➕ Add New Credit Card'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Bank Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '14px' }}>
                  Bank/NBFC Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, Axis Bank"
                  value={form.bank_name}
                  onChange={(e) => setForm(prev => ({ ...prev, bank_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'var(--border-light)',
                    background: 'var(--color-bg-input)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Apply URL */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '14px' }}>
                  Apply URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/apply"
                  value={form.apply_url}
                  onChange={(e) => setForm(prev => ({ ...prev, apply_url: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'var(--border-light)',
                    background: 'var(--color-bg-input)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Bank Logo */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '14px' }}>
                  Bank Logo
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Enter external logo image URL"
                    value={form.logo_url && !form.logo_url.startsWith('data:') ? form.logo_url : ''}
                    onChange={(e) => setForm(prev => ({ ...prev, logo_url: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'var(--border-light)',
                      background: 'var(--color-bg-input)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: 'none' }}
                        id="logo-upload-input"
                      />
                      <label
                        htmlFor="logo-upload-input"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '10px',
                          border: '1px dashed var(--color-primary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--color-primary)',
                          background: 'rgba(16, 185, 129, 0.05)',
                          fontWeight: 500,
                          fontSize: '13px'
                        }}
                      >
                        {form.logo_url && form.logo_url.startsWith('data:') ? '✅ Logo Image Attached' : '📁 Upload Logo Image'}
                      </label>
                    </div>
                    {form.logo_url && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, logo_url: '' }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PDF Document Details */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '14px' }}>
                  PDF Details Document
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Enter external PDF URL"
                    value={form.pdf_url && !form.pdf_url.startsWith('data:') ? form.pdf_url : ''}
                    onChange={(e) => setForm(prev => ({ ...prev, pdf_url: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'var(--border-light)',
                      background: 'var(--color-bg-input)',
                      color: 'var(--color-text-primary)',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                        id="pdf-upload-input"
                      />
                      <label
                        htmlFor="pdf-upload-input"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '10px',
                          border: '1px dashed var(--color-primary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--color-primary)',
                          background: 'rgba(16, 185, 129, 0.05)',
                          fontWeight: 500,
                          fontSize: '13px'
                        }}
                      >
                        {form.pdf_url && form.pdf_url.startsWith('data:') ? '✅ PDF Document Attached' : '📁 Upload PDF Document'}
                      </label>
                    </div>
                    {form.pdf_url && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, pdf_url: '' }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-default)',
                    color: 'var(--color-text-secondary)',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Card'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

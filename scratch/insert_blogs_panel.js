const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/page.js');
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = "{activeTab === 'agreements' && (";
const targetIndex = code.indexOf(targetStr);

if (targetIndex === -1) {
  console.error("Target substring '{activeTab === \\'agreements\\'' not found!");
  process.exit(1);
}

// Backtrack to the start of that line
const lineStartIndex = code.lastIndexOf('\n', targetIndex) + 1;

const blogsMarkup = `                  {activeTab === 'blogs' && (
                    <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Manage Portal Blogs</h3>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                            Create, publish, edit, or delete articles that will appear publicly on the website.
                          </p>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBlog(null);
                              setBlogForm({
                                title: '',
                                slug: '',
                                excerpt: '',
                                content: '',
                                published: false,
                                author: 'Admin'
                              });
                              setBlogImageFile(null);
                              setBlogImagePreview('');
                              setBlogError('');
                              setBlogSuccess('');
                              setIsBlogModalOpen(true);
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ background: 'var(--gradient-primary)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px' }}
                          >
                            + Write New Blog
                          </button>
                        </div>
                      </div>

                      {blogsLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                          <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>Loading blogs...</p>
                        </div>
                      ) : blogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', fontWeight: 600 }}>No Blogs Found</h4>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 16px' }}>
                            Get started by writing your first educational article or news update for visitors.
                          </p>
                        </div>
                      ) : (
                        <div className="table-scroll-x" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Image</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', width: '35%' }}>Title</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Slug</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Created</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blogs.map(blog => (
                                <tr key={blog.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--color-text-primary)' }}>
                                  <td style={{ padding: '12px 16px' }}>
                                    {blog.cover_image ? (
                                      <img
                                        src={blog.cover_image}
                                        alt="cover"
                                        style={{ width: '48px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                                      />
                                    ) : (
                                      <div style={{ width: '48px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                        No Image
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                    {blog.title}
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                                    {blog.slug}
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublishBlog(blog)}
                                      style={{
                                        border: 'none',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: blog.published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: blog.published ? 'var(--color-success)' : '#f59e0b',
                                        border: blog.published ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                                      }}
                                    >
                                      {blog.published ? 'Published' : 'Draft'}
                                    </button>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                                    {new Date(blog.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedBlog(blog);
                                          setBlogForm({
                                            title: blog.title,
                                            slug: blog.slug,
                                            excerpt: blog.excerpt,
                                            content: blog.content,
                                            published: blog.published,
                                            author: blog.author || 'Admin'
                                          });
                                          setBlogImageFile(null);
                                          setBlogImagePreview(blog.cover_image || '');
                                          setBlogError('');
                                          setBlogSuccess('');
                                          setIsBlogModalOpen(true);
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBlog(blog)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Modal for Creating / Editing Blogs */}
                      {isBlogModalOpen && (
                        <div style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(10px)',
                          zIndex: 999999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px'
                        }}>
                          <div style={{
                            background: 'var(--color-bg-card)',
                            border: 'var(--border-light)',
                            borderRadius: 'var(--border-radius-lg)',
                            width: '100%',
                            maxWidth: '750px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: 'var(--shadow-xl)',
                            padding: '32px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
                              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {selectedBlog ? 'Edit Blog Post' : 'Write New Blog Post'}
                              </h3>
                              <button
                                type="button"
                                onClick={() => setIsBlogModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '20px' }}
                              >
                                &times;
                              </button>
                            </div>

                            {blogError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>{blogError}</div>}
                            {blogSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: '8px', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>{blogSuccess}</div>}

                            <form onSubmit={handleSaveBlog} style={{ display: 'grid', gap: '20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="input-group">
                                  <label className="input-label">Title <span className="required">*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter article title"
                                    value={blogForm.title}
                                    onChange={(e) => {
                                      const title = e.target.value;
                                      const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                      setBlogForm(prev => ({ ...prev, title, slug: autoSlug }));
                                    }}
                                    required
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Slug <span className="required">*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    placeholder="url-friendly-slug"
                                    value={blogForm.slug}
                                    onChange={(e) => setBlogForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                                    required
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', alignItems: 'end' }}>
                                <div className="input-group">
                                  <label className="input-label">Attach Cover Image (JPEG / PNG)</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="input-field"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        setBlogImageFile(file);
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setBlogImagePreview(ev.target.result);
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    style={{ padding: '8px 12px' }}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Author</label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={blogForm.author}
                                    onChange={(e) => setBlogForm(prev => ({ ...prev, author: e.target.value }))}
                                  />
                                </div>
                              </div>

                              {blogImagePreview && (
                                <div style={{ border: 'var(--border-light)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Cover Image Preview</p>
                                  <img src={blogImagePreview} alt="Blog Cover Preview" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                                </div>
                              )}

                              <div className="input-group">
                                <label className="input-label">Excerpt (Brief Summary) <span className="required">*</span></label>
                                <textarea
                                  className="input-field"
                                  placeholder="Short 1-2 sentence preview summary of the post..."
                                  value={blogForm.excerpt}
                                  onChange={(e) => setBlogForm(prev => ({ ...prev, excerpt: e.target.value }))}
                                  rows={2}
                                  required
                                />
                              </div>

                              <div className="input-group">
                                <label className="input-label">Content (Supports HTML / Raw Markdown) <span className="required">*</span></label>
                                <textarea
                                  className="input-field"
                                  placeholder="Write the full post contents here. Use standard HTML tags (e.g. <p>, <h3>, <ul>, <li>, <strong>) to format text."
                                  value={blogForm.content}
                                  onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                                  rows={12}
                                  required
                                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6 }}
                                />
                              </div>

                              <label className="checkbox-wrapper" style={{ margin: '8px 0' }}>
                                <input
                                  type="checkbox"
                                  className="checkbox-input"
                                  checked={blogForm.published}
                                  onChange={(e) => setBlogForm(prev => ({ ...prev, published: e.target.checked }))}
                                />
                                <span className="checkbox-label" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  Publish immediately (visible to public)
                                </span>
                              </label>

                              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', borderTop: 'var(--border-subtle)', paddingTop: '16px' }}>
                                <button
                                  type="button"
                                  onClick={() => setIsBlogModalOpen(false)}
                                  className="btn btn-secondary"
                                  disabled={blogUploading}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                  disabled={blogUploading}
                                  style={{ background: 'var(--gradient-primary)', border: 'none', color: '#fff' }}
                                >
                                  {blogUploading ? 'Saving...' : 'Save Post'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

`;

const updatedCode = code.slice(0, lineStartIndex) + blogsMarkup + code.slice(lineStartIndex);
fs.writeFileSync(filePath, updatedCode, 'utf8');
console.log("Successfully inserted blogs panel!");

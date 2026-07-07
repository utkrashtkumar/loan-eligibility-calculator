const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/page.js');
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

// 1. Insert State Variables
const stateTarget = `  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');`;

const stateInsert = `  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Blogs Management State
  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    published: false,
    author: 'Admin'
  });
  const [blogImageFile, setBlogImageFile] = useState(null);
  const [blogImagePreview, setBlogImagePreview] = useState('');
  const [blogUploading, setBlogUploading] = useState(false);
  const [blogError, setBlogError] = useState('');
  const [blogSuccess, setBlogSuccess] = useState('');`;

if (code.includes(stateTarget)) {
  code = code.replace(stateTarget, stateInsert);
  console.log("Successfully inserted blogs state variables.");
} else {
  console.error("State target not found!");
}

// 2. Insert Sidebar Menu items dynamically
let startIndex = 0;
let tabCount = 0;
while (true) {
  const contactsIndex = code.indexOf("id: 'contacts'", startIndex);
  if (contactsIndex === -1) break;
  
  // Find the end of this line
  const lineEndIndex = code.indexOf('\n', contactsIndex);
  
  // Find the start of this line to determine indentation
  const lineStartIndex = code.lastIndexOf('\n', contactsIndex) + 1;
  const indentationLength = code.slice(lineStartIndex).search(/\S/);
  const indentation = code.slice(lineStartIndex, lineStartIndex + indentationLength);
  
  const blogsLine = `\n${indentation}{ id: 'blogs', label: \`Manage Blogs (\${blogs.length})\` },`;
  
  code = code.slice(0, lineEndIndex) + blogsLine + code.slice(lineEndIndex);
  
  tabCount++;
  // Move past the inserted line
  startIndex = lineEndIndex + blogsLine.length;
}
console.log(`Successfully inserted ${tabCount} blogs tab configurations dynamically.`);

// 3. Insert CRUD functions
const crudTarget = `  const handleToggleUpdate = async (update) => {
    try {
      await supabase.from('agent_updates')
        .update({ is_active: !update.is_active })
        .eq('id', update.id);
      logAdminAction('Toggle Agent Update', \`Set update "\${update.title}" active=\${!update.is_active}\`);
      await fetchAgentUpdates();
    } catch (err) {
      alert('Toggle failed: ' + err.message);
    }
  };`;

const crudInsert = `  const handleToggleUpdate = async (update) => {
    try {
      await supabase.from('agent_updates')
        .update({ is_active: !update.is_active })
        .eq('id', update.id);
      logAdminAction('Toggle Agent Update', \`Set update "\${update.title}" active=\${!update.is_active}\`);
      await fetchAgentUpdates();
    } catch (err) {
      alert('Toggle failed: ' + err.message);
    }
  };

  const fetchBlogs = async () => {
    setBlogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setBlogs(data || []);
    } catch (err) {
      console.error(err);
    }
    setBlogsLoading(false);
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!blogForm.title.trim()) { setBlogError('Title is required.'); return; }
    if (!blogForm.excerpt.trim()) { setBlogError('Excerpt is required.'); return; }
    if (!blogForm.content.trim()) { setBlogError('Content is required.'); return; }

    setBlogUploading(true);
    setBlogError('');
    setBlogSuccess('');

    try {
      let finalCoverImage = selectedBlog ? selectedBlog.cover_image : '';

      // Upload cover image if a new file is attached
      if (blogImageFile) {
        const ext = blogImageFile.name.split('.').pop();
        const fileName = \`blog-\${Date.now()}.\${ext}\`;
        const { error: storageError } = await supabase.storage
          .from('agent-updates')
          .upload(fileName, blogImageFile, { cacheControl: '3600', upsert: false });
        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage.from('agent-updates').getPublicUrl(fileName);
        finalCoverImage = urlData.publicUrl;

        // If editing and previous image existed, clean it up
        if (selectedBlog && selectedBlog.cover_image && selectedBlog.cover_image.includes('/agent-updates/')) {
          const oldFileName = selectedBlog.cover_image.split('/').pop().split('?')[0];
          await supabase.storage.from('agent-updates').remove([oldFileName]);
        }
      }

      // Format Slug (lowercase alphanumeric and hyphens only)
      let slug = blogForm.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!slug) {
        slug = blogForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      const blogPayload = {
        title: blogForm.title.trim(),
        slug,
        excerpt: blogForm.excerpt.trim(),
        content: blogForm.content.trim(),
        cover_image: finalCoverImage,
        published: blogForm.published,
        author: blogForm.author.trim() || 'Admin',
        updated_at: new Date().toISOString()
      };

      if (selectedBlog) {
        // Update existing blog
        const { error } = await supabase
          .from('blogs')
          .update(blogPayload)
          .eq('id', selectedBlog.id);
        if (error) throw error;
        setBlogSuccess('Blog updated successfully!');
        logAdminAction('Edit Blog', \`Edited blog: \${blogPayload.title}\`);
      } else {
        // Create new blog
        const { error } = await supabase
          .from('blogs')
          .insert([blogPayload]);
        if (error) throw error;
        setBlogSuccess('Blog created successfully!');
        logAdminAction('Create Blog', \`Created new blog: \${blogPayload.title}\`);
      }

      setIsBlogModalOpen(false);
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
      await fetchBlogs();
    } catch (err) {
      setBlogError('Operation failed: ' + (err.message || String(err)));
    } finally {
      setBlogUploading(false);
    }
  };

  const handleDeleteBlog = async (blog) => {
    if (!window.confirm(\`Are you sure you want to delete the blog "\${blog.title}"? This action cannot be undone.\`)) return;
    try {
      if (blog.cover_image && blog.cover_image.includes('/agent-updates/')) {
        const fileName = blog.cover_image.split('/').pop().split('?')[0];
        await supabase.storage.from('agent-updates').remove([fileName]);
      }
      const { error } = await supabase.from('blogs').delete().eq('id', blog.id);
      if (error) throw error;
      logAdminAction('Delete Blog', \`Deleted blog: \${blog.title}\`);
      await fetchBlogs();
    } catch (err) {
      alert('Failed to delete blog: ' + err.message);
    }
  };

  const handleTogglePublishBlog = async (blog) => {
    try {
      const newPublished = !blog.published;
      const { error } = await supabase
        .from('blogs')
        .update({ published: newPublished, updated_at: new Date().toISOString() })
        .eq('id', blog.id);
      if (error) throw error;
      logAdminAction(newPublished ? 'Publish Blog' : 'Unpublish Blog', \`Toggled blog publish: \${blog.title}\`);
      await fetchBlogs();
    } catch (err) {
      alert('Failed to toggle publication status: ' + err.message);
    }
  };`;

if (code.includes(crudTarget)) {
  code = code.replace(crudTarget, crudInsert);
  console.log("Successfully inserted blog helper CRUD functions.");
} else {
  console.error("CRUD target not found!");
}

// 4. Update fetchAllData array to load blogs
code = code.replace(
  `      fetchAgentUpdates(),\n      fetchRegenRequests(),\n      fetchDbNotifications()`,
  `      fetchAgentUpdates(),\n      fetchRegenRequests(),\n      fetchDbNotifications(),\n      fetchBlogs()`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Full blogs configurations successfully restored!");

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <p className="footer-copyright" style={{ margin: 0 }}>
          © {year} Hand to Hand Fintech Loan Platform. All rights reserved.
        </p>
        <div className="footer-links" style={{ display: 'flex', gap: '20px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/privacy" style={{ transition: 'color var(--transition-base)' }} onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--color-text-secondary)'}>Privacy Policy</a>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <a href="/terms" style={{ transition: 'color var(--transition-base)' }} onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--color-text-secondary)'}>Terms &amp; Conditions</a>
        </div>
        <p className="footer-disclaimer" style={{ maxWidth: '800px', textAlign: 'center', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
          Disclaimer: Loan eligibility results shown are indicative and based on
          publicly available bank policies. Actual eligibility may vary based on
          additional factors determined by the respective bank or NBFC. This tool
          does not guarantee loan approval.
        </p>
      </div>
    </footer>
  );
}

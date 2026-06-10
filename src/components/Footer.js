export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-copyright">
          © {year} LoanMatch Pro. All rights reserved.
        </p>
        <p className="footer-disclaimer">
          Disclaimer: Loan eligibility results shown are indicative and based on
          publicly available bank policies. Actual eligibility may vary based on
          additional factors determined by the respective bank or NBFC. This tool
          does not guarantee loan approval.
        </p>
      </div>
    </footer>
  );
}

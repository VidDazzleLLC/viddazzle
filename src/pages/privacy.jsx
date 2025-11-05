import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - VidDazzle</title>
        <meta name="description" content="Privacy Policy for VidDazzle" />
      </Head>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', lineHeight: '1.6' }}>
        <Link href="/" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Privacy Policy</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>
          Last Updated: {new Date().toLocaleDateString()}
        </p>

        <div style={{ fontSize: '16px', color: '#333' }}>
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>1. Introduction</h2>
            <p>
              VidDazzle ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>Your Rights:</strong> Under GDPR and other privacy laws, you have the right to access, correct,
              delete, or export your personal data. See Section 10 for details.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>2. Information We Collect</h2>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>2.1 Information You Provide</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Account Information:</strong> Email, password, name (if provided)</li>
              <li><strong>Profile Information:</strong> Company name, industry, preferences</li>
              <li><strong>Content:</strong> Workflows, campaigns, products, search queries you create</li>
              <li><strong>Communication:</strong> Support messages, feedback, survey responses</li>
              <li><strong>Payment Information:</strong> Processed by third-party payment providers (Stripe)</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>2.2 Automatically Collected Information</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Usage Data:</strong> Features used, pages visited, time spent</li>
              <li><strong>Device Information:</strong> Browser type, IP address, operating system</li>
              <li><strong>Cookies:</strong> Session cookies, authentication tokens</li>
              <li><strong>Log Data:</strong> API requests, errors, performance metrics</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>2.3 Social Media Data</h3>
            <p>
              When you connect social media accounts, we access public data as permitted by each platform's API:
            </p>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Twitter/X:</strong> Public tweets, user profiles, engagement metrics</li>
              <li><strong>LinkedIn:</strong> Public posts, company data (with your authorization)</li>
              <li><strong>Reddit:</strong> Public posts, comments, subreddit information</li>
            </ul>
            <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
              We only access data you authorize and that is publicly available. We do not access private messages or non-public content.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li><strong>Provide the Service:</strong> Process your requests, execute workflows, monitor social media</li>
              <li><strong>Improve the Service:</strong> Analyze usage patterns, fix bugs, develop features</li>
              <li><strong>Communicate:</strong> Send service updates, respond to support requests</li>
              <li><strong>Security:</strong> Detect fraud, prevent abuse, enforce Terms of Service</li>
              <li><strong>Legal Compliance:</strong> Comply with laws, respond to legal requests</li>
              <li><strong>AI Processing:</strong> Use Claude AI to generate workflows and personalize outreach</li>
            </ul>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
              We do NOT sell your personal data to third parties.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>4. Legal Basis for Processing (GDPR)</h2>
            <p>For EU users, we process your data based on:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li><strong>Contract:</strong> To provide the Service you signed up for</li>
              <li><strong>Consent:</strong> When you authorize social media connections</li>
              <li><strong>Legitimate Interest:</strong> To improve our Service and prevent fraud</li>
              <li><strong>Legal Obligation:</strong> To comply with laws and regulations</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>5. How We Share Your Information</h2>
            <p>We share your information only in these circumstances:</p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>5.1 Service Providers</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Anthropic (Claude AI):</strong> For AI-powered features</li>
              <li><strong>Neon Database:</strong> For data storage</li>
              <li><strong>Supabase:</strong> For authentication</li>
              <li><strong>Social Media Platforms:</strong> To access their APIs</li>
              <li><strong>Payment Processors:</strong> For subscription billing</li>
              <li><strong>Hosting Providers:</strong> Railway, Vercel for infrastructure</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>5.2 Legal Requirements</h3>
            <p>We may disclose information if required by law, court order, or government request.</p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>5.3 Business Transfers</h3>
            <p>If we are acquired or merged, your information may be transferred to the new owner.</p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>5.4 With Your Consent</h3>
            <p>We may share information for other purposes with your explicit permission.</p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>6. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li><strong>Encryption:</strong> SSL/TLS for data in transit, encryption at rest</li>
              <li><strong>Authentication:</strong> Secure password hashing, JWT tokens</li>
              <li><strong>Access Control:</strong> Role-based permissions, user isolation</li>
              <li><strong>Monitoring:</strong> Security logging, intrusion detection</li>
              <li><strong>Regular Updates:</strong> Security patches, vulnerability scanning</li>
            </ul>
            <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
              However, no system is 100% secure. Use strong passwords and enable two-factor authentication.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>7. Data Retention</h2>
            <p><strong>Active Accounts:</strong> We retain your data as long as your account is active.</p>
            <p><strong>Closed Accounts:</strong> After account deletion, we retain minimal data for:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Legal compliance (e.g., financial records): Up to 7 years</li>
              <li>Fraud prevention: Up to 2 years</li>
              <li>Backup systems: Up to 90 days</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              You can request immediate deletion by contacting support@viddazzle.com.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>8. Cookies and Tracking</h2>
            <p>We use cookies for:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li><strong>Essential Cookies:</strong> Authentication, session management (required)</li>
              <li><strong>Analytics Cookies:</strong> Usage statistics, performance monitoring (optional)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings (optional)</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              You can control cookies through your browser settings. Disabling essential cookies may affect functionality.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>9. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries outside your residence.
              We ensure adequate protection through:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Standard Contractual Clauses (SCCs) for EU data</li>
              <li>Service providers certified under privacy frameworks</li>
              <li>Encryption and security measures</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>10. Your Rights (GDPR & CCPA)</h2>
            <p>You have the following rights:</p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>10.1 Right to Access</h3>
            <p>Request a copy of your personal data.</p>
            <p style={{ marginTop: '5px' }}>
              <strong>How:</strong> Use <code>/api/user/export</code> or contact support
            </p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>10.2 Right to Rectification</h3>
            <p>Correct inaccurate or incomplete data.</p>
            <p style={{ marginTop: '5px' }}>
              <strong>How:</strong> Update in account settings or contact support
            </p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>10.3 Right to Erasure ("Right to be Forgotten")</h3>
            <p>Request deletion of your personal data.</p>
            <p style={{ marginTop: '5px' }}>
              <strong>How:</strong> Use <code>/api/user/delete</code> or contact support
            </p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>10.4 Right to Data Portability</h3>
            <p>Receive your data in a machine-readable format (JSON/CSV).</p>
            <p style={{ marginTop: '5px' }}>
              <strong>How:</strong> Use <code>/api/user/export</code>
            </p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>10.5 Right to Object</h3>
            <p>Object to processing based on legitimate interests.</p>
            <p style={{ marginTop: '5px' }}>
              <strong>How:</strong> Contact support@viddazzle.com
            </p>

            <h3 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '10px' }}>10.6 Right to Restrict Processing</h3>
            <p>Request limitation of processing in certain circumstances.</p>
            <p style={{ marginTop: '5px' }}>
              <strong>How:</strong> Contact support@viddazzle.com
            </p>

            <p style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
              <strong>Response Time:</strong> We will respond to your requests within 30 days.
              For complex requests, we may extend this by 60 days with explanation.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>11. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 16 (or 13 in the US).
              We do not knowingly collect data from children.
              If you believe we have collected such data, contact us immediately.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>12. California Privacy Rights (CCPA)</h2>
            <p>California residents have additional rights:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Know what personal information is collected</li>
              <li>Know if personal information is sold or disclosed</li>
              <li>Opt-out of sale of personal information (we don't sell data)</li>
              <li>Access and delete personal information</li>
              <li>Non-discrimination for exercising rights</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>13. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy. We will notify you of material changes via:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Email notification</li>
              <li>In-app notification</li>
              <li>Update notice on this page</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              Continued use after changes constitutes acceptance. Review this policy periodically.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>14. Contact Us</h2>
            <p>For privacy questions, concerns, or to exercise your rights:</p>
            <p style={{ marginTop: '10px' }}>
              <strong>Email:</strong> privacy@viddazzle.com<br />
              <strong>Support:</strong> support@viddazzle.com<br />
              <strong>Website:</strong> <Link href="/" style={{ color: '#667eea' }}>https://viddazzle.com</Link>
            </p>
            <p style={{ marginTop: '15px' }}>
              <strong>Data Protection Officer:</strong> [Your DPO Contact] (if applicable)
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>15. Supervisory Authority</h2>
            <p>
              EU residents have the right to lodge a complaint with their local data protection authority
              if they believe we have violated GDPR.
            </p>
            <p style={{ marginTop: '10px' }}>
              <strong>EU DPA Directory:</strong>{' '}
              <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{ color: '#667eea' }}>
                European Data Protection Board
              </a>
            </p>
          </section>

          <div style={{ marginTop: '50px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Quick Summary (Not Legally Binding)</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>✅ We collect data to provide our Service</li>
              <li>✅ We use strong security measures</li>
              <li>✅ We do NOT sell your data</li>
              <li>✅ You can export or delete your data anytime</li>
              <li>✅ We comply with GDPR, CCPA, and other privacy laws</li>
              <li>✅ Contact us for any privacy concerns</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#667eea', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
          {' | '}
          <Link href="/terms" style={{ color: '#667eea', textDecoration: 'none' }}>
            Terms of Service
          </Link>
        </div>
      </div>
    </>
  );
}

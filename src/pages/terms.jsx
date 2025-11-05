import Head from 'next/head';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - VidDazzle</title>
        <meta name="description" content="Terms of Service for VidDazzle" />
      </Head>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', lineHeight: '1.6' }}>
        <Link href="/" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Terms of Service</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>
          Last Updated: {new Date().toLocaleDateString()}
        </p>

        <div style={{ fontSize: '16px', color: '#333' }}>
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using VidDazzle ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>2. Description of Service</h2>
            <p>
              VidDazzle provides social media listening, workflow automation, and customer engagement tools.
              Our Service includes:
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Social media monitoring across multiple platforms</li>
              <li>Automated workflow creation and execution</li>
              <li>Product and campaign management</li>
              <li>AI-powered customer engagement tools</li>
            </ul>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>3. User Accounts</h2>
            <p><strong>3.1 Registration:</strong> You must create an account to use our Service. You agree to provide accurate, current, and complete information.</p>
            <p><strong>3.2 Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
            <p><strong>3.3 Prohibited Activities:</strong> You may not:
              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                <li>Share your account with others</li>
                <li>Use the Service for illegal purposes</li>
                <li>Attempt to circumvent security measures</li>
                <li>Harass, abuse, or harm others</li>
                <li>Violate any platform's terms of service</li>
              </ul>
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>4. Acceptable Use Policy</h2>
            <p>You agree to use VidDazzle responsibly and in compliance with:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>All applicable laws and regulations</li>
              <li>Third-party platform terms of service (Twitter, LinkedIn, Reddit, etc.)</li>
              <li>Anti-spam regulations (CAN-SPAM Act, GDPR, etc.)</li>
              <li>Privacy and data protection laws</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              <strong>Prohibited Uses:</strong> Spam, harassment, data scraping beyond platform limits,
              impersonation, or any activity that could harm our Service or third parties.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>5. Intellectual Property</h2>
            <p><strong>5.1 Our Content:</strong> All content, features, and functionality of VidDazzle are owned by us and protected by copyright, trademark, and other intellectual property laws.</p>
            <p><strong>5.2 Your Content:</strong> You retain ownership of content you create using our Service. You grant us a license to use, store, and display your content as necessary to provide the Service.</p>
            <p><strong>5.3 Third-Party Content:</strong> Social media content accessed through our Service belongs to the respective platform users and platforms.</p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>6. Payment and Subscription</h2>
            <p><strong>6.1 Fees:</strong> Some features may require payment. Fees are specified at the time of purchase.</p>
            <p><strong>6.2 Billing:</strong> Subscriptions renew automatically unless cancelled. You authorize us to charge your payment method.</p>
            <p><strong>6.3 Refunds:</strong> Refunds are handled on a case-by-case basis. Contact support for refund requests.</p>
            <p><strong>6.4 Free Trial:</strong> Free trials (if offered) are subject to specific terms communicated at sign-up.</p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>7. API Usage and Rate Limits</h2>
            <p>
              Our Service uses third-party APIs (Claude AI, social media platforms) which have rate limits.
              Excessive usage may result in service interruption or additional charges.
            </p>
            <p style={{ marginTop: '10px' }}>
              We implement our own rate limits to ensure fair usage:
              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                <li>Standard endpoints: 30 requests per minute</li>
                <li>Expensive operations: 5 requests per minute</li>
                <li>Bulk operations: Subject to additional limits</li>
              </ul>
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>8. Data Privacy</h2>
            <p>
              Your privacy is important to us. Our collection, use, and disclosure of personal data is described
              in our <Link href="/privacy" style={{ color: '#667eea' }}>Privacy Policy</Link>.
            </p>
            <p style={{ marginTop: '10px' }}>
              Key points:
              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                <li>We collect data necessary to provide our Service</li>
                <li>We use industry-standard security measures</li>
                <li>You can export or delete your data at any time (GDPR rights)</li>
                <li>We do not sell your personal data</li>
              </ul>
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>9. Service Availability</h2>
            <p><strong>9.1 Uptime:</strong> We strive for high availability but do not guarantee uninterrupted access.</p>
            <p><strong>9.2 Maintenance:</strong> We may perform scheduled or emergency maintenance that temporarily affects Service availability.</p>
            <p><strong>9.3 Modifications:</strong> We reserve the right to modify, suspend, or discontinue features with or without notice.</p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>10. Termination</h2>
            <p><strong>10.1 By You:</strong> You may terminate your account at any time through account settings or by contacting support.</p>
            <p><strong>10.2 By Us:</strong> We may suspend or terminate your account if you violate these Terms or for other legitimate reasons.</p>
            <p><strong>10.3 Effect:</strong> Upon termination, your right to use the Service ceases. Data retention is governed by our Privacy Policy.</p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>11. Disclaimers</h2>
            <p style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
            <p style={{ marginTop: '10px' }}>
              We do not warrant that:
              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                <li>The Service will meet your requirements</li>
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>Results obtained from the Service will be accurate or reliable</li>
                <li>Any errors will be corrected</li>
              </ul>
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>12. Limitation of Liability</h2>
            <p style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
            </p>
            <p style={{ marginTop: '10px' }}>
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>13. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from:
              <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your content or activities</li>
              </ul>
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>14. Dispute Resolution</h2>
            <p><strong>14.1 Informal Resolution:</strong> Contact us first to resolve disputes informally.</p>
            <p><strong>14.2 Arbitration:</strong> If informal resolution fails, disputes will be resolved through binding arbitration.</p>
            <p><strong>14.3 Class Action Waiver:</strong> You agree to resolve disputes individually, not as part of a class action.</p>
            <p><strong>14.4 Governing Law:</strong> These Terms are governed by the laws of [Your Jurisdiction].</p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>15. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes via email
              or Service notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>16. Contact Information</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <p style={{ marginTop: '10px' }}>
              Email: support@viddazzle.com<br />
              Website: <Link href="/" style={{ color: '#667eea' }}>https://viddazzle.com</Link>
            </p>
          </section>

          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>17. Miscellaneous</h2>
            <p><strong>17.1 Entire Agreement:</strong> These Terms constitute the entire agreement between you and VidDazzle.</p>
            <p><strong>17.2 Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect.</p>
            <p><strong>17.3 Waiver:</strong> Failure to enforce any right does not constitute a waiver.</p>
            <p><strong>17.4 Assignment:</strong> You may not assign these Terms. We may assign them without restriction.</p>
          </section>

          <div style={{ marginTop: '50px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Summary (Not Legally Binding)</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Use our Service responsibly and legally</li>
              <li>Don't spam or violate platform rules</li>
              <li>We're not liable for damages beyond what you paid</li>
              <li>You can delete your account anytime</li>
              <li>We may update these Terms with notice</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#667eea', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}

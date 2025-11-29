/**
 * Test Fixture: Google Font - Open Sans
 * 
 * 
 * Tests embedding of Google Font "Open Sans" in PDF.
 * Expected: Open Sans font embedded as CIDFont, text is selectable
 */
export default function GoogleFontOpenSansCV() {
  return (
    <div style={{ fontFamily: 'Open Sans, Arial, sans-serif', fontSize: '12px', padding: '20px' }}>
      <h1 style={{ fontFamily: 'Open Sans', fontSize: '24px', marginBottom: '10px' }}>
        Jane Smith
      </h1>
      
      <p style={{ fontFamily: 'Open Sans', fontSize: '14px', marginBottom: '15px' }}>
        Product Designer | jane.smith@example.com | (555) 987-6543
      </p>

      <h2 style={{ fontFamily: 'Open Sans', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        About Me
      </h2>
      
      <p style={{ fontFamily: 'Open Sans', fontSize: '12px', marginBottom: '15px', lineHeight: '1.6' }}>
        Creative product designer with a passion for user-centered design. Experienced in 
        creating intuitive interfaces for web and mobile applications. Strong collaborator
        with engineering and product teams.
      </p>

      <h2 style={{ fontFamily: 'Open Sans', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Experience
      </h2>
      
      <div style={{ fontFamily: 'Open Sans', fontSize: '12px', marginBottom: '12px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>
          Lead Product Designer - Design Studio
        </div>
        <div style={{ fontStyle: 'italic', marginBottom: '6px' }}>
          March 2019 - Present
        </div>
        <ul style={{ marginLeft: '20px', lineHeight: '1.5' }}>
          <li>Designed and shipped 15+ product features used by 100k+ users</li>
          <li>Established design system used across 5 product teams</li>
          <li>Conducted user research to inform product strategy</li>
        </ul>
      </div>

      <h2 style={{ fontFamily: 'Open Sans', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Education
      </h2>
      
      <p style={{ fontFamily: 'Open Sans', fontSize: '12px', lineHeight: '1.6' }}>
        B.A. in Graphic Design - University of Arts, 2018
      </p>
    </div>
  );
}

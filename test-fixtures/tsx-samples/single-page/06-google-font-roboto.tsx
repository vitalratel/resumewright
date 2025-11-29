/**
 * Test Fixture: Google Font - Roboto
 * 
 * 
 * Tests embedding of Google Font "Roboto" in PDF.
 * Expected: Roboto font embedded as CIDFont, text is selectable
 */
export default function GoogleFontRobotoCV() {
  return (
    <div style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: '12px', padding: '20px' }}>
      <h1 style={{ fontFamily: 'Roboto', fontSize: '24px', marginBottom: '10px' }}>
        John Doe
      </h1>
      
      <p style={{ fontFamily: 'Roboto', fontSize: '14px', marginBottom: '15px' }}>
        Software Engineer | johndoe@example.com | (555) 123-4567
      </p>

      <h2 style={{ fontFamily: 'Roboto', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Professional Summary
      </h2>
      
      <p style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '15px', lineHeight: '1.6' }}>
        Experienced software engineer with 5+ years of expertise in full-stack development.
        Proficient in TypeScript, React, and Rust. Strong background in building scalable
        web applications and PDF generation systems.
      </p>

      <h2 style={{ fontFamily: 'Roboto', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Work Experience
      </h2>
      
      <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>
          Senior Software Engineer - Tech Corp
        </div>
        <div style={{ fontStyle: 'italic', marginBottom: '6px' }}>
          January 2020 - Present
        </div>
        <ul style={{ marginLeft: '20px', lineHeight: '1.5' }}>
          <li>Led development of PDF generation system using Rust and WebAssembly</li>
          <li>Implemented custom font embedding for improved document quality</li>
          <li>Optimized performance to handle 1000+ page documents efficiently</li>
        </ul>
      </div>

      <h2 style={{ fontFamily: 'Roboto', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Skills
      </h2>
      
      <p style={{ fontFamily: 'Roboto', fontSize: '12px', lineHeight: '1.6' }}>
        TypeScript, React, Rust, WebAssembly, PDF Generation, Font Embedding, 
        System Design, Performance Optimization
      </p>
    </div>
  );
}

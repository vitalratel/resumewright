/**
 * Test Fixture: Mixed Fonts (Google Fonts + Web-Safe)
 * 
 * 
 * Tests mixing Google Fonts with web-safe fonts in same document.
 * Expected: Both font types work correctly, proper fallback chain
 */
export default function MixedFontsCV() {
  return (
    <div style={{ fontFamily: 'Arial', fontSize: '12px', padding: '20px' }}>
      {/* Header with Lato (Google Font) */}
      <h1 style={{ fontFamily: 'Lato, Arial, sans-serif', fontSize: '24px', marginBottom: '10px' }}>
        Alex Johnson
      </h1>
      
      {/* Contact info with Arial (web-safe) */}
      <p style={{ fontFamily: 'Arial', fontSize: '14px', marginBottom: '15px' }}>
        Data Scientist | alex.johnson@example.com | (555) 456-7890
      </p>

      {/* Section header with Montserrat (Google Font) */}
      <h2 style={{ fontFamily: 'Montserrat, Helvetica, sans-serif', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Professional Summary
      </h2>
      
      {/* Body text with Times New Roman (web-safe) */}
      <p style={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', marginBottom: '15px', lineHeight: '1.6' }}>
        Data scientist with expertise in machine learning and statistical analysis.
        Skilled in Python, R, and SQL. Experience building predictive models for 
        business intelligence and customer analytics.
      </p>

      {/* Section header with Poppins (Google Font) */}
      <h2 style={{ fontFamily: 'Poppins, Arial, sans-serif', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Technical Skills
      </h2>
      
      {/* Skills list with Courier New (web-safe monospace) */}
      <div style={{ fontFamily: 'Courier New, monospace', fontSize: '11px', marginBottom: '15px' }}>
        <div>Python | R | SQL | TensorFlow | PyTorch</div>
        <div>pandas | scikit-learn | matplotlib | seaborn</div>
        <div>Machine Learning | Deep Learning | NLP</div>
      </div>

      {/* Section header with web-safe */}
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', marginBottom: '8px', marginTop: '15px' }}>
        Work Experience
      </h2>
      
      {/* Experience with Roboto (Google Font) */}
      <div style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: '12px', marginBottom: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px' }}>
          Senior Data Scientist - Analytics Inc
        </div>
        <div style={{ fontStyle: 'italic', marginBottom: '6px' }}>
          June 2018 - Present
        </div>
        <ul style={{ marginLeft: '20px', lineHeight: '1.5' }}>
          <li>Built ML models improving customer retention by 25%</li>
          <li>Led data pipeline redesign reducing processing time by 60%</li>
          <li>Mentored 3 junior data scientists</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Test Fixture: Google Font Variants (Multiple Weights/Styles)
 * 
 * 
 * Tests embedding multiple weights and styles of same Google Font.
 * Expected: All variants (normal, bold, italic, bold-italic) work correctly
 */
export default function GoogleFontVariantsCV() {
  return (
    <div style={{ fontFamily: 'Roboto, Arial, sans-serif', fontSize: '12px', padding: '20px' }}>
      <h1 style={{ fontFamily: 'Roboto', fontSize: '24px', fontWeight: 700, marginBottom: '10px' }}>
        Font Variants Test - Roboto
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Roboto', fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>
          Weight Variants
        </h2>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 300 }}>
          Light (300): The quick brown fox jumps over the lazy dog
        </div>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 400 }}>
          Regular (400): The quick brown fox jumps over the lazy dog
        </div>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 500 }}>
          Medium (500): The quick brown fox jumps over the lazy dog
        </div>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 700 }}>
          Bold (700): The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Roboto', fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>
          Style Variants
        </h2>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontStyle: 'normal' }}>
          Normal: The quick brown fox jumps over the lazy dog
        </div>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontStyle: 'italic' }}>
          Italic: The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Roboto', fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>
          Combined Variants
        </h2>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 400, fontStyle: 'normal' }}>
          Regular Normal: The quick brown fox jumps over the lazy dog
        </div>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 400, fontStyle: 'italic' }}>
          Regular Italic: The quick brown fox jumps over the lazy dog
        </div>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 700, fontStyle: 'normal' }}>
          Bold Normal: The quick brown fox jumps over the lazy dog
        </div>
        
        <div style={{ fontFamily: 'Roboto', fontSize: '12px', marginBottom: '6px', fontWeight: 700, fontStyle: 'italic' }}>
          Bold Italic: The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Roboto', fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>
          Real-World Example
        </h2>
        
        <p style={{ fontFamily: 'Roboto', fontSize: '12px', lineHeight: '1.6', marginBottom: '10px' }}>
          This paragraph demonstrates <strong style={{ fontWeight: 700 }}>bold text</strong> and{' '}
          <em style={{ fontStyle: 'italic' }}>italic text</em> within normal text. It also shows{' '}
          <strong><em style={{ fontWeight: 700, fontStyle: 'italic' }}>bold italic text</em></strong>.
          All variants should render correctly with the embedded Roboto font.
        </p>
        
        <p style={{ fontFamily: 'Roboto', fontSize: '12px', lineHeight: '1.6', fontWeight: 300 }}>
          This paragraph uses light weight (300) throughout, which should be visibly thinner
          than the regular weight paragraph above.
        </p>
      </div>
    </div>
  );
}

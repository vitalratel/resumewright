export default function FontStylesCV() {
  return (
    <div style={{ fontFamily: 'Arial', fontSize: '12px', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        Font Styles Test
      </h1>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontStyle: 'normal', fontSize: '14px' }}>
          Normal style - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontStyle: 'italic', fontSize: '14px' }}>
          Italic style - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold', fontStyle: 'normal', fontSize: '14px' }}>
          Bold - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '14px' }}>
          Bold Italic - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontFamily: 'Times New Roman' }}>
        <div style={{ fontStyle: 'italic', fontSize: '14px' }}>
          Times Italic - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontFamily: 'Times New Roman' }}>
        <div style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '14px' }}>
          Times Bold Italic - The quick brown fox jumps over the lazy dog
        </div>
      </div>
    </div>
  );
}

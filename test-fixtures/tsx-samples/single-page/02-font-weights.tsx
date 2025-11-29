export default function FontWeightsCV() {
  return (
    <div style={{ fontFamily: 'Arial', fontSize: '12px', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        Font Weights Test
      </h1>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: 'normal', fontSize: '14px' }}>
          Normal weight (400) - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          Bold weight (700) - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontFamily: 'Times New Roman' }}>
        <div style={{ fontWeight: 'normal', fontSize: '14px' }}>
          Times Normal - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontFamily: 'Times New Roman' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          Times Bold - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontFamily: 'Courier New' }}>
        <div style={{ fontWeight: 'normal', fontSize: '14px' }}>
          Courier Normal - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontFamily: 'Courier New' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          Courier Bold - The quick brown fox jumps over the lazy dog
        </div>
      </div>
    </div>
  );
}

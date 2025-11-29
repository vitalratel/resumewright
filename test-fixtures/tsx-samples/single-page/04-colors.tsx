export default function ColorsCV() {
  return (
    <div style={{ fontFamily: 'Arial', fontSize: '12px', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        Colors Test
      </h1>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#ff0000', fontSize: '14px' }}>
          Hex color #ff0000 (red) - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#00ff00', fontSize: '14px' }}>
          Hex color #00ff00 (green) - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#0000ff', fontSize: '14px' }}>
          Hex color #0000ff (blue) - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: 'rgb(255, 87, 51)', fontSize: '14px' }}>
          RGB color (255, 87, 51) - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#333', fontSize: '14px' }}>
          Short hex #333 - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ backgroundColor: '#ffff00', padding: '5px', fontSize: '14px' }}>
          Background color yellow - The quick brown fox jumps over the lazy dog
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ color: '#fff', backgroundColor: '#000080', padding: '5px', fontSize: '14px' }}>
          White on navy - The quick brown fox jumps over the lazy dog
        </div>
      </div>
    </div>
  );
}

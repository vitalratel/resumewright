export default function MixedStylingCV() {
  return (
    <div style={{ fontFamily: 'Arial', fontSize: '12px', padding: '20px' }}>
      <h1 style={{ 
        fontFamily: 'Times New Roman', 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color: '#2c3e50',
        marginBottom: '10px' 
      }}>
        John Doe
      </h1>
      
      <div style={{ 
        fontFamily: 'Arial', 
        fontSize: '14px', 
        color: '#34495e',
        marginBottom: '20px' 
      }}>
        Senior Software Engineer
      </div>

      <h2 style={{ 
        fontFamily: 'Arial', 
        fontSize: '18px', 
        fontWeight: 'bold',
        color: '#16a085',
        marginBottom: '10px',
        marginTop: '15px'
      }}>
        Experience
      </h2>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          fontFamily: 'Arial', 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: '#2c3e50'
        }}>
          Tech Company Inc.
        </div>
        <div style={{ 
          fontFamily: 'Arial', 
          fontSize: '12px', 
          fontStyle: 'italic',
          color: '#7f8c8d'
        }}>
          2020 - Present
        </div>
        <div style={{ 
          fontFamily: 'Georgia', 
          fontSize: '12px',
          color: '#34495e',
          marginTop: '5px'
        }}>
          Led development of distributed systems using modern technologies.
        </div>
      </div>

      <h2 style={{ 
        fontFamily: 'Arial', 
        fontSize: '18px', 
        fontWeight: 'bold',
        color: '#16a085',
        marginBottom: '10px',
        marginTop: '15px'
      }}>
        Skills
      </h2>

      <div style={{ 
        fontFamily: 'Courier New', 
        fontSize: '11px',
        color: '#c0392b',
        backgroundColor: '#ecf0f1',
        padding: '8px',
        marginBottom: '10px'
      }}>
        JavaScript, TypeScript, React, Node.js, Python, Rust
      </div>

      <div style={{ 
        fontFamily: 'Arial', 
        fontSize: '10px',
        color: '#95a5a6',
        marginTop: '20px',
        fontStyle: 'italic'
      }}>
        References available upon request
      </div>
    </div>
  );
}

// TEST FILE: TSX_EXECUTION_ERROR - Runtime error during execution
// Expected: SYNTAX error category, execution error message

const CV = () => {
  // This will throw a runtime error
  throw new Error('Intentional runtime error for testing');
  
  return (
    <div className="cv-container">
      <h1>This will never render</h1>
    </div>
  );
};

export default CV;

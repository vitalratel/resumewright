// TEST FILE: TSX_PARSE_ERROR - Invalid Syntax (Missing closing tag)
// Expected: SYNTAX error category, "Failed to parse CV code"

const CV = () => (
  <div className="cv-container">
    <h1>Test CV
    {/* Missing closing tag for h1 and div */}
);

export default CV;

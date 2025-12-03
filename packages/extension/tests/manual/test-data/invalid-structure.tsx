// TEST FILE: TSX_VALIDATION_ERROR - Valid syntax but invalid CV structure
// Expected: SYNTAX error category, validation error message

const CV = () => <div>Not a proper CV - missing required CV structure</div>;

export default CV;

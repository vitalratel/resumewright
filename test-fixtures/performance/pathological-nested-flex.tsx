/*
 * Pathological Nested Flex Test Case
 *
 * This fixture creates deeply nested flex containers to stress-test
 * layout algorithm performance with O(n²) complexity.
 *
 * Structure: 3 levels of nesting, ~4000 total nodes
 * - Outer flex container (10 children)
 *   - Each child is a flex container (10 children)
 *     - Each grandchild is a flex container (10 children)
 *       - Content elements
 *
 * Expected performance: ~100-200ms
 */

export default function PathologicalNestedFlexCV() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
      <h1>Pathological Nested Flex Test</h1>
      <p>This CV contains deeply nested flex layouts to test worst-case performance.</p>

      {/* Level 1: Outer flex row (10 items) */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Level 2: Column flex container (10 items) */}
            {Array.from({ length: 10 }).map((_, j) => (
              <div key={j} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                {/* Level 3: Inner flex row (10 items) */}
                {Array.from({ length: 10 }).map((_, k) => (
                  <div key={k} style={{ flex: 1, padding: '2px' }}>
                    <span style={{ fontSize: '8px' }}>
                      Item {i}-{j}-{k}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Another section to increase node count */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {Array.from({ length: 10 }).map((_, j) => (
              <div key={j} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                {Array.from({ length: 10 }).map((_, k) => (
                  <div key={k} style={{ flex: 1, padding: '2px' }}>
                    <span style={{ fontSize: '8px' }}>
                      Section2 {i}-{j}-{k}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

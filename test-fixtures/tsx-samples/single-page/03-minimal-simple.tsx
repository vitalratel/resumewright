/**
 * Test Fixture: Minimal Simple Resume
 *
 * Description: Ultra-minimalist design with text-only content
 * Layout Type: single-column
 * Estimated Pages: 1
 * Font Complexity: Simple (1 font)
 * Special Features: No colors, no borders, maximum simplicity for ATS
 */

import React from 'react';

export default function MinimalResume() {
  return (
    <div style={{ fontFamily: 'Arial', fontSize: '11px', padding: '48px', maxWidth: '612px', color: '#000000', lineHeight: '1.4' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>MICHAEL RODRIGUEZ</div>
        <div style={{ fontSize: '11px' }}>Data Scientist</div>
        <div style={{ fontSize: '10px', marginTop: '4px' }}>
          Boston, MA | michael.rodriguez@email.com | (555) 246-8135
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>SUMMARY</h2>
        <div>
          Data Scientist with 5 years experience in machine learning, statistical modeling, and data visualization.
          Skilled in Python, R, and SQL with proven ability to derive actionable insights from complex datasets.
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>EXPERIENCE</h2>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold' }}>Senior Data Scientist - DataCorp Analytics, Boston, MA</div>
          <div style={{ fontSize: '10px', marginBottom: '4px' }}>January 2021 - Present</div>
          <div>
            Built predictive models achieving 92% accuracy for customer churn prediction.
            Led team of 3 data scientists on ML initiatives. Automated reporting pipeline saving 15 hours weekly.
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold' }}>Data Scientist - Analytics Inc, Cambridge, MA</div>
          <div style={{ fontSize: '10px', marginBottom: '4px' }}>June 2019 - December 2020</div>
          <div>
            Developed recommendation engine increasing sales by 18%. Performed A/B testing and statistical analysis.
            Created dashboards for stakeholder reporting.
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 'bold' }}>Data Analyst - TechStart, Boston, MA</div>
          <div style={{ fontSize: '10px', marginBottom: '4px' }}>July 2018 - May 2019</div>
          <div>
            Analyzed user behavior data and created reports. Supported data pipeline development. Collaborated with
            product team on feature analytics.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>EDUCATION</h2>
        <div style={{ fontWeight: 'bold' }}>Master of Science in Data Science</div>
        <div style={{ fontSize: '10px', marginBottom: '8px' }}>MIT, Cambridge, MA - 2016-2018</div>
        <div style={{ fontWeight: 'bold' }}>Bachelor of Science in Mathematics</div>
        <div style={{ fontSize: '10px' }}>Boston University, Boston, MA - 2012-2016</div>
      </div>

      <div>
        <h2 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>SKILLS</h2>
        <div>
          Python, R, SQL, TensorFlow, Scikit-learn, Pandas, NumPy, Tableau, Power BI, AWS, Git, Machine Learning,
          Statistical Analysis, Data Visualization, A/B Testing, Predictive Modeling
        </div>
      </div>
    </div>
  );
}

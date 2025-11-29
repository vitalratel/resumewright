/*
 * Large CV Test Case - 500+ Nodes
 *
 * Manually constructed large CV with explicit nested flex containers
 * to test performance with high node counts.
 */

export default function LargeCV() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>John Doe</h1>
        <p style={{ fontSize: '16px', marginBottom: '5px' }}>Senior Software Engineer</p>
        <p style={{ fontSize: '14px' }}>
          john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe
        </p>
      </div>

      {/* Summary Section */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
          Professional Summary
        </h2>
        <p style={{ fontSize: '12px', lineHeight: '1.5' }}>
          Accomplished software engineer with 15+ years of experience in full-stack development,
          cloud architecture, and team leadership. Expert in building scalable distributed systems
          and leading cross-functional teams to deliver high-impact products.
        </p>
      </div>

      {/* Two-Column Layout - Main content area */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left Column - Experience */}
        <div style={{ flex: '2' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
            Experience
          </h2>

          {/* Job 1 */}
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Senior Software Engineer</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '5px',
              }}
            >
              <span>Tech Corp Inc.</span>
              <span>2020 - Present</span>
            </div>
            <ul style={{ fontSize: '12px', lineHeight: '1.4', marginLeft: '20px' }}>
              <li>Led development of microservices architecture serving 10M+ users</li>
              <li>Designed and implemented real-time data processing pipeline</li>
              <li>Mentored team of 8 engineers and conducted code reviews</li>
              <li>Reduced system latency by 60% through optimization initiatives</li>
              <li>Implemented CI/CD pipeline reducing deployment time by 80%</li>
            </ul>
          </div>

          {/* Job 2 */}
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Software Engineer</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '5px',
              }}
            >
              <span>StartupXYZ</span>
              <span>2017 - 2020</span>
            </div>
            <ul style={{ fontSize: '12px', lineHeight: '1.4', marginLeft: '20px' }}>
              <li>Built REST APIs handling 1M+ requests per day</li>
              <li>Developed responsive frontend using React and TypeScript</li>
              <li>Implemented authentication and authorization systems</li>
              <li>Optimized database queries improving performance by 40%</li>
              <li>Collaborated with product team on feature development</li>
            </ul>
          </div>

          {/* Job 3 */}
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Junior Developer</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '5px',
              }}
            >
              <span>Web Solutions LLC</span>
              <span>2015 - 2017</span>
            </div>
            <ul style={{ fontSize: '12px', lineHeight: '1.4', marginLeft: '20px' }}>
              <li>Developed e-commerce websites using PHP and MySQL</li>
              <li>Created responsive designs with HTML, CSS, and JavaScript</li>
              <li>Integrated payment gateways and shipping APIs</li>
              <li>Performed bug fixes and feature enhancements</li>
              <li>Participated in agile development process</li>
            </ul>
          </div>

          {/* Job 4 */}
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>Software Development Intern</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '5px',
              }}
            >
              <span>Enterprise Systems Corp</span>
              <span>Summer 2014</span>
            </div>
            <ul style={{ fontSize: '12px', lineHeight: '1.4', marginLeft: '20px' }}>
              <li>Assisted in developing internal tools and utilities</li>
              <li>Wrote automated test scripts for QA team</li>
              <li>Documented codebase and created technical specifications</li>
              <li>Participated in daily standups and sprint planning</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Skills, Education, Certifications */}
        <div style={{ flex: '1' }}>
          {/* Skills Section */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
              Skills
            </h2>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                Languages
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  JavaScript
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  TypeScript
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Python
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Java
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Go
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  SQL
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Rust
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                Frameworks
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  React
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Node.js
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Express
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Django
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Spring Boot
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Next.js
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                Technologies
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Docker
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Kubernetes
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  AWS
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  PostgreSQL
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  Redis
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  MongoDB
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  GraphQL
                </span>
                <span style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#e0e0e0' }}>
                  RabbitMQ
                </span>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
              Education
            </h2>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold' }}>M.S. Computer Science</h3>
              <p style={{ fontSize: '11px' }}>Stanford University</p>
              <p style={{ fontSize: '11px' }}>2014 - 2015</p>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold' }}>B.S. Computer Science</h3>
              <p style={{ fontSize: '11px' }}>University of California, Berkeley</p>
              <p style={{ fontSize: '11px' }}>2010 - 2014</p>
            </div>
          </div>

          {/* Certifications Section */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
              Certifications
            </h2>
            <ul style={{ fontSize: '11px', lineHeight: '1.4', marginLeft: '15px' }}>
              <li>AWS Certified Solutions Architect</li>
              <li>Kubernetes Administrator (CKA)</li>
              <li>Google Cloud Professional</li>
              <li>MongoDB Certified Developer</li>
            </ul>
          </div>

          {/* Projects Section */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
              Projects
            </h2>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold' }}>Open Source Contributions</h3>
              <ul style={{ fontSize: '10px', lineHeight: '1.3', marginLeft: '15px' }}>
                <li>React - Core contributor (500+ commits)</li>
                <li>Node.js - Documentation improvements</li>
                <li>TypeScript - Bug fixes and features</li>
              </ul>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold' }}>Personal Projects</h3>
              <ul style={{ fontSize: '10px', lineHeight: '1.3', marginLeft: '15px' }}>
                <li>Built task management SaaS (10k+ users)</li>
                <li>Created developer tools CLI (npm package)</li>
                <li>Developed real-time chat application</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
          Publications & Speaking
        </h2>

        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold' }}>Conference Talks</h3>
          <ul style={{ fontSize: '11px', lineHeight: '1.4', marginLeft: '15px' }}>
            <li>"Scaling Microservices with Kubernetes" - DevOps Summit 2023</li>
            <li>"Building Real-Time Systems" - Tech Conference 2022</li>
            <li>"Modern Frontend Architecture" - React Summit 2021</li>
          </ul>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold' }}>Blog Posts</h3>
          <ul style={{ fontSize: '11px', lineHeight: '1.4', marginLeft: '15px' }}>
            <li>"Optimizing React Performance" - 50k+ views</li>
            <li>"Introduction to GraphQL" - 30k+ views</li>
            <li>"Docker Best Practices" - 25k+ views</li>
          </ul>
        </div>
      </div>

      {/* Awards Section */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px', borderBottom: '2px solid black' }}>
          Awards & Recognition
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', marginLeft: '15px' }}>
          <li>Employee of the Year - Tech Corp Inc. (2023)</li>
          <li>Innovation Award for Microservices Architecture (2022)</li>
          <li>Hackathon Winner - Internal Innovation Challenge (2021)</li>
          <li>Best Technical Blog - Company Blog Awards (2020)</li>
        </ul>
      </div>
    </div>
  );
}

/*
 * Node count estimate:
 * - Header: ~10 nodes
 * - Summary: ~5 nodes
 * - Experience (4 jobs): ~120 nodes
 * - Skills section: ~80 nodes (with flex-wrap tags)
 * - Education: ~20 nodes
 * - Certifications: ~10 nodes
 * - Projects: ~30 nodes
 * - Publications: ~20 nodes
 * - Awards: ~10 nodes
 *
 * TOTAL: ~305 explicit nodes
 * With parsed text content and nested structures: ~500+ effective nodes
 */

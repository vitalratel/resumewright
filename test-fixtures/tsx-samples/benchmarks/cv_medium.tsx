export default function MediumCV() {
  return (
    <div style="font-family: Arial; font-size: 12px">
      <h1 style="font-family: Georgia">John Michael Smith Jr.</h1>
      <p>john.smith+cv@example.com | +1 (555) 987-6543 | New York, NY</p>
      <p>www.johnsmith.dev | linkedin.com/in/johnsmith</p>
      
      <h2>Professional Summary</h2>
      <p>
        Senior Software Engineer with 5+ years of experience building scalable distributed systems.
        Expertise in backend development, cloud architecture, and team leadership.
      </p>
      
      <h2>Experience</h2>
      
      <div>
        <h3>Senior Software Engineer | Tech Corp</h3>
        <p>San Francisco, CA | 2021 - Present</p>
        <ul>
          <li>Led development of microservices platform serving 10M+ daily users</li>
          <li>Reduced API latency by 45% through database optimization and caching</li>
          <li>Mentored team of 5 engineers on best practices and code quality</li>
          <li>Implemented CI/CD pipelines reducing deployment time by 80%</li>
        </ul>
      </div>
      
      <div>
        <h3>Software Engineer | StartupCo</h3>
        <p>Palo Alto, CA | 2019 - 2021</p>
        <ul>
          <li>Built real-time analytics platform processing 1TB+ data daily</li>
          <li>Developed REST APIs serving 100K+ requests per second</li>
          <li>Collaborated with product team to define technical requirements</li>
          <li>Participated in on-call rotation supporting 99.9% uptime SLA</li>
        </ul>
      </div>
      
      <div>
        <h3>Junior Developer | Enterprise Inc</h3>
        <p>San Jose, CA | 2018 - 2019</p>
        <ul>
          <li>Developed internal tools improving developer productivity by 30%</li>
          <li>Fixed critical bugs in production systems serving enterprise clients</li>
          <li>Wrote comprehensive unit and integration tests</li>
        </ul>
      </div>
      
      <h2>Education</h2>
      
      <div>
        <h3>Master of Science in Computer Science</h3>
        <p>Stanford University | 2018</p>
        <p>GPA: 3.9/4.0 | Thesis: "Optimizing Distributed Systems"</p>
      </div>
      
      <div>
        <h3>Bachelor of Science in Computer Science</h3>
        <p>UC Berkeley | 2016</p>
        <p>GPA: 3.8/4.0, Magna Cum Laude</p>
      </div>
      
      <h2>Technical Skills</h2>
      <p><strong>Languages:</strong> Rust, TypeScript, Python, Go, Java, C++</p>
      <p><strong>Frameworks:</strong> React, Node.js, Express, Actix, Spring Boot</p>
      <p><strong>Tools:</strong> Docker, Kubernetes, Git, Jenkins, Terraform</p>
      <p><strong>Databases:</strong> PostgreSQL, MySQL, Redis, MongoDB</p>
      <p><strong>Cloud:</strong> AWS (EC2, S3, Lambda, RDS), GCP, Azure</p>
      
      <h2>Certifications</h2>
      <p>AWS Certified Solutions Architect - Professional (2023)</p>
      <p>Certified Kubernetes Administrator (CKA) (2022)</p>
      
      <h2>Projects</h2>
      <div>
        <h3>Open Source Contributions</h3>
        <p>Core contributor to Tokio async runtime (500+ stars)</p>
        <p>Maintainer of popular Rust CLI tool (2K+ stars)</p>
      </div>
    </div>
  );
}

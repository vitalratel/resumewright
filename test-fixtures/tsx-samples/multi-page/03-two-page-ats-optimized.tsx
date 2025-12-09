import React from 'react';

// Anonymized version of a real 2-page ATS-optimized CV
// Preserves the exact structure that triggered the RECENT PROJECTS orphan bug

export default function ATSOptimizedCV() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold mb-2">JOHN DOE</h1>
        <div className="text-sm space-y-1">
          <p>New York, NY | +1 555-123-4567</p>
          <p>john.doe@email.com | linkedin.com/in/johndoe</p>
          <p>johndoe.dev | github.com/johndoe</p>
        </div>
      </div>

      {/* Professional Summary */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">PROFESSIONAL SUMMARY</h2>
        <p className="text-sm leading-relaxed">
          Software developer building tools in Rust and TypeScript. Recent projects include PDFForge (Rust/WASM tool for generating ATS-compatible PDFs from TSX),
          bundle-analyzer (CLI for analyzing and reducing WebAssembly bundle sizes), and ui-checker (frontend codebase auditor for missing UI states).
          Background includes 20 years in enterprise backend development—HR systems, payroll, and integrations—which taught me to handle complexity,
          ship reliably, and think about the humans using the software. Strong foundation in API design, system integration, and delivering scalable solutions.
          Seeking opportunities in backend development, systems programming, or full-stack roles.
        </p>
      </section>

      {/* Technical Skills */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">TECHNICAL SKILLS</h2>
        <div className="text-sm space-y-3">
          <div>
            <p className="font-semibold">Programming Languages & Frameworks:</p>
            <p>Rust, TypeScript, WebAssembly (WASM), Object-Oriented Programming (OOP), SAP/ABAP</p>
          </div>
          <div>
            <p className="font-semibold">Development Tools & Practices:</p>
            <p>AI-Augmented Development, API Development & Integration, RESTful Services, CLI Tools Development, WebAssembly Optimization, Static Analysis, AST Parsing, CSS Parsing, Version Control (Git), JSON, Debugging, Technical Documentation, Test-Driven Development</p>
          </div>
          <div>
            <p className="font-semibold">Core Competencies:</p>
            <p>Backend Development, System Integration, Data Structures & Algorithms, Database Design, Data Migration, Performance Optimization, Problem Solving, Requirements Analysis, Code Auditing, Developer Tooling</p>
          </div>
          <div>
            <p className="font-semibold">Enterprise Software Experience:</p>
            <p>Complex Business Logic, Multi-system Integration, Authorization & Security, Scalable Architecture Design, Enterprise Application Development</p>
          </div>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">RECENT PROJECTS</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-bold">PDFForge</h3>
            <p className="italic mb-1">TypeScript · Rust/WebAssembly · Browser Extension</p>
            <p>Browser extension that converts TSX components into ATS-compatible PDFs. Built with TypeScript/React for the extension UI and Rust/WASM for high-performance PDF generation. Privacy-first architecture with 100% client-side processing.</p>
          </div>
          <div>
            <h3 className="font-bold">bundle-analyzer</h3>
            <p className="italic mb-1">Rust · CLI Tool · WebAssembly Optimization</p>
            <p>Command-line interface for analyzing and reducing WebAssembly bundle sizes. Helps developers optimize WASM binaries for production deployment.</p>
          </div>
          <div>
            <h3 className="font-bold">ui-checker</h3>
            <p className="italic mb-1">TypeScript · Static Analysis · AST/CSS Parsing</p>
            <p>CLI tool that performs static analysis on frontend codebases to detect missing interactive states (hover, focus, active, disabled) on UI components. Uses AST parsing for JSX/TSX and CSS parsing for stylesheets. Supports multiple frameworks (React, Vue, Svelte) and outputs reports in various formats including SARIF for CI/CD integration.</p>
          </div>
          <p className="text-xs italic mt-2">View all projects: github.com/johndoe</p>
        </div>
      </section>

      {/* Work Experience */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">PROFESSIONAL EXPERIENCE</h2>

        {/* Current Role */}
        <div className="mb-5">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold">Software Engineer</h3>
            <span className="text-sm">May 2023 – August 2025</span>
          </div>
          <p className="text-sm italic mb-2">TechCorp Robotics Ltd – New York</p>
          <ul className="text-sm space-y-1 ml-5 list-disc">
            <li>Developed and maintained backend business applications supporting robotics operations</li>
            <li>Designed and implemented API integrations with external systems and third-party applications</li>
            <li>Optimized existing codebase for improved performance and maintainability</li>
            <li>Collaborated with product team to translate business requirements into technical solutions</li>
            <li>Implemented data processing pipelines for business intelligence and reporting</li>
          </ul>
        </div>

        {/* Second Role */}
        <div className="mb-5">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold">Backend Developer</h3>
            <span className="text-sm">February 2022 – August 2023</span>
          </div>
          <p className="text-sm italic mb-2">GlobalTech Solutions Inc</p>
          <ul className="text-sm space-y-1 ml-5 list-disc">
            <li>Built backend services and RESTful APIs for employee and manager self-service applications</li>
            <li>Developed data integration solutions connecting multiple HR and payroll systems</li>
            <li>Implemented business logic for complex workflows including payroll processing, time management, and organizational structures</li>
            <li>Collaborated with frontend teams to design API contracts and data models</li>
            <li>Mentored developers on coding best practices and software design principles</li>
            <li>Participated in code reviews and maintained high code quality standards</li>
          </ul>
        </div>

        {/* Consolidated Earlier Experience */}
        <div className="mb-5">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold">Software Developer & Technical Specialist</h3>
            <span className="text-sm">November 2002 – February 2022</span>
          </div>
          <p className="text-sm italic mb-2">Multiple Organizations – Various Locations</p>
          <ul className="text-sm space-y-1 ml-5 list-disc">
            <li>20 years progressive experience in enterprise software development across leading tech and energy companies</li>
            <li>Developed backend applications for HR, payroll, time tracking, and organizational management systems</li>
            <li>Built APIs and integration services connecting multiple enterprise systems</li>
            <li>Implemented complex business logic for payroll calculations, leave management, and workforce planning</li>
            <li>Led data migration projects moving critical business data between systems</li>
            <li>Designed and developed custom reports and data visualization solutions</li>
            <li>Provided technical leadership on software architecture and design decisions</li>
            <li>Trained end-users and created technical documentation for various software applications</li>
            <li>Worked in agile teams, collaborating with business analysts, QA engineers, and stakeholders</li>
          </ul>
        </div>
      </section>

      {/* Education */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">EDUCATION</h2>
        <div className="mb-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">Bachelor of Science, Computer Science</h3>
              <p className="text-sm">State University</p>
            </div>
            <span className="text-sm">1997 – 2002</span>
          </div>
          <p className="text-sm italic">Boston, MA</p>
        </div>
      </section>

      {/* Languages */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">LANGUAGES</h2>
        <div className="text-sm">
          <p><span className="font-semibold">Native:</span> English</p>
          <p><span className="font-semibold">Spanish:</span> Proficient (C1 Reading/Listening/Writing, B2 Speaking)</p>
        </div>
      </section>

      {/* Additional Information */}
      <section>
        <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">ADDITIONAL INFORMATION</h2>
        <div className="text-sm">
          <p><span className="font-semibold">Location:</span> New York, NY</p>
          <p><span className="font-semibold">Driving License:</span> Valid US License</p>
          <p><span className="font-semibold">Interests:</span> Road cycling, Basketball, Open source</p>
        </div>
      </section>

      {/* Footer note */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600 text-center">
        <p>Portfolio: johndoe.dev | GitHub: github.com/johndoe</p>
      </div>
    </div>
  );
}

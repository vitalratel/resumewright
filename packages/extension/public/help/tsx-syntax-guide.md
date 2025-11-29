# Understanding CV Code (TSX)

A simple explanation of the code format Claude uses for CVs.

---

## What is TSX?

TSX is a format that combines **HTML-like tags** with **JavaScript**. When Claude creates your CV, it uses TSX to structure the content.

**Don't worry!** You don't need to understand programming to use ResumeWright. This guide just helps you understand error messages better.

---

## Basic Structure

Your CV code looks something like this:

```tsx
<div className="cv">
  <header>
    <h1>Your Name</h1>
    <p>Your Email</p>
  </header>
  
  <section className="experience">
    <h2>Experience</h2>
    <Experience>
      <Company>Acme Corp</Company>
      <Role>Senior Developer</Role>
    </Experience>
  </section>
</div>
```

### Breaking it down:

- **Tags** are wrapped in `< >` (like `<header>`, `<h1>`, `<Company>`)
- **Closing tags** have a `/` (like `</header>`, `</h1>`, `</Company>`)
- **Everything needs a closing tag** - that's the most common error!

---

## Common Sections

### Personal Info
```tsx
<header>
  <h1>John Doe</h1>
  <p>john@example.com | (555) 123-4567</p>
  <p>San Francisco, CA</p>
</header>
```

### Experience
```tsx
<section className="experience">
  <h2>Work Experience</h2>
  <Experience>
    <Company>Tech Company</Company>
    <Role>Software Engineer</Role>
    <Duration>2020 - 2023</Duration>
    <ul>
      <li>Built awesome features</li>
      <li>Led team projects</li>
    </ul>
  </Experience>
</section>
```

### Education
```tsx
<section className="education">
  <h2>Education</h2>
  <Education>
    <School>University Name</School>
    <Degree>Bachelor of Science in Computer Science</Degree>
    <Year>2020</Year>
  </Education>
</section>
```

### Skills
```tsx
<section className="skills">
  <h2>Skills</h2>
  <ul>
    <li>JavaScript, React, Node.js</li>
    <li>Python, Django</li>
    <li>Git, Docker, AWS</li>
  </ul>
</section>
```

---

## Common Errors

### 1. Missing Closing Tag

**❌ Wrong:**
```tsx
<Experience>
  <Company>Acme Corp</Company>
  <Role>Senior Developer
</Experience>
```

**✅ Right:**
```tsx
<Experience>
  <Company>Acme Corp</Company>
  <Role>Senior Developer</Role>
</Experience>
```

**What went wrong:** The `<Role>` tag wasn't closed with `</Role>`.

### 2. Mismatched Tags

**❌ Wrong:**
```tsx
<Experience>
  <Company>Acme Corp</Company>
</Company>
```

**✅ Right:**
```tsx
<Experience>
  <Company>Acme Corp</Company>
</Experience>
```

**What went wrong:** Opened with `<Experience>` but closed with `</Company>`.

### 3. Extra Closing Tag

**❌ Wrong:**
```tsx
<Experience>
  <Company>Acme Corp</Company>
</Experience>
</Experience>
```

**✅ Right:**
```tsx
<Experience>
  <Company>Acme Corp</Company>
</Experience>
```

**What went wrong:** Two closing `</Experience>` tags, but only one opening tag.

### 4. Unclosed Parent Tag

**❌ Wrong:**
```tsx
<section className="experience">
  <h2>Experience</h2>
  <Experience>
    <Company>Acme Corp</Company>
  </Experience>
<!-- Missing </section> -->
```

**✅ Right:**
```tsx
<section className="experience">
  <h2>Experience</h2>
  <Experience>
    <Company>Acme Corp</Company>
  </Experience>
</section>
```

**What went wrong:** Forgot to close the `<section>` tag.

---

## Reading Error Messages

When you see a syntax error, ResumeWright shows you:

### Line Number
```
Error on line 42
```
This tells you **exactly where** to look in the code.

### Code Context
```
40 | <Experience>
41 |   <Company>Acme Corp</Company>
42 |   <Role>Senior Developer
     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
     Missing closing tag

43 |   <Duration>2020-2023</Duration>
44 | </Experience>
```

The arrow (`^`) points to the problem. In this case, line 42 is missing `</Role>`.

---

## What If I Don't Understand Code?

**Good news:** You don't need to fix the code yourself!

### Easy solutions:
1. **Ask Claude to fix it:** "There's a syntax error on line 42, can you fix it?"
2. **Regenerate:** "Can you create my CV again?"
3. **Let Claude do the work:** Just describe what you want, Claude will write the code

**You shouldn't need to edit the code manually.** ResumeWright and Claude do the technical work for you.

---

## Why Does Claude Use Code?

**Benefits of TSX format:**
- ✅ **Structured data:** Each section has clear labels
- ✅ **Consistency:** Same format every time
- ✅ **Flexibility:** Easy to customize and rearrange
- ✅ **PDF-ready:** Converts perfectly to professional PDFs

---

## Tips for Working with Claude

### When asking for a CV:
```
"Create my CV in TSX format with these sections:
- Personal info
- Professional summary
- Work experience
- Education
- Skills
Please use standard formatting."
```

### If you get an error:
```
"There's a syntax error on line X. The error says [error message]. 
Can you fix it?"
```

### To modify your CV:
```
"Add a new job to my experience:
- Company: TechCorp
- Role: Senior Developer
- Duration: 2023-2024
- Responsibilities: [list them]"
```

Claude will handle all the code - you just provide the content!

---

## Still Confused?

**Remember:**
- You **don't need to understand** the code
- Claude **writes the code** for you
- ResumeWright **converts the code** to PDF
- You just **review and download** the result

**If there's an error:**
1. Read the error message (it tells you what's wrong)
2. Note the line number
3. Ask Claude to fix it
4. Try again!

---

## Examples: Before and After

### Simple CV (Correct)
```tsx
<div className="cv">
  <header>
    <h1>Jane Smith</h1>
    <p>jane@email.com</p>
  </header>
  <section>
    <h2>Education</h2>
    <p>BS Computer Science, MIT, 2020</p>
  </section>
</div>
```

**Why it works:**
- Every tag has a closing tag
- Tags are properly nested
- No typos in tag names

### Common Mistake (Incorrect)
```tsx
<div className="cv">
  <header>
    <h1>Jane Smith</h1>
    <p>jane@email.com
  </header>
  <section>
    <h2>Education</h2>
    <p>BS Computer Science, MIT, 2020</p>
  </section>
</div>
```

**What's wrong:**
- Missing `</p>` on line 4
- Error will say: "Missing closing tag on line 4"

**How to fix:**
Tell Claude: "Please fix the missing closing tag on line 4"

---

**Need more help?**  
See our [Troubleshooting Guide](./troubleshooting.md) for common problems and solutions.

**Last Updated:** 2025-10-18  
**Version:** 1.0.0

/**
 * Test Fixture: Three-Page Academic CV
 *
 * Description: Comprehensive academic CV with publications and research experience
 * Layout Type: single-column
 * Estimated Pages: 3
 * Font Complexity: Simple (1-2 fonts)
 * Special Features: Tests multi-page pagination, extensive lists, academic formatting
 * Test Objectives:
 *   - Verify content flows correctly across 3 pages
 *   - Ensure section headings don't orphan
 *   - Validate complex lists and nested content paginate properly
 */

export default function ThreePageAcademicCV() {
  return (
    <div style={{ fontFamily: 'Times New Roman', fontSize: '11px', padding: '36px', maxWidth: '612px', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '6px', color: '#000000' }}>
          Dr. Michael Chen, Ph.D.
        </h1>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          Associate Professor of Computer Science
        </div>
        <div style={{ fontSize: '10px', color: '#666666' }}>
          Department of Computer Science • MIT • Cambridge, MA 02139
        </div>
        <div style={{ fontSize: '10px', color: '#666666' }}>
          m.chen@mit.edu • +1 (617) 555-0123 • https://web.mit.edu/~mchen
        </div>
      </div>

      {/* Research Interests */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Research Interests
        </h2>
        <p style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
          Machine Learning, Natural Language Processing, Deep Learning Architectures, Neural Machine Translation,
          Transfer Learning, Few-Shot Learning, Multimodal AI Systems
        </p>
      </div>

      {/* Education */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Education
        </h2>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#000000' }}>
            Ph.D. in Computer Science, Stanford University, 2015
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
            Dissertation: "Neural Approaches to Cross-Lingual Transfer Learning in Low-Resource Languages"
          </div>
          <div style={{ fontSize: '10px', color: '#666666' }}>
            Advisor: Prof. Andrew Ng
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#000000' }}>
            M.S. in Computer Science, Stanford University, 2012
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#000000' }}>
            B.S. in Computer Science, UC Berkeley, 2010
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
            Summa Cum Laude, Phi Beta Kappa
          </div>
        </div>
      </div>

      {/* Academic Positions */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Academic Positions
        </h2>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#000000' }}>Associate Professor</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2021 - Present</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            Massachusetts Institute of Technology, Department of Computer Science
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#000000' }}>Assistant Professor</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2016 - 2021</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            Massachusetts Institute of Technology, Department of Computer Science
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#000000' }}>Postdoctoral Researcher</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2015 - 2016</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            Google Brain, Mountain View, CA
          </div>
        </div>
      </div>

      {/* Publications - Selected */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Selected Publications
        </h2>
        <div style={{ fontSize: '10px', color: '#666666', fontStyle: 'italic', marginBottom: '8px' }}>
          (* indicates equal contribution, † indicates corresponding author)
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Chen, M.*</span>, Zhang, L.*, and Smith, J.†
            "Efficient Few-Shot Learning through Adaptive Meta-Learning Architectures."
            <span style={{ fontStyle: 'italic' }}> Nature Machine Intelligence</span>, vol. 5, pp. 234-247, 2024.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Chen, M.†</span>, Rodriguez, A., and Kim, S.
            "Cross-Lingual Transfer Learning for Low-Resource Neural Machine Translation."
            <span style={{ fontStyle: 'italic' }}> Proceedings of ACL 2023</span>, pp. 1245-1258, 2023.
            <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
              🏆 Best Paper Award
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            Wang, Y., <span style={{ fontWeight: 'bold' }}>Chen, M.†</span>, and Liu, H.
            "Multimodal Transformer Networks for Vision-Language Understanding."
            <span style={{ fontStyle: 'italic' }}> NeurIPS 2022</span>, pp. 8934-8945, 2022.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Chen, M.</span>, Thompson, R., and Davis, K.
            "Attention Mechanisms for Contextual Word Embeddings in Neural Networks."
            <span style={{ fontStyle: 'italic' }}> ICML 2021</span>, pp. 2134-2146, 2021.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Chen, M.†</span> and Ng, A.
            "Transfer Learning Approaches for Neural Machine Translation in Low-Resource Settings."
            <span style={{ fontStyle: 'italic' }}> Computational Linguistics</span>, vol. 46, no. 3, pp. 567-592, 2020.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            Lee, S., <span style={{ fontWeight: 'bold' }}>Chen, M.</span>, and Patel, N.
            "Deep Learning for Sentiment Analysis in Multilingual Social Media Data."
            <span style={{ fontStyle: 'italic' }}> EMNLP 2019</span>, pp. 3421-3432, 2019.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Chen, M.</span>, Garcia, P., and Anderson, T.
            "Improving Neural Network Generalization through Curriculum Learning."
            <span style={{ fontStyle: 'italic' }}> ICLR 2018</span>, pp. 1123-1135, 2018.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Chen, M.</span>, Brown, K., and Wilson, J.
            "Recurrent Neural Networks for Sequence-to-Sequence Learning in Machine Translation."
            <span style={{ fontStyle: 'italic' }}> Proceedings of ACL 2017</span>, pp. 892-903, 2017.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
            Martinez, L., <span style={{ fontWeight: 'bold' }}>Chen, M.*</span>, and Johnson, R.*
            "Word Embeddings for Cross-Lingual Information Retrieval."
            <span style={{ fontStyle: 'italic' }}> SIGIR 2016</span>, pp. 645-654, 2016.
          </div>
        </div>
      </div>

      {/* Grants & Funding */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Grants & Funding
        </h2>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>National Science Foundation CAREER Award</span> (2022-2027)
          </div>
          <div style={{ fontSize: '10px', color: '#666666' }}>
            "Efficient Few-Shot Learning for Neural Machine Translation" • $500,000
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Google Research Award</span> (2021-2023)
          </div>
          <div style={{ fontSize: '10px', color: '#666666' }}>
            "Multimodal Transfer Learning for Vision-Language Tasks" • $100,000
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>Amazon Research Award</span> (2020-2022)
          </div>
          <div style={{ fontSize: '10px', color: '#666666' }}>
            "Neural Approaches to Cross-Lingual Transfer" • $75,000
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>NSF Research Grant</span> (2018-2021)
          </div>
          <div style={{ fontSize: '10px', color: '#666666' }}>
            "Deep Learning for Low-Resource Languages" • $350,000 (Co-PI)
          </div>
        </div>
      </div>

      {/* Teaching Experience */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Teaching Experience
        </h2>
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>CS 6.867</span>: Machine Learning (Graduate) • MIT • Fall 2016-Present
          </div>
        </div>
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>CS 6.864</span>: Advanced Natural Language Processing (Graduate) • MIT • Spring 2017-Present
          </div>
        </div>
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            <span style={{ fontWeight: 'bold' }}>CS 6.034</span>: Artificial Intelligence (Undergraduate) • MIT • Fall 2018-2022
          </div>
        </div>
      </div>

      {/* Graduate Students Advised */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Graduate Students Advised
        </h2>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Ph.D. Students (Current):</span>
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0', marginBottom: '8px' }}>
          <li>Sarah Johnson (2021-Present) - Few-Shot Learning for NLP</li>
          <li>David Kim (2022-Present) - Multimodal AI Systems</li>
          <li>Emily Rodriguez (2023-Present) - Neural Machine Translation</li>
        </ul>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Ph.D. Students (Graduated):</span>
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0', marginBottom: '8px' }}>
          <li>Lisa Zhang (2018-2023) - Now Assistant Professor at Carnegie Mellon University</li>
          <li>Alex Patel (2017-2022) - Now Research Scientist at DeepMind</li>
        </ul>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Master's Students:</span> 12 graduated (2016-2024)
        </div>
      </div>

      {/* Honors & Awards */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Honors & Awards
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '3px' }}>ACL Best Paper Award, Association for Computational Linguistics (2023)</li>
          <li style={{ marginBottom: '3px' }}>NSF CAREER Award, National Science Foundation (2022)</li>
          <li style={{ marginBottom: '3px' }}>MIT Junior Faculty Teaching Award (2020)</li>
          <li style={{ marginBottom: '3px' }}>Google Faculty Research Award (2021)</li>
          <li style={{ marginBottom: '3px' }}>Outstanding Dissertation Award, Stanford Computer Science (2016)</li>
          <li style={{ marginBottom: '3px' }}>ICML Travel Award (2014, 2015)</li>
          <li style={{ marginBottom: '3px' }}>Stanford Graduate Fellowship (2010-2012)</li>
        </ul>
      </div>

      {/* Professional Service */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Professional Service
        </h2>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Conference Organization:</span>
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0', marginBottom: '8px' }}>
          <li style={{ marginBottom: '2px' }}>Area Chair, ACL (2022, 2023, 2024)</li>
          <li style={{ marginBottom: '2px' }}>Senior Program Committee, AAAI (2021-2024)</li>
          <li style={{ marginBottom: '2px' }}>Workshop Co-Chair, EMNLP (2022)</li>
          <li style={{ marginBottom: '2px' }}>Tutorial Chair, NAACL (2021)</li>
        </ul>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Program Committee Member:</span>
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0', marginBottom: '8px' }}>
          <li style={{ marginBottom: '2px' }}>NeurIPS (2017-2024), ICML (2018-2024), ICLR (2019-2024)</li>
          <li style={{ marginBottom: '2px' }}>ACL (2017-2024), EMNLP (2017-2024), NAACL (2018-2024)</li>
        </ul>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Journal Reviewing:</span>
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0', marginBottom: '8px' }}>
          <li style={{ marginBottom: '2px' }}>Computational Linguistics, Journal of Machine Learning Research</li>
          <li style={{ marginBottom: '2px' }}>Transactions of ACL, IEEE Transactions on Neural Networks</li>
        </ul>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>Department Service:</span>
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '2px' }}>Graduate Admissions Committee, MIT CS (2020-2023)</li>
          <li style={{ marginBottom: '2px' }}>Faculty Search Committee, MIT CS (2021-2022)</li>
          <li style={{ marginBottom: '2px' }}>Curriculum Development Committee, MIT CS (2019-2021)</li>
        </ul>
      </div>

      {/* Invited Talks */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Selected Invited Talks
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '3px' }}>"Few-Shot Learning in Natural Language Processing" • Stanford AI Lab (2024)</li>
          <li style={{ marginBottom: '3px' }}>"Cross-Lingual Transfer Learning" • Google Research (2023)</li>
          <li style={{ marginBottom: '3px' }}>"Multimodal AI Systems" • Meta AI Research (2023)</li>
          <li style={{ marginBottom: '3px' }}>"Neural Machine Translation for Low-Resource Languages" • Microsoft Research (2022)</li>
          <li style={{ marginBottom: '3px' }}>"Deep Learning for NLP" • Carnegie Mellon University (2021)</li>
          <li style={{ marginBottom: '3px' }}>"Transfer Learning in Neural Networks" • UC Berkeley (2020)</li>
        </ul>
      </div>

      {/* Technical Skills */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Technical Skills
        </h2>
        <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
          <span style={{ fontWeight: 'bold' }}>Programming:</span> Python, C++, Java, CUDA, PyTorch, TensorFlow, JAX, Hugging Face Transformers
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333', marginTop: '3px' }}>
          <span style={{ fontWeight: 'bold' }}>Languages:</span> English (Native), Mandarin Chinese (Native), Spanish (Intermediate)
        </div>
      </div>

      {/* Professional Memberships */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000', textTransform: 'uppercase' }}>
          Professional Memberships
        </h2>
        <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#333333' }}>
          ACM (Association for Computing Machinery), IEEE (Institute of Electrical and Electronics Engineers),
          ACL (Association for Computational Linguistics), AAAI (Association for the Advancement of Artificial Intelligence)
        </div>
      </div>
    </div>
  );
}

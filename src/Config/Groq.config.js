const Groq = require("groq-sdk");
const { model } = require("mongoose");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const improveDescription = async (originalDescription) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Rewrite the provided project or experience details or skills   into a professional, high-impact resume entry. Use the Action Verb + Task + Result framework. Ensure the tone is concise and results-oriented, utilizing industry-standard terminology. Focus on quantifiable achievements and technical proficiency. Return only the improved description text, formatted with bullet points, with no introductory or concluding remarks. in just 3 lines or less",
        },
        {
          role: "user",
          content: `Improve this project description: "${originalDescription}"`,
        },
      ],
      model: "llama-3.1-8b-instant",
    });

    return completion.choices[0]?.message?.content || originalDescription;
  } catch (error) {
    console.error("Groq API Error:", error);
    return originalDescription;
  }
};

const RESUME_PARSER_SYSTEM_PROMPT = `
You are a professional resume data extractor and career consultant. Your task is to transform unstructured user input into a strict, professional JSON format.

### RULES:
1. **Fields**: Extract "personalInfo", "education", "experience", "projects", and "skills".
2. **Structure**: 
   - "personalInfo" must be an object with keys: name, email, phone, linkedin, github.
   - "education", "experience", and "projects" MUST be arrays of objects.
   - "skills" must be a single string (comma-separated).
3. **Consistency**: Use exact keys as specified. If information is missing for a field, use "" for strings and [] for arrays.
4. **Accuracy (CRITICAL)**: The "personalInfo" fields specially the name field must be EXACTLY as provided by the user. Do not change spellings, do not capitalize unless the user did, and do not invent fake contact info if missing.
5. **Experience Details**: For each experience, extract "title", "company", "dates", and "description".
"- If dates are missing, ALWAYS generate and provide a realistic timeframe (e.g., '2025 - Present'). NEVER leave this field empty."
6. **Project Details**: For each project, extract "title", "description", and "link".
"- If dates are missing, ALWAYS generate and provide a realistic timeframe (e.g., '2025 - Present'). NEVER leave this field empty."
7. **No Conversational Filler**: Do not include introductory text, markdown code blocks (e.g., \`\`\`json), or any explanations.
8. **Professional Enhancement**: Rewrite and improve the 'description' for each project and experience. 
   - Use the 'Action Verb + Task + Result' framework. 
   - Each description must be detailed and high-impact (around 50-80 words per entry).
   - Provide the output as a single string in a single line. 
   - Use industry-standard keywords to ensure it is 100% ATS-friendly.
   - Focus on quantifiable results (e.g., 'improved efficiency by 20%', 'reduced latency by 100ms').
9. **Skills Expansion & Optimization**: 
   - Extract and categorize skills into a single comma-separated string.
   - **Smart Context**: If a user mentions a specific stack (e.g., 'MERN'), automatically expand it to include essential tools (e.g., 'MongoDB, Express.js, React, Node.js, Redux, JWT, REST APIs').
   - **Professional Depth**: Always include relevant soft skills and industry-standard tools based on the role (e.g., 'Git, GitHub, Agile, Problem Solving, Unit Testing').
   - Ensure the skills are high-ranking keywords for ATS (Applicant Tracking Systems).

### EXPECTED JSON FORMAT:
{
  "personalInfo": { "name": "", "email": "", "phone": "", "linkedin": "", "github": "" },
  "education": [{ "university": "", "degree": "", "dates": "" }],
  "experience": [{ "title": "", "company": "", "dates": "", "description": "" }],
  "projects": [{ "title": "", "description": "", "link": "" }],
  "skills": ""
}

Return ONLY the JSON object.
`;
const today = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});
const createResume = async (prompt) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: RESUME_PARSER_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Today's date is ${today}.Extract and improve resume data from this text: "${prompt}"`,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.4,
    });
    let rawResponse = completion.choices[0]?.message?.content;
    const start = rawResponse.indexOf("{");
    const end = rawResponse.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("AI did not return valid JSON");
    }
    const cleanJson = rawResponse.substring(start, end + 1);
    const parsedData = JSON.parse(cleanJson);
    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    console.error("Internal Error:", error);
    return {
      success: false,
      message: "Failed to generate resume data",
    };
  }
};
const RESUME_PARSER = `
You are an expert AI Resume Architect. Your goal is to take messy, raw OCR/PDF text and reconstruct it into a high-quality, ATS-optimized JSON resume.

### CORE TASK:
Analyze the provided unstructured text, identify sections (Personal Info, Experience, Education, Projects, Skills), and map them into the required JSON structure.

### RECONSTRUCTION RULES:
1. **Deduplication**: If a name or email appears multiple times due to PDF headers/footers, extract it only once.
2. **Date Logic**: 
   - Extract actual dates if present. 
   - If missing, use today's context to provide a realistic timeframe (e.g., 'Jan 2025 - Present').
3. **Information Mapping**:
   - **Personal Info**: name, email, phone, linkedin, github.
   - **Experience**: title, company, dates, description.
   - **Projects**: title, description, link.
   - **Education**: university, degree, dates.
4. **Professional Enhancement (ATS Mastery)**:
   - Rewrite descriptions using: **Action Verb + Specific Task + Quantifiable Result**.
   - Ensure descriptions are 50-80 words per entry.
   - Example: "Developed a MERN stack app" -> "Architected a full-stack e-commerce platform using MongoDB, Express, React, and Node.js, implementing Redux for state management and JWT for secure authentication, resulting in a 40% improvement in page load speed and a 15% increase in user retention."
5. **Smart Skills Expansion**:
   - If you see "MERN", expand to include "MongoDB, Express.js, React, Node.js, REST APIs, JWT, Redux".
   - Always append standard tools like "Git, GitHub, Agile, VS Code, Postman".

### JSON STRUCTURE (Strictly follow this):
{
  "personalInfo": { "name": "", "email": "", "phone": "", "linkedin": "", "github": "" },
  "education": [{ "university": "", "degree": "", "dates": "" }],
  "experience": [{ "title": "", "company": "", "dates": "", "description": "" }],
  "projects": [{ "title": "", "description": "", "link": "" }],
  "skills": ""
}

### CRITICAL:
- Return ONLY the JSON object.
- No markdown code blocks.
- No conversational text.
- If a section is totally missing, return an empty array [] or empty string "".
`;

const resume = async (text) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: RESUME_PARSER,
      },
      {
        role: "user",
        content: `Today's date is ${today}.convert this given text: "${text}"`,
      },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.4,
  });
  let rawResponse = completion.choices[0]?.message?.content;
  const start = rawResponse.indexOf("{");
  const end = rawResponse.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return new Error("AI did not return valid JSON");
  }
  const cleanJson = rawResponse.substring(start, end + 1);
  const parsedData = JSON.parse(cleanJson);
  return {
    success: true,
    data: parsedData,
  };
};
module.exports = { improveDescription, createResume,resume };

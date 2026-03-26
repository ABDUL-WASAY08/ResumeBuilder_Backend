const { improveDescription, createResume, resume } = require("../Config/Groq.config");
const pdf = require("pdf-parse");

const ImprovedText = async (req, res, next) => {
  try {
    const { projects, experience, skills } = req.body;
    
    // Improved Projects logic
    let improvedProjects = (projects && projects.length > 0) 
      ? await Promise.all(projects.map(async (p) => {
          if (!p.description || p.description.trim() === "") return p;
          const improved = await improveDescription(p.description);
          return { ...p, description: improved };
        }))
      : [];

    // Improved Experience logic
    let improvedExperience = (experience && experience.length > 0)
      ? await Promise.all(experience.map(async (e) => {
          if (!e.description || e.description.trim() === "") return e;
          const context = `Job Title: ${e.title}, Company: ${e.company}. Original Description: ${e.description}`;
          const aiImproved = await improveDescription(context);
          return { ...e, description: aiImproved };
        }))
      : [];

    let finalSkills = (skills && skills.trim() !== "") 
      ? await improveDescription(`Categorize and improve these professional skills: ${skills}`)
      : skills || "";

    res.status(200).json({
      message: "updated",
      success: true,
      improvedExperience,
      improvedProjects,
      finalSkills,
    });
  } catch (error) {
    console.error("AI Improvement Error:", error);
    next(error); // Error middleware ko bhej dain
  }
};

const generateResume = async (req, res, next) => {
  try {
    const { userPrompt } = req.body;
    if (!userPrompt || userPrompt.trim().length < 20) {
      return res.status(400).json({ message: "Prompt is too short.", success: false });
    }
    const response = await createResume(userPrompt);
    if (response.success) {
      return res.status(200).json({ message: "One last step!", data: response.data, success: true });
    }
    res.status(500).json({ message: "AI generation failed", success: false });
  } catch (error) {
    next(error);
  }
};

const handleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File nahi mili!" });
    }
    const options = {
      pagerender: function() { return ""; }
    };

    const result = await pdf(req.file.buffer, options);
    
    const cleanText = result.text.replace(/[^\w\s]/g, "").trim();
    if (!result.text || cleanText.length < 20) {
      return res.status(400).json({ success: false, message: "Invalid PDF content." });
    }

    const response = await resume(result.text);
    if (response.success) {
      res.status(200).json({
        success: true,
        data: response.data,
        message: "successfull",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during parsing",
      error: error.message,
    });
  }
};

module.exports = { ImprovedText, generateResume, handleFile };
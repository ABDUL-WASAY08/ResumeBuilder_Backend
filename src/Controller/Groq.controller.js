const { response, text } = require("express");
const {
  improveDescription,
  createResume,
  resume,
} = require("../Config/Groq.config");
const pdf = require("pdf-parse");

const ImprovedText = async (req, res, next) => {
  try {
    const { projects, experience, skills } = req.body;
    let improvedProjects = [];
    if (projects && projects.length > 0) {
      improvedProjects = await Promise.all(
        projects.map(async (p) => {
          if (!p.description || p.description.trim() === "") return p;
          const improved = await improveDescription(p.description);
          return { ...p, description: improved };
        }),
      );
    } else {
      improvedProjects = projects || [];
    }
    let improvedExperience = [];
    if (experience && experience.length > 0) {
      improvedExperience = await Promise.all(
        experience.map(async (e) => {
          if (!e.description || e.description.trim() === "") return e;
          const context = `Job Title: ${e.title}, Company: ${e.company}. Original Description: ${e.description}`;
          const aiImproved = await improveDescription(context);
          return { ...e, description: aiImproved };
        }),
      );
    } else {
      improvedExperience = experience || [];
    }
    let finalSkills = skills || "";
    if (skills && skills.trim() !== "") {
      finalSkills = await improveDescription(
        `Categorize and improve these professional skills: ${skills}`,
      );
    }
    console.log(improvedExperience);
    res.status(200).json({
      message: "updated",
      success: true,
      improvedExperience,
      improvedProjects,
      finalSkills,
    });
  } catch (error) {
    console.error("AI Improvement Error:", error);
  }
};
const generateResume = async (req, res, next) => {
  try {
    const { userPrompt } = req.body;
    if (!userPrompt || userPrompt.trim().length < 20) {
      return res.status(400).json({
        message: "Prompt is too short. Please provide more details.",
        success: false,
      });
    }
    const requiredWords = [
      "Experience",
      "Education",
      "Skills",
      "Projects",
      "Name",
    ];
    const hasAtLeastOneWord = requiredWords.some((word) =>
      userPrompt.toLowerCase().includes(word.toLowerCase()),
    );
    const response = await createResume(userPrompt);
    if (response.success) {
      console.log(JSON.stringify(response.data));
      return res.status(200).json({
        message: "One last step!",
        data: response.data,
        success: true,
      });
    } else {
      return res.status(500).json({
        message: response.message || "Something went wrong with AI generation",
        success: false,
      });
    }
  } catch (error) {
    next(error);
  }
};
const handleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File nahi mili!" });
    }

    const parser = pdf({ data: req.file.buffer });
    const result = await parser.getText();
    await parser.destroy();
    const cleanText = result.text.replace(/[^\w\s]/g, "").trim();
    if (!result.text || cleanText.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Invalid PDF.",
      });
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

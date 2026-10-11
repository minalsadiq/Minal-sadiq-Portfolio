/* All portfolio content lives here. Edit this file to update the site. */
const D = {
  name: "Minal Sadiq",
  role: "Data Scientist & AI Engineer",
  email: "minalsadiq.ai@gmail.com",
  phone: "+92 309 1415861",
  wa: "923091415861",
  github: "https://github.com/minalsadiq",
  linkedin: "https://www.linkedin.com/in/minal-sadiq-4994b9372/",
  resume: "assets/docs/Minal_Sadiq_Resume.pdf",

  // Paste your Google Apps Script Web App URL here (see docs/BACKEND_SETUP.md).
  // This URL is public by design; never put passwords or API keys in this file.
  contactEndpoint: "https://script.google.com/macros/s/AKfycbyN8VxZXkyRpeno1mGpo210MkMDPfdzDeszdHpczXy6RilxcKSN5v8cVwlWT6vLSCk/exec",

  roles: ["Data Scientist", "AI Engineer", "Machine Learning Engineer"],
  intro: "Data Science and AI professional specializing in machine learning, deep learning, predictive analytics, computer vision and interactive Streamlit applications. I turn complex data into clear, usable intelligence.",
  about: "I build machine learning solutions end to end, from data preparation and modeling to deployed web apps, and I am currently completing a BS in Data Science alongside hands-on AI internships.",
  stats: [["5+", "Core AI models"], ["5", "Live deployed apps"], ["4+", "ML domains"], ["4", "AI & DS internships"]],

  skills: [
    ["Artificial Intelligence", "Data Science", "Machine Learning", "Deep Learning", "Generative AI", "Computer Vision", "Natural Language Processing"],
    ["Python", "TensorFlow", "Keras", "Scikit-Learn", "Pandas", "NumPy", "OpenCV", "SQL"],
    ["Exploratory Data Analysis", "Feature Engineering", "Predictive Modeling", "Model Evaluation", "Streamlit", "Git & GitHub"]
  ],

  experience: [
    { d: "Expected 06/2028", t: "BS Data Science", o: "University of Agriculture Faisalabad (UAF)", x: "Faisalabad, Punjab, Pakistan" },
    { d: "07/2026 - Present", t: "AI Intern", o: "WapExp Software House", x: "Building predictive ML models; data preparation with Python and Pandas." },
    { d: "07/2026 - Present", t: "Data Science Intern", o: "Aptura Tech Solutions (Remote)", x: "Dataset analysis in Python and R; improving model accuracy." },
    { d: "06/2026", t: "Data Scientist Intern", o: "CodeAlpha", x: "Extracted insights from large datasets to support data-driven decisions." },
    { d: "05/2026 - 06/2026", t: "AI Intern", o: "DecodeLabs (Remote)", x: "Built ML models for analysis; researched emerging AI technologies." },
    { d: "07/2025 - 10/2025", t: "Web Development Trainee", o: "Muslim Computer College Samundri", x: "Responsive layouts with HTML, CSS and JavaScript; Git workflows." }
  ],

  certs: [
    "Data Science Internship, Aptura Tech Solutions (2026)",
    "Data Scientist Internship, CodeAlpha (June 2026)",
    "AI Internship, Decode Labs (June 2026)",
    "Professional Web Development, Muslim Computer College (Oct 2025)"
  ],

  projects: [
    { name: "Marketing Campaign Response Modelling", cat: "ML Modeling", img: "assets/images/projects/marketing.jpg",
      desc: "End-to-end machine learning pipeline that predicts customer response to bank marketing campaigns.",
      tags: ["Python", "Classification", "Matplotlib"], code: "https://github.com/minalsadiq/Marketing-Campaign-Response-Modelling",
      live: "https://marketing-campaign-response-modelling-v7fxpgbwwfmwgc8xt9rwu4.streamlit.app/", liveLabel: "Live demo" },
    { name: "Apple Disease Detection using CNN", cat: "Computer Vision", img: "assets/images/projects/apple-disease.jpg",
      desc: "Convolutional neural network that identifies and classifies apple leaf diseases from images.",
      tags: ["TensorFlow", "CNN", "Python"], code: "https://github.com/minalsadiq/Apple-Disease-Detection-using-CNN",
      live: "https://github.com/minalsadiq/Apple-Disease-Detection-using-CNN/blob/main/README.md", liveLabel: "Details"},
    { name: "Telco Customer Churn Analytics", cat: "Predictive Analytics", img: "assets/images/projects/churn.jpg",
      desc: "Predictive modeling pipeline built during an internship to analyze churn factors and support retention.",
      tags: ["Pandas", "Scikit-Learn", "Seaborn"], code: "https://github.com/minalsadiq/Telco-Customer-Churn-Predictive-Analytics",
      live: "https://telco-customer-churn-predictive-analytics-c8oyhjvenuvrphqej6xd.streamlit.app/", liveLabel: "Live demo"},
    { name: "CardioPulse AI", cat: "Streamlit App", img: "assets/images/projects/cardiopulse.jpg",
      desc: "Machine learning web app for cardiovascular risk prediction with real-time assessment and interactive analytics.",
      tags: ["Python", "Streamlit", "Scikit-Learn"], code: "https://github.com/minalsadiq/Minal-AI-CardioPulse",
      live: "https://minal-ai-cardiopulse-9nofl4lxdqtf2vmmqexebg.streamlit.app/", liveLabel: "Live demo"}
  ],

  more: ["IMDB Sentiment Analysis (LSTM)", "AI Recommendation System", "OCR Text Recognition", "Sales Prediction", "Car Price Prediction", "Movie Rating Analysis", "Unemployment Analysis"]
};


# 📘 Markov Chains for Graph Homomorphism Sampling

This project explores the mixing time of Markov Chains used to sample homomorphisms from a bipartite pattern graph \( S \) to a target graph \( G \). It includes both a frontend for interactive visualization and a backend powered by Flask and NetworkX for graph operations.



## ⚙️ Installation

### 🔧 Backend (Python/Flask)

1. Navigate to the backend folder:  
  `cd backend`

2. Create and activate a virtual environment (if needed):  
  `python -m venv venv`  
  `source venv/bin/activate`  (On Windows: `venv\Scripts\activate`)

3. Install dependencies:  
  `pip install -r requirements.txt`

### 💻 Frontend (React/TypeScript)

1. Navigate to the frontend folder:  
  `cd frontend`

2. Install dependencies:  
  `npm install`

## 🛠️ Scripts

You can use the following `npm` scripts to run or test the project:

- `start-Concurrent`: Starts both frontend and backend concurrently   
- `tests`: Runs both frontend and backend tests

To run them:

```bash
npm run start-Concurrent      # Run full stack
npm run tests                 # Run all tests
```

## 📊 Features

- Interactive visualization of bipartite graphs and homomorphism updates  
- Regular and neighborhood-based update algorithms  
- Tracking of graph state and update steps  
- Server-side validation and transition logic

## 📘 Thesis

This repository accompanies the undergraduate dissertation titled  
**"The Mixing Time of Markov Chains for Homomorphism Sampling"**  
submitted to **Queen Mary University of London**.

## 👤 Author

**Tesfamaryam Ghezae**  
Email: ec211016@qmul.ac.uk  
GitHub: [LuciferArtemis](https://github.com/LuciferArtemis)

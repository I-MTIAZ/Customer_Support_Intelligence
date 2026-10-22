# Customer Support Intelligence

Customer Support Intelligence is an unsupervised machine learning project designed to explore patterns in customer-support conversations and identify potential areas for business improvement.

## Project Overview

The project analyzes over **1.5 million customer-support messages** using Natural Language Processing (NLP). Text preprocessing and TF-IDF vectorization were applied to prepare the data, followed by clustering experiments using K-Means, DBSCAN, and Gaussian Mixture Models (GMM).

A 19-component GMM was evaluated using 20,000 sampled messages and validated on 5,000 held-out messages. The analysis identified promising patterns in customer acknowledgments and app-related discussions, while highlighting limitations in separating overlapping topics.

## Web Application

The frontend provides a modern, responsive interface for exploring customer-support intelligence.

**Key features**

- Individual customer-message analysis
- CSV upload and bulk analysis interface
- Interactive insights and model information
- Light and dark themes
- Responsive design across devices

## Technology Stack

**Machine Learning:** Python, Scikit-learn, Pandas, TF-IDF, TruncatedSVD, GMM

**Frontend:** React, TypeScript, Tailwind CSS, Vite

**Deployment:** GitHub and Render

## Model Findings

The GMM achieved a held-out silhouette score of **-0.0350**, indicating limited overall cluster separation. Certain communication patterns were recognizable, but many clusters require further refinement and human interpretation.

## Current Status

The machine-learning research and evaluation are complete. The frontend has been developed, with backend integration planned to enable live predictions and CSV processing.

## Project Goal

To demonstrate how unsupervised NLP can support customer-conversation exploration, reveal recurring patterns, and provide a foundation for more effective customer-support analysi

# Customer_Support_Intelligence

Frontend-only web application for an exploratory NLP customer support research project.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Papa Parse for client-side CSV preview
- Lucide icons

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
```

The `dist/` directory can be served as a static site. On Render, use a **Static Site**, build command `npm install && npm run build`, publish directory `dist`.

## Boundaries

**This is a frontend preview only.** Analyze Message does not produce fabricated model predictions. CSV upload reads the file locally for column selection and previews up to 100 rows. Input is not sent to a server at this stage. A separate inference backend is required to load the trained TF-IDF, SVD, and GMM artifacts.

The GMM research reports weak cosine silhouette separation and provisional topic interpretations. Do not present its assignment probability as supervised accuracy.

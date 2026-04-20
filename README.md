# SmartStudy: AI-Powered Collaborative Study Planning System

**Final Project Group 4** **Team Members:** Jocelin Macias Juarez, Cameron Tofani, Abby Postel 

**Course:** CS5319 - Software Architecture & Design 

## 1. Project Overview

SmartStudy is an AI-powered educational tool designed to help university students optimize their learning through adaptive scheduling, progress tracking, and group collaboration. The system analyzes course workloads and student performance data to suggest the most efficient study paths.

## 2. Architecture Folder Structure

Per the project requirements, this repository contains two complete architectural implementations for comparison:

* **`/selected`**: Layered Monolithic Architecture (Recommended Architecture Choice)

* **`/unselected`**: Microservices Architecture

## 3. Implementation Platform

* **Frontend**: React.js (Node.js v18.0+)

* **Backend**: Python FastAPI (v3.9+)

* **Database**: PostgreSQL

* **Platform Configuration**: Ensure Node.js and Python are added to your system PATH. For the Microservices version, Docker Desktop is required to orchestrate the independent service containers.

## 4. Setup & Execution Instructions

### A. Executing the Selected Architecture (Layered Monolith)

**Frontend**:
```bash
cd selected/smartstudy-frontend
npm install
npm start
```

**Backend**:
```bash
cd selected/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### B. Executing the Unselected Architecture (Microservices)

**Frontend**:
```bash 
cd unselected/smartstudy-frontend
npm install
npm start
```

**Backend**:
```bash
cd unselected/backend
docker-compose up
```

## 5. Architectural Rationale & Comparison

**Rationale for Selecting the Layered Monolith:**

After implementing and simulating both candidate styles, Group 4 has selected the Layered Monolith as the final recommendation for the SmartStudy platform based on the following architectural drivers:

* **Development Velocity:** As a three-person team working within a 10-week semester, the Monolith allowed us to share a single codebase and unified data models. This prevented the overhead of managing complex service boundaries and allowed for rapid feature iteration.

* **System Performance:** Our system requires heavy data exchange between the AI Recommendation logic and the user's historical performance logs. In the Monolith, these interactions happen via fast, internal function calls. In the Microservices version, the network latency introduced by the API Gateway and inter-service HTTP requests added significant lag to the user experience.

* **Operational Simplicity:** The Monolith requires only one deployment target and a single database instance. For a student-focused productivity app in its initial phase, this drastically reduces the cost and complexity of monitoring, logging, and maintenance.

* **Refactorability:** Our "Business Logic" evolved significantly during development. A layered monolith allowed us to move logic between modules easily, whereas the Microservices architecture would have required multiple API contract changes across independent repositories.

**Comparison to Microservices (Unselected):**

While the Microservices approach offers superior horizontal scalability (allowing the AI service to scale independently) and better fault isolation, we determined that the increased complexity of managing distributed data and networked connectors was not justified for the current scale and requirements of SmartStudy.

**GitHub Repository Link:** https://github.com/camerontofani/SmartStudy

**Final Submission Name:** CS5319 Final Project Group 4-Juarez-Tofani-Postel



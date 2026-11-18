# Engineering Project Synopsis & Compliance Report

**Project Title:** Computer-Based Learning Tool for Mentally Challenged Students  
*(Modern Clinical/Inclusive Nomenclature: Multi-Sensory Computer-Assisted Learning Tool for Neurodivergent Learners and Special Education)*  
**Measurable Engineering Outcome:** Design and develop a web/browser-based learning tool as per the requirements of the special school.  
**Program Outcomes (POs):** PO5 (Modern Tool Usage), PO6 (The Engineer and Society)  
**Sustainable Development Goals (SDGs):** SDG 4 (Quality Education — Target 4.5 & 4.a)

---

## 1. Abstract
Children with intellectual disabilities, developmental delays, and neurodivergent conditions (such as Down syndrome, Autism Spectrum Disorder, and cerebral visual impairments) encounter severe pedagogical hurdles in conventional educational setups. Standard classroom tools often fail due to high cognitive load, lack of multi-sensory feedback, rigid pacing, and absence of automated Individualized Education Program (IEP) tracking. 

This project delivers **Prerana**, an accessible, browser-based assistive learning platform engineered specifically according to special school curricula (aligned with FACP - Functional Assessment Checklist for Programming and MDPS - Madras Developmental Proficiency Scale). The platform incorporates six core interactive modules: Shapes & Colors Discrimination, Daily Living Activities (ADL Sequencing), Emotional & Social Expression Literacy, Tangible Number Counting, Environmental Sound Matching, and a Sensory Calm Motor-Coordination Zone. Featuring Web Speech API narration, non-jarring synthetic Web Audio chimes, high-contrast and dyslexia-friendly typography toggles, and an automated Educator IEP Assessment Dashboard, the tool provides measurable, quantitative tracking of cognitive milestones while adhering to WCAG 2.1 AAA accessibility standards.

---

## 2. Problem Statement & Special School Requirements
### 2.1 The Challenge
Special education teachers face significant challenges:
1. **High Heterogeneity in Learner Ability:** Students in a single classroom exhibit disparate developmental ages, motor capabilities, and attention spans (ranging from Mild to Intensive support needs).
2. **Absence of Quantitative Progress Tracking:** Traditional paper-based checklists require manual observation, leading to subjective bias and immense documentation burden on special educators.
3. **Sensory & Motor Barriers:** Conventional computer software contains jarring sounds, tiny click targets, and flashing graphics that induce sensory overload or frustrate children with dyspraxia.

### 2.2 Special School Requirement Specifications (SRS)
* **R1: Multi-Sensory Scaffolding:** Simultaneous visual, auditory, and kinetic feedback for all interactive tasks.
* **R2: Errorless & Positive Reinforcement Learning:** Absence of punitive error states (red buzzers/failing scores); replacement with gentle hints, encouragement, and tactile retry mechanics.
* **R3: Individualized Education Program (IEP) Adaptability:** Dynamic modulation of cognitive load (e.g., toggling between 2 choices for high support and 4 choices for mild support).
* **R4: Motor-Friendly Ergonomics:** Touch and click targets exceeding 64px with generous hitboxes for switch-access and touchscreens.
* **R5: Gated Authentication & Role-Based Access Control:** Website content is gated behind dedicated Student and Teacher authentication portals; users without credentials can self-register via the "Create New Account" workflow.
* **R6: Offline & Multi-Network Resilience:** Works offline via Progressive Web App (PWA) caching; accessible across Wi-Fi, Ethernet, LAN, and mobile networks.

---

## 3. Mapping to Program Outcomes (POs) & Justification

### 3.1 PO5: Modern Tool Usage
* **Web Speech API (`SpeechSynthesis`):** Provides automated voice guidance, pronunciation assistance, and question narration for pre-literate and non-verbal students.
* **Web Audio API (`AudioContext`):** Synthesizes custom frequency-modulated audio waveforms dynamically to deliver pleasant harmonic chimes and bubble pops without relying on external MP3 downloads.
* **HTML5 Canvas 2D Engine:** Implemented double-buffered interactive graphics for motor-coordination tracking and sensory decompression.
* **Progressive Web App (PWA):** Service worker offline caching architecture (`sw.js` and `manifest.json`).

### 3.2 PO6: The Engineer and Society
* **Digital Inclusion for Vulnerable Populations:** Directly addresses the marginalization of mentally challenged and neurodivergent children in digital education.
* **Empowering Special Educators & Caregivers:** Eliminates subjective manual record-keeping by providing automated, objective metrics on student response latency, trial-to-success ratios, and milestone achievements.
* **Ethical and Inclusive UI/UX:** Built with trauma-informed and neurodiversity-affirming interaction design, avoiding flashing triggers and punitive negative reinforcement.

---

## 4. Mapping to UN Sustainable Development Goals (SDGs)

### SDG 4: Quality Education
* **Target 4.5:** Equal access to education and training for persons with disabilities.
* **Target 4.a:** Child- and disability-sensitive inclusive learning facilities.

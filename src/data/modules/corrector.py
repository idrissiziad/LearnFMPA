import json
import os
import re

def clean_subtopics():
    # 1. Load the valid subtopics from the text file
    subtopic_file = "Pharmacologie Subtopic.txt"
    if not os.path.exists(subtopic_file):
        print(f"Error: {subtopic_file} not found.")
        return

    with open(subtopic_file, "r", encoding="utf-8") as f:
        # Extract name without .pdf and strip whitespace
        valid_list = [line.strip().replace(".pdf", "") for line in f if line.strip()]

    # 2. Load the JSON data
    json_file = "Pharmacologie.json"
    if not os.path.exists(json_file):
        print(f"Error: {json_file} not found.")
        return

    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 3. Define Keyword Mapping for replacement logic
    # This helps assign the correct subtopic when current is "?" or invalid
    mapping = {
        "AINS": ["ains", "aspirine", "salicylique", "ibuprofène", "cox", "inflammatoire"],
        "Antalgiques": ["antalgique", "paracétamol", "morphine", "douleur", "palier", "tramadol", "codéine"],
        "Anti-hypertenseurs": ["hta", "hypertenseur", "bêta-bloquant", "iec", "ara ii", "calcique", "diurétique", "rénine"],
        "Chimiothérapie": ["cancer", "tumeur", "adn", "alkylant", "intercalant", "antimétabolite", "mitotique"],
        "Corticoïdes": ["corticoïde", "glucocorticoïde", "prednisone", "inflammation", "immunosuppresseur"],
        "Définitions et limites": ["oms", "définition", "pharmacovigilance", "pharmacocinétique", "pharmacodynamie", "indésirable", "ordonnance", "notification"],
        "Différentes familles d'antibiotiques": ["antibiotique", "bactérie", "pénicilline", "lactamine", "aminoside", "tétracycline", "macrolide", "spectre"],
        "Fonctions du Médicament": ["curative", "préventive", "diagnostique", "substitutive", "principe actif", "origine"],
        "Formes galéniques et voies d'administration": ["voie", "orale", "injectable", "sublingual", "absorption", "galénique", "comprimé", "gélule", "suppositoire"],
        "Médicaments antidiabétiques": ["diabète", "insuline", "glycémie", "metformine", "sulfamide", "hypoglycémiant"],
        "Médicaments de l'asthme": ["asthme", "bronchique", "respiratoire", "ventoline", "theophylline"],
        "Médicaments de l'hémostase": ["hémostase", "coagulation", "caillot", "héparine", "avk", "thrombose", "antiagrégant", "plaquettaire"],
        "Médicaments géneriques": ["générique", "bioéquivalence", "biodisponibilité", "princeps", "cmax", "tmax", "auc"],
        "Phases de développement du médicament": ["essai clinique", "phase i", "phase ii", "phase iii", "préclinique", "métabolisme", "distribution", "élimination", "cytochrome"],
        "Psychopharmacologie": ["neuroleptique", "psychose", "anxiolytique", "benzodiazépine", "antidépresseur", "parkinson", "l-dopa", "épilepsie", "anticholinergique"]
    }

    updated_count = 0

    # 4. Iterate and Replace
    for item in data:
        current_sub = item.get("Subtopic", "").strip()
        
        # Check if subtopic needs replacing
        if current_sub not in valid_list:
            found = False
            # Combine text fields to search for keywords
            search_text = (item["QuestionText"] + " " + 
                          item.get("Choice_A_Explanation", "") + " " +
                          item.get("Choice_E_Explanation", "")).lower()

            # Try to match keywords to valid subtopics
            for valid_name, keywords in mapping.items():
                if any(kw in search_text for kw in keywords):
                    item["Subtopic"] = valid_name
                    found = True
                    updated_count += 1
                    break
            
            # Fallback for specific missing matches
            if not found:
                if "cytochrome" in search_text or "phase i" in search_text:
                    item["Subtopic"] = "Phases de développement du médicament"
                elif "notification" in search_text:
                    item["Subtopic"] = "Définitions et limites"
                else:
                    # If no match found, use a default valid one or keep it to flag manually
                    item["Subtopic"] = "Définitions et limites" 
                    updated_count += 1

    # 5. Save the result
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"Task Complete.")
    print(f"Subtopics synced with official list.")
    print(f"Items corrected/replaced: {updated_count}")

if __name__ == "__main__":
    clean_subtopics()

import json
import os
import re
from fpdf import FPDF
from fpdf.enums import XPos, YPos

def clean_text(text):
    """Handles French accents and special characters for standard PDF fonts."""
    if not isinstance(text, str): return str(text)
    replacements = {
        '\u2019': "'", '\u2018': "'", '\u201c': '"', '\u201d': '"',
        '\u2026': '...', '\u2013': '-', '\u2014': '-',
        '\u0153': 'oe', '\u0152': 'OE', '\u00a0': ' '
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    return text.encode('latin-1', 'replace').decode('latin-1')

def get_sort_tuple(year_asked_str):
    """
    Parses a string like 'Juillet 2025 (Rattrapage)' 
    to return a sortable tuple: (-year, -month_index, priority)
    """
    months_map = {
        'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
        'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
    }
    
    s = year_asked_str.lower()
    
    # Extract 4-digit year
    year_match = re.search(r'(\d{4})', s)
    year = int(year_match.group(1)) if year_match else 0
    
    # Extract Month index
    month_idx = 0
    for m_name, m_val in months_map.items():
        if m_name in s:
            month_idx = m_val
            break
            
    # Session Priority (We want Rattrapage to show as "latest" if in the same month)
    # 0 = Rattrapage, 1 = Normale, 2 = Exceptionnelle, 3 = Others
    priority = 3
    if 'rattrapage' in s: priority = 0
    elif 'normale' in s: priority = 1
    elif 'exceptionnelle' in s: priority = 2

    # Return negative year/month for descending sort (2025 before 2024)
    return (-year, -month_idx, priority)

class PharmacologiePDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            self.set_font("Helvetica", "B", 18)
            self.cell(0, 12, "PHARMACOLOGIE", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.ln(2)

    def footer(self):
        self.set_y(-10)
        self.set_font("Helvetica", "I", 7)
        self.cell(0, 10, f"Pharmacologie - Page {self.page_no()}/{{nb}}", align="C")

def run():
    # Load all JSON files in directory
    json_files = [f for f in os.listdir('.') if f.endswith('.json')]
    if not json_files:
        print("Erreur: Aucun fichier JSON trouve.")
        return

    all_questions = []
    for f_name in json_files:
        try:
            with open(f_name, 'r', encoding='utf-8-sig') as f:
                content = json.load(f)
                if isinstance(content, list):
                    all_questions.extend(content)
                else:
                    all_questions.append(content)
        except Exception as e:
            print(f"Erreur lecture {f_name}: {e}")

    # Group questions by their "YearAsked" value
    grouped_data = {}
    for q in all_questions:
        label = q.get('YearAsked', 'Inconnu')
        if label not in grouped_data:
            grouped_data[label] = []
        grouped_data[label].append(q)

    # Convert groups to a sortable list of bundles
    bundles = []
    for label, qs in grouped_data.items():
        bundles.append({
            'label': label,
            'sort_key': get_sort_tuple(label),
            'questions': qs
        })

    # SORTING: Applying the key (Year Desc, Month Desc, Rattrapage First)
    bundles.sort(key=lambda x: x['sort_key'])

    pdf = PharmacologiePDF()
    pdf.set_margin(10)
    pdf.set_auto_page_break(auto=True, margin=10)
    pdf.add_page()
    
    global_q_list = []
    q_num = 1

    # --- SECTION I: EPREUVES ---
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "I. EPREUVES", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    for b in bundles:
        # Literal Header from YearAsked
        pdf.ln(4)
        pdf.set_fill_color(230, 230, 230)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 9, clean_text(b['label'].upper()), border=1, align='C', fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

        for q in b['questions']:
            global_q_list.append(q)
            
            # Subtopic
            pdf.set_font("Helvetica", "B", 9)
            sub = clean_text(q.get('Subtopic', 'General'))
            pdf.multi_cell(pdf.epw, 5, f"Q{q_num}. {sub}", border='T', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            
            # Question Text
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(pdf.epw, 4, clean_text(q.get('QuestionText', '')), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            
            # Options
            pdf.set_font("Helvetica", "", 8.5)
            for char in ['A', 'B', 'C', 'D', 'E']:
                txt = q.get(f"Choice_{char}_Text", "")
                if txt and txt != "NA":
                    pdf.set_x(14)
                    pdf.multi_cell(pdf.epw - 10, 4, f"{char}) {clean_text(txt)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            
            pdf.ln(1)
            q_num += 1

    # --- SECTION II: GRILLE DE CORRECTION ---
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "II. GRILLE DE CORRECTION", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 8)
    col_width = pdf.epw / 5
    
    for i, q in enumerate(global_q_list, 1):
        corrects = []
        has_gdr = any("[GDR]" in str(q.get(f"Choice_{c}_Explanation", "")).upper() for c in "ABCDE")

        for char in ['A', 'B', 'C', 'D', 'E']:
            expl = str(q.get(f"Choice_{char}_Explanation", "")).upper()
            is_correct = q.get(f"Choice_{char}_isCorrect")
            if has_gdr:
                if "[GDR]" in expl: corrects.append(char)
            else:
                if is_correct is True or str(is_correct).lower() == 'true': corrects.append(char)
        
        ans_str = ", ".join(corrects) if corrects else "???"
        pdf.cell(col_width, 7, f"Q{i:02}: {ans_str}", border=1, align='C', new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        if i % 5 == 0:
            pdf.ln(7)
            pdf.set_x(pdf.l_margin)

    output_fn = "Pharmacologie_Database_Export.pdf"
    pdf.output(output_fn)
    print(f"\nTermine! Fichier genere: {output_fn}")

if __name__ == "__main__":
    run()

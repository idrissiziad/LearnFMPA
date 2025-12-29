import json
import re
import os

def process_exam_json():
    # 1. Gestion du nom de fichier
    filename_raw = input("Entrez le nom du fichier JSON (sans l'extension) : ").strip()
    input_file = f"{filename_raw}.json"
    
    if not os.path.exists(input_file):
        print(f"Erreur : Le fichier '{input_file}' est introuvable.")
        return

    prefix = input("Entrez le préfixe pour les images (ex: VIH) : ").strip()

    # 2. Chargement du JSON
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Expression régulière mise à jour :
    # On autorise les chiffres, espaces, virgules, slashs, tirets et le mot "et"
    # ([ \d,/-]|et)+
    pattern = re.compile(r"\((?:Réf[:\s]+)?(?:Page|Diapo|Diapositives?)\s+(([ \d,/-]|et)+)\)", re.IGNORECASE)

    # 3. Traitement
    for item in data:
        for letter in ['A', 'B', 'C', 'D', 'E']:
            expl_key = f"Choice_{letter}_Explanation"
            img_key = f"Choice_{letter}_Image"
            
            if expl_key in item and item[expl_key]:
                explanation_text = item[expl_key]
                match = pattern.search(explanation_text)
                
                if match:
                    raw_content = match.group(1).lower()
                    
                    # 1. Normalisation : on remplace 'et' et '/' par des virgules pour simplifier
                    normalized = raw_content.replace('et', ',').replace('/', ',')
                    
                    # 2. Découpage par virgule
                    parts = normalized.split(',')
                    
                    final_numbers = []
                    for part in parts:
                        part = part.strip()
                        if not part: continue
                        
                        # Gestion du range (ex: 101-103)
                        if '-' in part:
                            range_nums = re.findall(r"\d+", part)
                            if len(range_nums) == 2:
                                start = int(range_nums[0])
                                end = int(range_nums[1])
                                # On s'assure que le range est croissant
                                if start <= end:
                                    # Limite de sécurité pour éviter les typos (max 20 images d'un coup)
                                    if end - start < 20:
                                        for n in range(start, end + 1):
                                            final_numbers.append(str(n))
                                    else:
                                        # Si range trop large, on ne prend que les bornes
                                        final_numbers.extend(range_nums)
                            else:
                                # Si le format du tiret est bizarre, on prend juste les chiffres
                                final_numbers.extend(re.findall(r"\d+", part))
                        else:
                            # Simple numéro
                            final_numbers.extend(re.findall(r"\d+", part))
                    
                    # 3. Formatage final des noms de fichiers
                    image_files = []
                    for num in final_numbers:
                        formatted_num = num.zfill(3)
                        image_files.append(f"{prefix}-{formatted_num}.avif")
                    
                    # On utilise set() pour supprimer les doublons éventuels, puis on rejoint
                    # (On utilise dict.fromkeys pour garder l'ordre original sans doublons)
                    unique_images = list(dict.fromkeys(image_files))
                    item[img_key] = ", ".join(unique_images)
                else:
                    item[img_key] = None
            elif f"Choice_{letter}_Text" in item:
                 if item[f"Choice_{letter}_Text"] is not None:
                    item[img_key] = None

    # 4. Sauvegarde
    output_file = f"updated_{input_file}"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"\nTraitement terminé avec succès !")
    print(f"Format des images : {prefix}-XXX.avif")

if __name__ == "__main__":
    process_exam_json()
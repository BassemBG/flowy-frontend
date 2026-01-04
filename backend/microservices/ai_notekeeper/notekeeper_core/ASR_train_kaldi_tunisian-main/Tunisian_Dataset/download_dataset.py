from datasets import load_dataset
import pandas as pd
import os

# Load dataset from HuggingFace
dataset = load_dataset("NadiaGHEZAIEL/English_to_Tunisian_Dataset")

# Create a local folder
save_path = "Tunisian_Dataset"
os.makedirs(save_path, exist_ok=True)

# Merge all splits (train / test / validation) into one CSV
all_rows = []

for split in dataset:
    df_split = pd.DataFrame(dataset[split])
    all_rows.append(df_split)

# Concatenate all splits
full_df = pd.concat(all_rows, ignore_index=True)

# Save final CSV file
file_path = os.path.join(save_path, "english_tunisian_dataset.csv")
full_df.to_csv(file_path, index=False)

print(f"\n✔ Dataset saved locally as → {file_path}")

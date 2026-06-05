import pandas as pd

def inspect(file_path, f):
    f.write("="*40 + "\n")
    f.write(f"Inspecting: {file_path}\n")
    try:
        df = pd.read_excel(file_path)
        f.write(f"Columns: {df.columns.tolist()}\n")
        f.write(f"Shape: {df.shape}\n")
        f.write("First 10 rows:\n")
        f.write(df.head(10).to_string() + "\n")
    except Exception as e:
        f.write(f"Error: {e}\n")

with open("scratch/inspect_result.txt", "w", encoding="utf-8") as f:
    inspect("D:\\Green Era Recyclers\\Green-Era-Recyclers\\data-input\\EWaste_Real_Models_200_Records.xlsx", f)
    inspect("D:\\Green Era Recyclers\\assessments.xlsx", f)
print("Inspection done! Saved to scratch/inspect_result.txt")

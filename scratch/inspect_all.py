import pandas as pd

df = pd.read_excel("D:\\Green Era Recyclers\\Green-Era-Recyclers\\data-input\\EWaste_Real_Models_200_Records.xlsx")
with open("scratch/inspect_result_all.txt", "w", encoding="utf-8") as f:
    f.write(df.to_string())
print("Saved all rows!")

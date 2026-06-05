import pandas as pd

xls = pd.ExcelFile("D:\\Green Era Recyclers\\Green-Era-Recyclers\\data-input\\EWaste_Real_Models_200_Records.xlsx")
print("Sheets in Excel:", xls.sheet_names)
for sheet in xls.sheet_names:
    df = pd.read_excel(xls, sheet)
    print(f"Sheet {sheet}: shape={df.shape}")

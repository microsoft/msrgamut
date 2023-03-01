import sys
from importlib import reload

import gamut

reload(gamut)

gr = gamut.GamutRegressor("C:/data/amesiowaall.csv")
gr.cleanData()
gr.chooseXCols(['MS Zoning','Lot Area','Neighborhood','Bldg Type','House Style','Overall Qual','Overall Cond','Year Built','Total Bsmt SF','1st Flr SF', '2nd Flr SF', 'Full Bath', 'Half Bath', 'Kitchen Qual', 'TotRms AbvGrd', 'Yr Sold', 'Sale Type', 'Sale Condition',  'Gr Liv Area'])
gr.chooseYCol('SalePrice')
gr.train()
gr.output_model_for_gamut("newames","C:/data/")

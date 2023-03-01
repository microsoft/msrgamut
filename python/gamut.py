import json
import math
import re

import interpret
import numpy as np
import pandas as pd
import sklearn
from interpret import show
from interpret.glassbox import (ExplainableBoostingClassifier,
                                ExplainableBoostingRegressor)


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return(int(obj))
        elif(isinstance(obj, np.int64)):
            return(int(obj))
        elif isinstance(obj, np.floating):
            return(float(obj))
        elif isinstance(obj, np.ndarray):
            return(obj.tolist())
        elif isinstance(obj, np.bool_):
            return(bool(obj))
        else:
            return(super(NpEncoder, self).default(obj))


class GamutRegressor:
    def __init__(self, datafile):
        self.dataset = pd.read_csv(datafile)
        self.cleanData_ = self.dataset
        self.Y = self.dataset.ix[:0]
        self.ebm = ExplainableBoostingRegressor()
        self.xcols = []

    def cleanData(self):
        nullcols = self.dataset.isnull().sum()
        bignullcols = list(nullcols[nullcols>40].index)
        nobignullX = self.dataset.drop(bignullcols, axis=1)
        impute1 = nobignullX.fillna(nobignullX.mean())
        impute2 = impute1.apply(lambda x:x.fillna(x.value_counts().index[0]))
        colnames = impute2.columns
        p = re.compile(' ')
        newcolnames = [re.sub(p,'_',x) for x in list(colnames)]
        impute2.columns = newcolnames
        # rename columns to one word
        self.cleanData_ = impute2

    def chooseXCols(self,cols=[]):
        p = re.compile(' ')
        newcolnames = [re.sub(p,'_',x) for x in list(cols)]
        self.xcols = newcolnames

    def chooseYCol(self, targetCol):
        p = re.compile(' ')
        newcolname = re.sub(p,'_',targetCol)
        self.Y = self.cleanData_[newcolname]

    def reinit(self):
        self.ebm = ExplainableBoostingRegressor()

    def train(self):
        self.ebm.fit(self.cleanData_[self.xcols], self.Y)
        self.createExplanations()

    def createExplanations(self):
        self.ebm_global = self.ebm.explain_global()
        self.ebm_local = self.ebm.explain_local(self.cleanData_[self.xcols], self.Y)

    def convert_to_globalgamutformat(self, optname="datasetname",allcolumns=False):
        themodel = self.ebm
        json = {}
        json['name']=optname+"-gaam"
        features = []
        globalModel = self.ebm_global
        model_names = globalModel.feature_names
        totnames = list(self.cleanData_.columns)
        notinmodel = [name for name in totnames if name not in model_names]
        influencearray = globalModel.data()['scores']
        for i,var in enumerate(globalModel.feature_names):
            localfeature = {}
            localfeature['name']=var
            localfeature['dtype']=globalModel.feature_types[i]
            localfeature['influence']={"diff":influencearray[i]}
            # create shape
            shape_data = globalModel.data(key=i)
            shaperecords = []
            for j,val in enumerate(shape_data['scores']):
                arec = {"pdep":val, "x":shape_data['names'][j],"sd":(shape_data['upper_bounds'][j]-shape_data['scores'][j])}
                shaperecords.append(arec)
            localfeature['shape']=shaperecords
            features.append(localfeature)
        if (allcolumns):
            for j,varname in enumerate(notinmodel):
                localfeature={}
                localfeature['name']=varname
                localfeature['dtype']='unused'
                localfeature['influence']=0.0
                localfeature['shape'] = [{"pdep":0,"x":0,"sd":0}]
                features.append(localfeature)
        localfeature = {'name':'intercept', 'dtype':'continuous','influence':0.0, 'value':themodel.intercept_,'shape':[{'pdep':0,'x':0,'sd':0}]}
        features.append(localfeature)
        json['features']=features
        return(json)

    def convert_to_localgamutformat(self,allcolumns=False):
        alocal = self.ebm_local
        globalModel = self.ebm_global
        model_names = globalModel.feature_names
        totnames = list(self.cleanData_.columns)
        notinmodel = [name for name in totnames if name not in model_names]
        nonna = self.cleanData_
        json = []
        for i in range(len(alocal.selector)):
            item = {}
            dataset = alocal.data(key=i)
            mydata = []
            for j,varname in enumerate(dataset['names']):
                localfeature={}
                localfeature['name']=varname
                localfeature['X']=dataset['values'][j]
                localfeature['pdep']=dataset['scores'][j]
                localfeature['confi_u_X'] = 0.0
                localfeature['confi_l_X'] = 0.0
                mydata.append(localfeature)
            if (allcolumns):
                for j,varname in enumerate(notinmodel):
                    localfeature={}
                    localfeature['name']=varname
                    if (type(nonna.iloc[i][varname]) == np.bool_):
                        localfeature['X']=bool(nonna.iloc[i][varname])
                    else:
                        localfeature['X']=nonna.iloc[i][varname]
                    localfeature['pdep']=0.0
                    localfeature['confi_u_X']=0.0
                    localfeature['confi_l_X']=0.0
                    mydata.append(localfeature)
            item['id'] = i
            item['data']=mydata
            item['y']=dataset['perf']['actual']
            json.append(item)
        return(json)

    def output_model_for_gamut(self, modelname, directory, allcolumns=False):
        gdata = self.convert_to_globalgamutformat(optname=modelname,allcolumns=allcolumns)
        ldata = self.convert_to_localgamutformat(allcolumns=allcolumns)
        gdata['rms'] = np.sqrt(np.mean(self.ebm_local.selector['Residual']**2))
        fileglobal = open(directory+modelname+'-gaam.json','w')
        json.dump(gdata,fileglobal, cls=NpEncoder)
        fileglobal.close()
        filelocal = open(directory+modelname+'-gaam-instance-data.json','w')
        json.dump(ldata,filelocal,cls=NpEncoder)
        filelocal.close()


#X = impute2.drop(['Order','PID','SalePrice'],axis=1)
#X = impute2[['MS Zoning','Lot Area','Neighborhood','Bldg Type','House Style','Overall Qual','Overall Cond','Year Built','Total Bsmt SF','1st Flr SF', '2nd Flr SF', 'Full Bath', 'Half Bath', 'Kitchen Qual', 'TotRms AbvGrd', 'Yr Sold', 'Sale Type', 'Sale Condition',  'Gr Liv Area']]
#y = impute2['SalePrice']
